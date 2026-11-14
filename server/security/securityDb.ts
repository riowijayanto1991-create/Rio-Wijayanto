import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserAccount,
  UserRole,
  UserSession,
  TwoPersonRequest,
  AuditLogEntry,
  ChainVerificationResult
} from '../../src/types/security';
import {
  hashPassword,
  computeAuditRowHash,
  GENESIS_AUDIT_HASH,
  generateBase32Secret,
  generateRecoveryCodes
} from './cryptoUtils';

interface SecurityStoreSchema {
  users: UserAccount[];
  sessions: UserSession[];
  twoPersonRequests: TwoPersonRequest[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'securityStore.json');

class SecurityDatabase {
  private store: SecurityStoreSchema = {
    users: [],
    sessions: [],
    twoPersonRequests: [],
    auditLogs: []
  };

  private initialized = false;

  constructor() {
    this.ensureStoreLoaded();
  }

  private ensureStoreLoaded() {
    if (this.initialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir:', err);
      }
    }

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        this.store = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to load securityStore.json, starting fresh:', err);
      }
    }

    this.bootstrapSuperAdmin();
    this.initialized = true;
  }

  private persistStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist securityStore.json:', err);
    }
  }

  /**
   * Super Admin Bootstrap:
   * 1. No public registration for privileged roles.
   * 2. Seed SuperAdmin on first deployment via environment variables.
   * 3. Force password change and MFA enrollment at first login.
   * 4. If SuperAdmin exists, do nothing (never reset existing account password).
   */
  private bootstrapSuperAdmin() {
    const existingSuperAdmins = this.store.users.filter(u => u.role === 'SuperAdmin' && u.isActive);
    if (existingSuperAdmins.length > 0) {
      return; // Already initialized, never overwrite
    }

    const email = (process.env.SUPERADMIN_EMAIL || 'superadmin.whms@cgk-airport.co.id').toLowerCase().trim();
    const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || 'SoekarnoHatta2026!#WhmsSecure';

    const { hash, salt } = hashPassword(initialPassword);
    const mfaSecret = generateBase32Secret(20);
    const { plaintextCodes, hashedCodes } = generateRecoveryCodes(10);

    const superAdmin: UserAccount = {
      id: 'usr-superadmin-01',
      email,
      fullName: 'Super Administrator WHMS (Primary)',
      role: 'SuperAdmin',
      assignedAirports: ['*'], // Access all airports
      isActive: true,
      mustChangePassword: true, // Forced password change on first login
      mfaEnrolled: false, // Mandatory MFA setup on first login
      mfaSecret,
      recoveryCodesHashed: hashedCodes,
      securityStamp: crypto.randomBytes(16).toString('hex'),
      passwordHash: hash,
      passwordSalt: salt,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastPasswordChangedAt: new Date().toISOString()
    };

    // Also seed a secondary SuperAdmin (recommendation: min 2 active SuperAdmins)
    const secPass = 'WiiiBackup2026!#SecAdmin';
    const secHash = hashPassword(secPass);
    const secondarySuperAdmin: UserAccount = {
      id: 'usr-superadmin-02',
      email: 'secadmin.whms@cgk-airport.co.id',
      fullName: 'Super Administrator WHMS (Secondary)',
      role: 'SuperAdmin',
      assignedAirports: ['*'],
      isActive: true,
      mustChangePassword: true,
      mfaEnrolled: false,
      mfaSecret: generateBase32Secret(20),
      recoveryCodesHashed: generateRecoveryCodes(10).hashedCodes,
      securityStamp: crypto.randomBytes(16).toString('hex'),
      passwordHash: secHash.hash,
      passwordSalt: secHash.salt,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastPasswordChangedAt: new Date().toISOString()
    };

    // Seed sample role accounts for immediate multi-role testing
    const airAdminHash = hashPassword('AirportAdmin2026!#Wiii');
    const officerHash = hashPassword('WildlifeOfficer2026!#Wiii');
    const reviewerHash = hashPassword('DataReviewer2026!#Wiii');
    const viewerHash = hashPassword('ViewerAccess2026!#Wiii');

    const sampleUsers: UserAccount[] = [
      superAdmin,
      secondarySuperAdmin,
      {
        id: 'usr-airport-admin-01',
        email: 'airportadmin.cgk@cgk-airport.co.id',
        fullName: 'Bambang Soedirman (Airport Admin CGK)',
        role: 'AirportAdmin',
        assignedAirports: ['WIII'],
        isActive: true,
        mustChangePassword: false,
        mfaEnrolled: true,
        mfaSecret: generateBase32Secret(20),
        recoveryCodesHashed: generateRecoveryCodes(10).hashedCodes,
        securityStamp: crypto.randomBytes(16).toString('hex'),
        passwordHash: airAdminHash.hash,
        passwordSalt: airAdminHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        lastPasswordChangedAt: new Date().toISOString()
      },
      {
        id: 'usr-officer-01',
        email: 'officer.nurjaya@cgk-airport.co.id',
        fullName: 'Nurjaya (Wildlife Officer Pleton Alpha)',
        role: 'WildlifeOfficer',
        assignedAirports: ['WIII'],
        isActive: true,
        mustChangePassword: false,
        mfaEnrolled: false,
        securityStamp: crypto.randomBytes(16).toString('hex'),
        passwordHash: officerHash.hash,
        passwordSalt: officerHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        lastPasswordChangedAt: new Date().toISOString()
      },
      {
        id: 'usr-reviewer-01',
        email: 'reviewer.danil@cgk-airport.co.id',
        fullName: 'Danil S. (Data Reviewer & Quality Control)',
        role: 'DataReviewer',
        assignedAirports: ['WIII'],
        isActive: true,
        mustChangePassword: false,
        mfaEnrolled: true,
        mfaSecret: generateBase32Secret(20),
        recoveryCodesHashed: generateRecoveryCodes(10).hashedCodes,
        securityStamp: crypto.randomBytes(16).toString('hex'),
        passwordHash: reviewerHash.hash,
        passwordSalt: reviewerHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        lastPasswordChangedAt: new Date().toISOString()
      },
      {
        id: 'usr-viewer-01',
        email: 'viewer.dinas@cgk-airport.co.id',
        fullName: 'Viewer Otoritas Bandara Wilayah I',
        role: 'Viewer',
        assignedAirports: ['WIII'],
        isActive: true,
        mustChangePassword: false,
        mfaEnrolled: false,
        securityStamp: crypto.randomBytes(16).toString('hex'),
        passwordHash: viewerHash.hash,
        passwordSalt: viewerHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        lastPasswordChangedAt: new Date().toISOString()
      }
    ];

    this.store.users = sampleUsers;

    // Log genesis audit entry for bootstrapping
    this.appendAuditLog({
      actorUserId: 'SYSTEM_BOOTSTRAP',
      actorEmail: 'system@internal',
      actorIp: '127.0.0.1',
      userAgent: 'WHMS-Startup-Bootstrap/1.0',
      action: 'BOOTSTRAP_SUPERADMIN_SEED',
      entityType: 'User',
      entityId: superAdmin.id,
      airportId: 'GLOBAL',
      beforeValues: null,
      afterValues: { email: superAdmin.email, role: superAdmin.role },
      result: 'SUCCESS',
      correlationId: `corr-${Date.now()}`
    });

    this.persistStore();
  }

  // --- USER OPERATIONS ---

  public getUsers(filterAirport?: string): UserAccount[] {
    this.ensureStoreLoaded();
    if (!filterAirport || filterAirport === '*') {
      return this.store.users.slice();
    }
    return this.store.users.filter(u => 
      u.assignedAirports.includes('*') || u.assignedAirports.includes(filterAirport)
    );
  }

  public getUserById(id: string): UserAccount | null {
    this.ensureStoreLoaded();
    return this.store.users.find(u => u.id === id) || null;
  }

  public getUserByEmail(email: string): UserAccount | null {
    this.ensureStoreLoaded();
    const clean = email.toLowerCase().trim();
    return this.store.users.find(u => u.email.toLowerCase().trim() === clean) || null;
  }

  public getActiveSuperAdminCount(): number {
    this.ensureStoreLoaded();
    return this.store.users.filter(u => u.role === 'SuperAdmin' && u.isActive).length;
  }

  public createUser(userData: Omit<UserAccount, 'id' | 'createdAt' | 'lastLoginAt' | 'failedLoginAttempts' | 'lockoutUntil'>): UserAccount {
    this.ensureStoreLoaded();
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockoutUntil: null
    };

    this.store.users.push(newUser);
    this.persistStore();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount {
    this.ensureStoreLoaded();
    const idx = this.store.users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    const current = this.store.users[idx];

    // INVARIANT CHECK: Block deleting, disabling, or demoting the LAST active SuperAdmin
    if (current.role === 'SuperAdmin' && current.isActive) {
      const activeSuperAdmins = this.getActiveSuperAdminCount();
      if (activeSuperAdmins <= 1) {
        if (updates.isActive === false) {
          throw new Error('TIDAK DIIZINKAN: Tidak dapat menonaktifkan SuperAdmin terakhir. Harus ada minimal 1 SuperAdmin aktif.');
        }
        if (updates.role && updates.role !== 'SuperAdmin') {
          throw new Error('TIDAK DIIZINKAN: Tidak dapat menurunkan (demote) SuperAdmin terakhir. Harus ada minimal 1 SuperAdmin aktif.');
        }
      }
    }

    // If role changed, rotate security stamp to invalidate target user's active sessions!
    if (updates.role && updates.role !== current.role) {
      updates.securityStamp = crypto.randomBytes(16).toString('hex');
      this.invalidateUserSessions(id);
    }

    const updated = {
      ...current,
      ...updates
    };

    this.store.users[idx] = updated;
    this.persistStore();
    return updated;
  }

  public deleteUser(id: string): boolean {
    this.ensureStoreLoaded();
    const user = this.getUserById(id);
    if (!user) return false;

    // INVARIANT CHECK: Block deleting the LAST active SuperAdmin
    if (user.role === 'SuperAdmin' && user.isActive) {
      if (this.getActiveSuperAdminCount() <= 1) {
        throw new Error('TIDAK DIIZINKAN: Tidak dapat menghapus SuperAdmin terakhir dalam sistem.');
      }
    }

    this.store.users = this.store.users.filter(u => u.id !== id);
    this.invalidateUserSessions(id);
    this.persistStore();
    return true;
  }

  // --- SESSIONS ---

  public createSession(userId: string, securityStamp: string, ip: string, userAgent: string): UserSession {
    this.ensureStoreLoaded();
    const token = `sess-${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    const session: UserSession = {
      token,
      userId,
      securityStamp,
      ipAddress: ip,
      userAgent,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + 12 * 60 * 60 * 1000 // 12 hours absolute lifetime
    };

    this.store.sessions.push(session);
    this.persistStore();
    return session;
  }

  public getSession(token: string): UserSession | null {
    this.ensureStoreLoaded();
    const session = this.store.sessions.find(s => s.token === token);
    if (!session) return null;

    const now = Date.now();
    // Check absolute expiration (12 hours)
    if (now > session.expiresAt) {
      this.deleteSession(token);
      return null;
    }
    // Check idle timeout (30 minutes)
    if (now - session.lastActiveAt > 30 * 60 * 1000) {
      this.deleteSession(token);
      return null;
    }

    // Refresh last active
    session.lastActiveAt = now;
    return session;
  }

  public deleteSession(token: string) {
    this.ensureStoreLoaded();
    this.store.sessions = this.store.sessions.filter(s => s.token !== token);
    this.persistStore();
  }

  public invalidateUserSessions(userId: string) {
    this.ensureStoreLoaded();
    this.store.sessions = this.store.sessions.filter(s => s.userId !== userId);
    this.persistStore();
  }

  // --- TWO-PERSON RULE SUPERADMIN REQUESTS ---

  public createTwoPersonRequest(data: {
    action: 'PROMOTE_SUPERADMIN' | 'REVOKE_SUPERADMIN';
    actorUserId: string;
    actorEmail: string;
    targetUserId: string;
    targetEmail: string;
    reason: string;
  }): TwoPersonRequest {
    this.ensureStoreLoaded();

    // Expire in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const request: TwoPersonRequest = {
      id: `req-2p-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      action: data.action,
      actorUserId: data.actorUserId,
      actorEmail: data.actorEmail,
      targetUserId: data.targetUserId,
      targetEmail: data.targetEmail,
      reason: data.reason,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'PENDING'
    };

    this.store.twoPersonRequests.push(request);
    this.persistStore();
    return request;
  }

  public getPendingTwoPersonRequests(): TwoPersonRequest[] {
    this.ensureStoreLoaded();
    const now = new Date().toISOString();
    // Auto mark expired requests
    this.store.twoPersonRequests.forEach(r => {
      if (r.status === 'PENDING' && r.expiresAt < now) {
        r.status = 'EXPIRED';
      }
    });
    return this.store.twoPersonRequests.filter(r => r.status === 'PENDING');
  }

  public getTwoPersonRequestById(id: string): TwoPersonRequest | null {
    this.ensureStoreLoaded();
    return this.store.twoPersonRequests.find(r => r.id === id) || null;
  }

  public approveTwoPersonRequest(requestId: string, approverUserId: string, approverEmail: string): TwoPersonRequest {
    this.ensureStoreLoaded();
    const req = this.getTwoPersonRequestById(requestId);
    if (!req) {
      throw new Error('Permintaan persetujuan tidak ditemukan');
    }
    if (req.status !== 'PENDING') {
      throw new Error(`Permintaan tidak lagi pending (Status: ${req.status})`);
    }

    // TWO-PERSON RULE: Actor cannot approve their own request!
    if (req.actorUserId === approverUserId) {
      throw new Error('TIDAK DIIZINKAN (Two-Person Rule): Anda tidak dapat menyetujui permintaan hak akses istimewa yang Anda buat sendiri. Harus disetujui oleh SuperAdmin kedua.');
    }

    req.status = 'APPROVED';
    req.approverUserId = approverUserId;
    req.approverEmail = approverEmail;
    req.approvedAt = new Date().toISOString();

    // Execute target role update
    const targetUser = this.getUserById(req.targetUserId);
    if (targetUser) {
      const newRole: UserRole = req.action === 'PROMOTE_SUPERADMIN' ? 'SuperAdmin' : 'AirportAdmin';
      this.updateUser(targetUser.id, {
        role: newRole,
        assignedAirports: newRole === 'SuperAdmin' ? ['*'] : targetUser.assignedAirports
      });
    }

    this.persistStore();
    return req;
  }

  public rejectTwoPersonRequest(requestId: string, approverUserId: string, approverEmail: string, rejectReason: string): TwoPersonRequest {
    this.ensureStoreLoaded();
    const req = this.getTwoPersonRequestById(requestId);
    if (!req) throw new Error('Permintaan tidak ditemukan');
    if (req.status !== 'PENDING') throw new Error(`Permintaan tidak lagi pending`);

    if (req.actorUserId === approverUserId) {
      throw new Error('TIDAK DIIZINKAN: Penolakan harus diproses oleh SuperAdmin lain atau batalkan permintaan.');
    }

    req.status = 'REJECTED';
    req.approverUserId = approverUserId;
    req.approverEmail = approverEmail;
    req.approvedAt = new Date().toISOString();
    req.reason += ` | Ditolak: ${rejectReason}`;

    this.persistStore();
    return req;
  }

  // --- APPEND-ONLY AUDIT LOG WITH HASH CHAIN ---

  public appendAuditLog(entry: {
    actorUserId: string;
    actorEmail: string;
    actorIp: string;
    userAgent: string;
    action: string;
    entityType: string;
    entityId: string;
    airportId?: string;
    beforeValues?: Record<string, any> | null;
    afterValues?: Record<string, any> | null;
    result: 'SUCCESS' | 'DENIED' | 'FAILED';
    correlationId?: string;
  }): AuditLogEntry {
    this.ensureStoreLoaded();

    // Sanitize before/after to NEVER log passwords, tokens, MFA secrets, or recovery codes!
    const sanitize = (data: any): any => {
      if (!data || typeof data !== 'object') return data;
      const clone = { ...data };
      const sensitiveKeys = ['password', 'passwordHash', 'passwordSalt', 'token', 'mfaSecret', 'recoveryCodes', 'recoveryCodesHashed', 'secret'];
      for (const k of sensitiveKeys) {
        if (k in clone) clone[k] = '[REDACTED]';
      }
      return clone;
    };

    const cleanBefore = sanitize(entry.beforeValues);
    const cleanAfter = sanitize(entry.afterValues);

    const logs = this.store.auditLogs;
    const previousHash = logs.length > 0 ? logs[logs.length - 1].rowHash : GENESIS_AUDIT_HASH;
    const id = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const correlationId = entry.correlationId || `corr-${crypto.randomBytes(8).toString('hex')}`;

    const rowHash = computeAuditRowHash(previousHash, {
      id,
      timestamp,
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      result: entry.result,
      correlationId,
      beforeValues: cleanBefore,
      afterValues: cleanAfter
    });

    const newLog: AuditLogEntry = {
      id,
      timestamp,
      actorUserId: entry.actorUserId,
      actorEmail: entry.actorEmail,
      actorIp: entry.actorIp,
      userAgent: entry.userAgent,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      airportId: entry.airportId || 'GLOBAL',
      beforeValues: cleanBefore,
      afterValues: cleanAfter,
      result: entry.result,
      correlationId,
      previousHash,
      rowHash
    };

    this.store.auditLogs.push(newLog);
    this.persistStore();
    return newLog;
  }

  public getAuditLogs(filter?: { airportId?: string; action?: string; limit?: number }): AuditLogEntry[] {
    this.ensureStoreLoaded();
    let logs = this.store.auditLogs.slice();

    if (filter?.airportId && filter.airportId !== '*') {
      logs = logs.filter(l => l.airportId === filter.airportId || l.airportId === 'GLOBAL');
    }

    if (filter?.action) {
      const q = filter.action.toLowerCase();
      logs = logs.filter(l => l.action.toLowerCase().includes(q));
    }

    logs.reverse(); // newest first
    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }
    return logs;
  }

  /**
   * Cryptographic Hash Chain Verification Job.
   * Traverses from genesis row to current, recomputing SHA-256 at each step.
   * If any row was modified, inserted, or deleted, flags the exact entry where the hash broke!
   */
  public verifyAuditChain(): ChainVerificationResult {
    this.ensureStoreLoaded();
    const logs = this.store.auditLogs;
    const total = logs.length;

    if (total === 0) {
      return {
        isValid: true,
        totalEntries: 0,
        verifiedEntries: 0,
        tamperedEntryId: null,
        tamperedIndex: null,
        message: 'Audit log kosong. Rantai hash intak.',
        verifiedAt: new Date().toISOString()
      };
    }

    let expectedPrevHash = GENESIS_AUDIT_HASH;

    for (let i = 0; i < total; i++) {
      const row = logs[i];

      // 1. Verify previous hash pointer
      if (row.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalEntries: total,
          verifiedEntries: i,
          tamperedEntryId: row.id,
          tamperedIndex: i,
          message: `PELANGGARAN INTEGRITAS TERDETEKSI pada baris index #${i} (ID: ${row.id}): Pointer previousHash tidak sesuai. Terdeteksi penyisipan, manipulasi, atau penghapusan baris riwayat.`,
          verifiedAt: new Date().toISOString()
        };
      }

      // 2. Recompute row hash from content
      const calculatedHash = computeAuditRowHash(row.previousHash, {
        id: row.id,
        timestamp: row.timestamp,
        actorUserId: row.actorUserId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        result: row.result,
        correlationId: row.correlationId,
        beforeValues: row.beforeValues,
        afterValues: row.afterValues
      });

      if (row.rowHash !== calculatedHash) {
        return {
          isValid: false,
          totalEntries: total,
          verifiedEntries: i,
          tamperedEntryId: row.id,
          tamperedIndex: i,
          message: `MANIPULASI DATA TERDETEKSI pada baris #${i} (ID: ${row.id}): Nilai hash kriptografis tidak cocok dengan payload data baris ini.`,
          verifiedAt: new Date().toISOString()
        };
      }

      expectedPrevHash = row.rowHash;
    }

    return {
      isValid: true,
      totalEntries: total,
      verifiedEntries: total,
      tamperedEntryId: null,
      tamperedIndex: null,
      message: `Semua ${total} baris audit log terverifikasi aman dan otentik dengan rantai hash SHA-256.`,
      verifiedAt: new Date().toISOString()
    };
  }
}

export const securityDb = new SecurityDatabase();
