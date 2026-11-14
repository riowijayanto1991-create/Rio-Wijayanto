import { Router, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  authenticate,
  requireAuth,
  requirePermission,
  requireAirportScope,
  rateLimit,
  AuthenticatedRequest
} from './authMiddleware';
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  generateBase32Secret,
  generateTotpCode,
  verifyTotpCode,
  generateOtpauthUri,
  generateRecoveryCodes,
  verifyRecoveryCode
} from './cryptoUtils';
import { getPermissionsForRole, MANDATORY_MFA_ROLES } from './permissionMap';
import { securityDb } from './securityDb';
import { UserRole } from '../../src/types/security';

export const authRouter = Router();

// Short-lived MFA verification cache: mfaToken -> { userId, expiresAt }
const pendingMfaTokens = new Map<string, { userId: string; expiresAt: number }>();

// Short-lived MFA setup cache: userId -> { secret, plaintextCodes, hashedCodes }
const pendingMfaEnrollments = new Map<string, { secret: string; plaintextCodes: string[]; hashedCodes: string[] }>();

// Generic authentication error message to prevent account enumeration
const GENERIC_AUTH_ERROR = 'Email atau kata sandi tidak valid. Akun Anda dapat terkunci sementara setelah beberapa kali percobaan gagal.';

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/login
 * Rate limited to 5 attempts per minute per IP
 */
authRouter.post('/login', rateLimit(5, 60 * 1000), async (req, res: Response) => {
  const { email, password } = req.body || {};
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: GENERIC_AUTH_ERROR });
  }

  const user = securityDb.getUserByEmail(email);

  // Anti-enumeration: If user does not exist, run a dummy hash verification to prevent timing attacks
  if (!user) {
    verifyPassword(password, '0'.repeat(128), '0'.repeat(32));
    securityDb.appendAuditLog({
      actorUserId: 'ANONYMOUS',
      actorEmail: email,
      actorIp: ip,
      userAgent,
      action: 'AUTH_LOGIN_FAILED_UNKNOWN_USER',
      entityType: 'User',
      entityId: email,
      result: 'FAILED'
    });
    return res.status(401).json({ error: GENERIC_AUTH_ERROR });
  }

  // Check Account Lockout
  if (user.lockoutUntil) {
    const lockoutTime = new Date(user.lockoutUntil).getTime();
    if (Date.now() < lockoutTime) {
      const remainingMin = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));
      securityDb.appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorIp: ip,
        userAgent,
        action: 'AUTH_LOGIN_BLOCKED_LOCKOUT',
        entityType: 'User',
        entityId: user.id,
        result: 'DENIED'
      });
      return res.status(423).json({
        error: `Akun Anda sementara terkunci karena kegagalan berulang. Coba lagi dalam ${remainingMin} menit atau hubungi administrator.`
      });
    } else {
      // Lockout expired, reset attempts
      securityDb.updateUser(user.id, { failedLoginAttempts: 0, lockoutUntil: null });
    }
  }

  // Verify password with PBKDF2
  const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isMatch) {
    const attempts = user.failedLoginAttempts + 1;
    let lockoutUntil: string | null = null;

    // Lockout after 5 failed attempts for 15 minutes
    if (attempts >= 5) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    securityDb.updateUser(user.id, {
      failedLoginAttempts: attempts,
      lockoutUntil
    });

    securityDb.appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorIp: ip,
      userAgent,
      action: attempts >= 5 ? 'AUTH_ACCOUNT_LOCKED_OUT' : 'AUTH_LOGIN_FAILED_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      beforeValues: { attempts },
      result: 'FAILED'
    });

    return res.status(401).json({ error: GENERIC_AUTH_ERROR });
  }

  // Password matched! Reset failure count
  securityDb.updateUser(user.id, {
    failedLoginAttempts: 0,
    lockoutUntil: null,
    lastLoginAt: new Date().toISOString()
  });

  const isMfaMandatory = MANDATORY_MFA_ROLES.includes(user.role);

  // If user has MFA enrolled, require MFA verification step
  if (user.mfaEnrolled && user.mfaSecret) {
    const mfaToken = `mfa-${crypto.randomBytes(24).toString('hex')}`;
    pendingMfaTokens.set(mfaToken, {
      userId: user.id,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    });

    securityDb.appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorIp: ip,
      userAgent,
      action: 'AUTH_LOGIN_PASSWORD_VERIFIED_AWAITING_MFA',
      entityType: 'User',
      entityId: user.id,
      result: 'SUCCESS'
    });

    return res.json({
      requiresMfa: true,
      mfaToken,
      message: 'Masukkan 6 digit kode dari aplikasi Authenticator Anda.'
    });
  }

  // If user does not have MFA enrolled but it's mandatory, notify user to enroll immediately
  const session = securityDb.createSession(user.id, user.securityStamp, ip, userAgent);

  securityDb.appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorIp: ip,
    userAgent,
    action: 'AUTH_LOGIN_SUCCESS',
    entityType: 'Session',
    entityId: session.token,
    result: 'SUCCESS'
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      assignedAirports: user.assignedAirports,
      permissions: getPermissionsForRole(user.role),
      mustChangePassword: user.mustChangePassword,
      mfaEnrolled: user.mfaEnrolled,
      isMfaMandatory
    },
    sessionToken: session.token
  });
});

/**
 * POST /api/auth/verify-mfa
 * Rate limited to 10 attempts per minute per IP
 */
authRouter.post('/verify-mfa', rateLimit(10, 60 * 1000), async (req, res: Response) => {
  const { mfaToken, totpCode, recoveryCode } = req.body || {};
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!mfaToken) {
    return res.status(400).json({ error: 'Token MFA tidak disediakan atau sesi telah berakhir.' });
  }

  const pending = pendingMfaTokens.get(mfaToken);
  if (!pending || Date.now() > pending.expiresAt) {
    pendingMfaTokens.delete(mfaToken);
    return res.status(401).json({ error: 'Sesi verifikasi MFA telah kedaluwarsa. Silakan login kembali.' });
  }

  const user = securityDb.getUserById(pending.userId);
  if (!user || !user.isActive) {
    pendingMfaTokens.delete(mfaToken);
    return res.status(401).json({ error: 'Pengguna tidak ditemukan atau tidak aktif.' });
  }

  let verified = false;
  let usedRecoveryCode = false;

  // 1. Check TOTP Code
  if (totpCode && user.mfaSecret) {
    verified = verifyTotpCode(user.mfaSecret, totpCode.trim());
  }

  // 2. Check Recovery Code if TOTP failed or not provided
  if (!verified && recoveryCode && user.recoveryCodesHashed) {
    const recoveryCheck = verifyRecoveryCode(recoveryCode, user.recoveryCodesHashed);
    if (recoveryCheck.valid) {
      verified = true;
      usedRecoveryCode = true;
      // Consume recovery code
      securityDb.updateUser(user.id, {
        recoveryCodesHashed: recoveryCheck.remainingHashedCodes
      });
      securityDb.appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorIp: ip,
        userAgent,
        action: 'MFA_RECOVERY_CODE_CONSUMED',
        entityType: 'User',
        entityId: user.id,
        beforeValues: { remainingCodes: recoveryCheck.remainingHashedCodes.length },
        result: 'SUCCESS'
      });
    }
  }

  if (!verified) {
    securityDb.appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorIp: ip,
      userAgent,
      action: 'MFA_VERIFICATION_FAILED',
      entityType: 'User',
      entityId: user.id,
      result: 'FAILED'
    });
    return res.status(401).json({ error: 'Kode autentikasi 6-digit atau kode pemulihan salah.' });
  }

  // Success! Consume token & issue session
  pendingMfaTokens.delete(mfaToken);
  const session = securityDb.createSession(user.id, user.securityStamp, ip, userAgent);

  securityDb.appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorIp: ip,
    userAgent,
    action: usedRecoveryCode ? 'MFA_VERIFIED_VIA_RECOVERY_CODE' : 'MFA_VERIFIED_VIA_TOTP',
    entityType: 'Session',
    entityId: session.token,
    result: 'SUCCESS'
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      assignedAirports: user.assignedAirports,
      permissions: getPermissionsForRole(user.role),
      mustChangePassword: user.mustChangePassword,
      mfaEnrolled: user.mfaEnrolled,
      isMfaMandatory: MANDATORY_MFA_ROLES.includes(user.role)
    },
    sessionToken: session.token,
    usedRecoveryCode
  });
});

/**
 * POST /api/auth/enroll-mfa
 * Starts MFA TOTP enrollment: generates secret, otpauth URI, QR code, and 10 recovery codes
 */
authRouter.post('/enroll-mfa', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const secret = generateBase32Secret(20);
  const otpauthUri = generateOtpauthUri(user.email, secret, 'WIII WHMS');
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 2, scale: 6 });
  const { plaintextCodes, hashedCodes } = generateRecoveryCodes(10);

  pendingMfaEnrollments.set(user.id, {
    secret,
    plaintextCodes,
    hashedCodes
  });

  return res.json({
    secret,
    otpauthUri,
    qrCodeDataUrl,
    recoveryCodes: plaintextCodes,
    message: 'Pindai kode QR dengan aplikasi Authenticator (Google Authenticator / Microsoft Authenticator), lalu masukkan kode 6-digit untuk konfirmasi.'
  });
});

/**
 * POST /api/auth/confirm-mfa-enrollment
 * Confirms TOTP setup by verifying the first code
 */
authRouter.post('/confirm-mfa-enrollment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { code } = req.body || {};

  const pending = pendingMfaEnrollments.get(user.id);
  if (!pending) {
    return res.status(400).json({ error: 'Proses pendaftaran MFA belum dimulai atau telah berakhir.' });
  }

  const isValid = verifyTotpCode(pending.secret, String(code).trim());
  if (!isValid) {
    return res.status(400).json({ error: 'Kode verifikasi 6-digit salah. Pastikan jam pada perangkat Anda akurat.' });
  }

  // Commit MFA enrollment
  securityDb.updateUser(user.id, {
    mfaEnrolled: true,
    mfaSecret: pending.secret,
    recoveryCodesHashed: pending.hashedCodes
  });

  pendingMfaEnrollments.delete(user.id);

  securityDb.appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorIp: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    action: 'MFA_ENROLLED_SUCCESS',
    entityType: 'User',
    entityId: user.id,
    result: 'SUCCESS'
  });

  return res.json({
    success: true,
    message: 'MFA Authenticator berhasil diaktifkan untuk akun Anda.'
  });
});

/**
 * POST /api/auth/change-password
 * Enforces 12-char policy and rotates security stamp to invalidate old sessions
 */
authRouter.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
  }

  // Verify current password
  if (!verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
    return res.status(401).json({ error: 'Kata sandi saat ini tidak cocok.' });
  }

  // Validate new password policy
  const policyCheck = validatePasswordPolicy(newPassword);
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error });
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  const newSecurityStamp = crypto.randomBytes(16).toString('hex');

  // Update user and rotate security stamp
  securityDb.updateUser(user.id, {
    passwordHash: hash,
    passwordSalt: salt,
    securityStamp: newSecurityStamp,
    mustChangePassword: false,
    lastPasswordChangedAt: new Date().toISOString()
  });

  // Re-issue session for current client
  const newSession = securityDb.createSession(user.id, newSecurityStamp, req.ip || '127.0.0.1', req.headers['user-agent'] || 'unknown');

  securityDb.appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorIp: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    action: 'USER_PASSWORD_CHANGED',
    entityType: 'User',
    entityId: user.id,
    result: 'SUCCESS'
  });

  return res.json({
    success: true,
    message: 'Kata sandi berhasil diperbarui.',
    sessionToken: newSession.token
  });
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const activeSuperAdmins = securityDb.getActiveSuperAdminCount();

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      assignedAirports: user.assignedAirports,
      permissions: getPermissionsForRole(user.role),
      mustChangePassword: user.mustChangePassword,
      mfaEnrolled: user.mfaEnrolled,
      isMfaMandatory: MANDATORY_MFA_ROLES.includes(user.role)
    },
    systemSecurity: {
      activeSuperAdmins,
      superAdminWarning: activeSuperAdmins < 2 ? 'Peringatan Keamanan: Direkomendasikan memiliki minimal 2 SuperAdmin aktif untuk mencegah lockout.' : null
    }
  });
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    securityDb.deleteSession(req.sessionToken);
  }
  return res.json({ success: true, message: 'Berhasil logout.' });
});

// ==========================================
// 2. USER & ROLE MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/users
 * Scoped by airport if AirportAdmin
 */
authRouter.get('/users', requireAuth, requirePermission('Users.View'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let users = securityDb.getUsers();

  // If AirportAdmin, scope to assigned airports
  if (user.role === 'AirportAdmin') {
    users = users.filter(u => 
      u.assignedAirports.some(a => user.assignedAirports.includes(a))
    );
  }

  // Safe mapping (do not expose password hash, salts, or mfa secrets)
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    assignedAirports: u.assignedAirports,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    mfaEnrolled: u.mfaEnrolled,
    failedLoginAttempts: u.failedLoginAttempts,
    isLocked: !!(u.lockoutUntil && new Date(u.lockoutUntil).getTime() > Date.now()),
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt
  }));

  const activeSuperAdmins = securityDb.getActiveSuperAdminCount();

  return res.json({
    users: safeUsers,
    activeSuperAdmins,
    superAdminWarning: activeSuperAdmins < 2 ? 'Peringatan: Saat ini hanya ada 1 SuperAdmin aktif. Rekomendasi keamanan: minimal 2 SuperAdmin aktif.' : null
  });
});

/**
 * POST /api/users
 * Create a new user (SuperAdmin role CANNOT be assigned directly; requires two-person rule)
 */
authRouter.post('/users', requireAuth, requirePermission('Users.Manage'), (req: AuthenticatedRequest, res: Response) => {
  const creator = req.user!;
  const { email, fullName, role, assignedAirports, initialPassword } = req.body || {};

  if (!email || !fullName || !role || !initialPassword) {
    return res.status(400).json({ error: 'Email, Nama Lengkap, Peran, dan Kata Sandi Awal wajib diisi.' });
  }

  // PRIVILEGE RULE: SuperAdmin role CANNOT be assigned via standard create endpoint
  if (role === 'SuperAdmin') {
    return res.status(403).json({
      error: 'TIDAK DIIZINKAN: Peran SuperAdmin tidak dapat dibuat secara langsung. Buat akun terlebih dahulu, lalu ajukan promosi melalui mekanisme Two-Person Rule.'
    });
  }

  // AirportAdmin can only create users within their own assigned airports
  if (creator.role === 'AirportAdmin') {
    const invalidAirports = (assignedAirports || []).filter((a: string) => !creator.assignedAirports.includes(a));
    if (invalidAirports.length > 0) {
      return res.status(403).json({
        error: `TIDAK DIIZINKAN: Anda hanya dapat membuat pengguna untuk bandara kewenangan Anda [${creator.assignedAirports.join(', ')}].`
      });
    }
  }

  // Validate password policy
  const policyCheck = validatePasswordPolicy(initialPassword);
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error });
  }

  // Check unique email
  if (securityDb.getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email sudah terdaftar dalam sistem.' });
  }

  const { hash, salt } = hashPassword(initialPassword);
  const newUser = securityDb.createUser({
    email: email.toLowerCase().trim(),
    fullName: fullName.trim(),
    role: role as UserRole,
    assignedAirports: Array.isArray(assignedAirports) && assignedAirports.length > 0 ? assignedAirports : ['WIII'],
    isActive: true,
    mustChangePassword: true, // Force password change on first login
    mfaEnrolled: false,
    securityStamp: crypto.randomBytes(16).toString('hex'),
    passwordHash: hash,
    passwordSalt: salt,
    lastPasswordChangedAt: new Date().toISOString()
  });

  securityDb.appendAuditLog({
    actorUserId: creator.id,
    actorEmail: creator.email,
    actorIp: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: newUser.id,
    afterValues: { email: newUser.email, role: newUser.role, airports: newUser.assignedAirports },
    result: 'SUCCESS'
  });

  return res.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      assignedAirports: newUser.assignedAirports,
      mustChangePassword: newUser.mustChangePassword
    }
  });
});

/**
 * PATCH /api/users/:id
 * Update user status, assigned airports, or role
 */
authRouter.patch('/users/:id', requireAuth, requirePermission('Users.Manage'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;
  const targetUser = securityDb.getUserById(targetId);

  if (!targetUser) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  const { isActive, fullName, assignedAirports, role } = req.body || {};

  // INVARIANT 1: A user cannot change their own role!
  if (role && role !== targetUser.role && actor.id === targetUser.id) {
    return res.status(403).json({
      error: 'TIDAK DIIZINKAN: Anda tidak dapat mengubah peran Anda sendiri (Self-Role Modification Blocked).'
    });
  }

  // INVARIANT 2: SuperAdmin role can ONLY be granted or revoked via the Two-Person Rule!
  if (role && (role === 'SuperAdmin' || targetUser.role === 'SuperAdmin') && role !== targetUser.role) {
    return res.status(403).json({
      error: 'TIDAK DIIZINKAN: Perubahan peran SuperAdmin harus diajukan melalui mekanisme persetujuan Two-Person Rule.'
    });
  }

  // AirportAdmin scope enforcement
  if (actor.role === 'AirportAdmin') {
    const isTargetInScope = targetUser.assignedAirports.some(a => actor.assignedAirports.includes(a));
    if (!isTargetInScope) {
      return res.status(403).json({ error: 'Akses Ditolak: Pengguna berada di luar yurisdiksi bandara Anda.' });
    }
  }

  try {
    const beforeValues = {
      isActive: targetUser.isActive,
      role: targetUser.role,
      assignedAirports: targetUser.assignedAirports
    };

    const updated = securityDb.updateUser(targetId, {
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      ...(fullName ? { fullName: fullName.trim() } : {}),
      ...(role ? { role } : {}),
      ...(Array.isArray(assignedAirports) ? { assignedAirports } : {})
    });

    securityDb.appendAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: targetUser.id,
      beforeValues,
      afterValues: {
        isActive: updated.isActive,
        role: updated.role,
        assignedAirports: updated.assignedAirports
      },
      result: 'SUCCESS'
    });

    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Gagal memperbarui pengguna' });
  }
});

/**
 * DELETE /api/users/:id
 */
authRouter.delete('/users/:id', requireAuth, requirePermission('Users.Manage'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;

  if (actor.id === targetId) {
    return res.status(403).json({ error: 'TIDAK DIIZINKAN: Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  try {
    const target = securityDb.getUserById(targetId);
    if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

    securityDb.deleteUser(targetId);

    securityDb.appendAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: targetId,
      beforeValues: { email: target.email, role: target.role },
      result: 'SUCCESS'
    });

    return res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Gagal menghapus pengguna' });
  }
});

// ==========================================
// 3. TWO-PERSON RULE SUPERADMIN REQUESTS
// ==========================================

/**
 * POST /api/superadmin-requests
 * Step 1: Initiate promotion or revocation of SuperAdmin.
 * Requires re-entering the actor's password!
 */
authRouter.post('/superadmin-requests', requireAuth, requirePermission('SuperAdmin.Promote'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { targetUserId, action, reason, actorPassword } = req.body || {};

  if (!targetUserId || !action || !reason || !actorPassword) {
    return res.status(400).json({ error: 'Target User ID, Tindakan, Alasan, dan Konfirmasi Kata Sandi Aktor wajib diisi.' });
  }

  // Re-enter actor password verification
  if (!verifyPassword(actorPassword, actor.passwordHash, actor.passwordSalt)) {
    securityDb.appendAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'TWO_PERSON_REQUEST_REAUTH_FAILED',
      entityType: 'TwoPersonRequest',
      entityId: targetUserId,
      result: 'DENIED'
    });
    return res.status(401).json({ error: 'Verifikasi kata sandi Anda gagal. Konfirmasi ditolak.' });
  }

  // Actor cannot promote/revoke themselves
  if (actor.id === targetUserId) {
    return res.status(403).json({ error: 'TIDAK DIIZINKAN: Anda tidak dapat mengajukan hak istimewa SuperAdmin untuk diri Anda sendiri.' });
  }

  const target = securityDb.getUserById(targetUserId);
  if (!target) {
    return res.status(404).json({ error: 'Target pengguna tidak ditemukan.' });
  }

  // Prevent demoting the last active SuperAdmin
  if (action === 'REVOKE_SUPERADMIN' && target.role === 'SuperAdmin') {
    if (securityDb.getActiveSuperAdminCount() <= 1) {
      return res.status(400).json({ error: 'TIDAK DIIZINKAN: Tidak dapat mencabut hak SuperAdmin terakhir. Harus ada minimal 1 SuperAdmin aktif.' });
    }
  }

  const request = securityDb.createTwoPersonRequest({
    action,
    actorUserId: actor.id,
    actorEmail: actor.email,
    targetUserId: target.id,
    targetEmail: target.email,
    reason: reason.trim()
  });

  securityDb.appendAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorIp: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    action: 'TWO_PERSON_REQUEST_SUBMITTED',
    entityType: 'TwoPersonRequest',
    entityId: request.id,
    afterValues: { action, target: target.email, reason: request.reason },
    result: 'SUCCESS'
  });

  return res.json({
    success: true,
    request,
    message: 'Permintaan hak akses SuperAdmin berhasil dibuat dan menunggu persetujuan dari SuperAdmin kedua.'
  });
});

/**
 * GET /api/superadmin-requests
 * View pending requests
 */
authRouter.get('/superadmin-requests', requireAuth, requirePermission('SuperAdmin.Approve'), (_req: AuthenticatedRequest, res: Response) => {
  const requests = securityDb.getPendingTwoPersonRequests();
  return res.json({ requests });
});

/**
 * POST /api/superadmin-requests/:id/approve
 * Step 2: Second SuperAdmin approves the request after re-entering their password.
 */
authRouter.post('/superadmin-requests/:id/approve', requireAuth, requirePermission('SuperAdmin.Approve'), (req: AuthenticatedRequest, res: Response) => {
  const approver = req.user!;
  const requestId = req.params.id;
  const { approverPassword } = req.body || {};

  if (!approverPassword) {
    return res.status(400).json({ error: 'Konfirmasi kata sandi SuperAdmin penyetuju wajib diisi.' });
  }

  if (!verifyPassword(approverPassword, approver.passwordHash, approver.passwordSalt)) {
    return res.status(401).json({ error: 'Verifikasi kata sandi penyetuju gagal.' });
  }

  try {
    const approved = securityDb.approveTwoPersonRequest(requestId, approver.id, approver.email);

    securityDb.appendAuditLog({
      actorUserId: approver.id,
      actorEmail: approver.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'TWO_PERSON_REQUEST_APPROVED',
      entityType: 'TwoPersonRequest',
      entityId: approved.id,
      afterValues: { target: approved.targetEmail, action: approved.action },
      result: 'SUCCESS'
    });

    return res.json({
      success: true,
      request: approved,
      message: `Permintaan hak akses SuperAdmin untuk ${approved.targetEmail} telah disetujui dan diterapkan.`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Gagal menyetujui permintaan' });
  }
});

/**
 * POST /api/superadmin-requests/:id/reject
 */
authRouter.post('/superadmin-requests/:id/reject', requireAuth, requirePermission('SuperAdmin.Approve'), (req: AuthenticatedRequest, res: Response) => {
  const approver = req.user!;
  const requestId = req.params.id;
  const { reason } = req.body || {};

  try {
    const rejected = securityDb.rejectTwoPersonRequest(requestId, approver.id, approver.email, reason || 'Ditolak oleh SuperAdmin kedua');

    securityDb.appendAuditLog({
      actorUserId: approver.id,
      actorEmail: approver.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'TWO_PERSON_REQUEST_REJECTED',
      entityType: 'TwoPersonRequest',
      entityId: rejected.id,
      result: 'SUCCESS'
    });

    return res.json({ success: true, request: rejected });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Gagal menolak permintaan' });
  }
});

// ==========================================
// 4. AUDIT LOG & CRYPTOGRAPHIC HASH CHAIN
// ==========================================

/**
 * GET /api/audit-logs
 * Read-only, filterable audit log viewer (SuperAdmin global, AirportAdmin scoped)
 */
authRouter.get('/audit-logs', requireAuth, requirePermission('AuditLogs.View'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const queryAirport = req.query.airportId as string;
  const actionQuery = req.query.action as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

  let effectiveAirport = queryAirport;
  if (user.role === 'AirportAdmin') {
    // Force scope to assigned airports
    effectiveAirport = user.assignedAirports[0] || 'WIII';
  }

  const logs = securityDb.getAuditLogs({
    airportId: effectiveAirport,
    action: actionQuery,
    limit
  });

  return res.json({
    logs,
    totalReturned: logs.length
  });
});

/**
 * GET /api/audit-logs/verify-chain
 * Traverses cryptographic hash chain and verifies SHA-256 proofs
 */
authRouter.get('/audit-logs/verify-chain', requireAuth, requirePermission('AuditLogs.Verify'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = securityDb.verifyAuditChain();

  securityDb.appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorIp: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    action: 'AUDIT_CHAIN_INTEGRITY_VERIFIED',
    entityType: 'AuditLogChain',
    entityId: 'CHAIN_GLOBAL',
    afterValues: { isValid: result.isValid, verifiedEntries: result.verifiedEntries },
    result: result.isValid ? 'SUCCESS' : 'FAILED'
  });

  return res.json(result);
});
