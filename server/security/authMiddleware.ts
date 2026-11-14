import { Request, Response, NextFunction } from 'express';
import { Permission, UserAccount, UserSession } from '../../src/types/security';
import { hasPermission } from './permissionMap';
import { securityDb } from './securityDb';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  sessionToken?: string;
  userSession?: UserSession;
}

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests = 10, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      securityDb.appendAuditLog({
        actorUserId: 'RATE_LIMIT_EXCEEDED',
        actorEmail: 'unknown',
        actorIp: ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        action: 'RATE_LIMIT_BLOCKED',
        entityType: 'Endpoint',
        entityId: req.path,
        airportId: 'GLOBAL',
        result: 'DENIED'
      });
      return res.status(429).json({
        error: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    next();
  };
}

/**
 * Session verification middleware.
 * Validates session token, checks idle timeout, absolute lifetime,
 * and security stamp rotation (invalidation of active sessions upon role/password change).
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (!token) {
    return next(); // unauthenticated, proceed to requireAuth if protected
  }

  const session = securityDb.getSession(token);
  if (!session) {
    return next();
  }

  const user = securityDb.getUserById(session.userId);
  if (!user || !user.isActive) {
    securityDb.deleteSession(token);
    return next();
  }

  // Security Stamp Verification: If user's role or password changed, older sessions are invalid!
  if (user.securityStamp !== session.securityStamp) {
    securityDb.deleteSession(token);
    securityDb.appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorIp: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'SESSION_STAMP_MISMATCH_INVALIDATED',
      entityType: 'Session',
      entityId: session.token,
      result: 'DENIED'
    });
    return next();
  }

  req.user = user;
  req.sessionToken = token;
  req.userSession = session;
  next();
}

/**
 * Global fallback: Deny unauthenticated access
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autentikasi Diperlukan',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.'
    });
  }
  next();
}

/**
 * Permission-based policy authorization middleware.
 * Example: requirePermission('Users.Manage')
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi Diperlukan' });
    }

    if (!hasPermission(req.user.role, permission)) {
      securityDb.appendAuditLog({
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        actorIp: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        action: 'AUTHORIZATION_DENIED',
        entityType: 'Permission',
        entityId: permission,
        beforeValues: { requiredPermission: permission, userRole: req.user.role },
        result: 'DENIED'
      });

      return res.status(403).json({
        error: 'Akses Ditolak (403 Forbidden)',
        message: `Peran Anda (${req.user.role}) tidak memiliki izin kebijakan '${permission}'. Hubungi Super Administrator bandara.`
      });
    }

    next();
  };
}

/**
 * Enforce airport scoping on the server in every query/action
 */
export function requireAirportScope(airportParamKey = 'airportId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi Diperlukan' });
    }

    // SuperAdmin has global scope
    if (req.user.role === 'SuperAdmin' || req.user.assignedAirports.includes('*')) {
      return next();
    }

    const targetAirport = (
      req.params[airportParamKey] ||
      req.query[airportParamKey] ||
      req.body[airportParamKey] ||
      req.headers['x-airport-id'] ||
      'WIII'
    ).toString().toUpperCase();

    const allowed = req.user.assignedAirports.map(a => a.toUpperCase());

    if (!allowed.includes(targetAirport)) {
      securityDb.appendAuditLog({
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        actorIp: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        action: 'AIRPORT_SCOPE_VIOLATION_DENIED',
        entityType: 'Airport',
        entityId: targetAirport,
        airportId: targetAirport,
        beforeValues: { userAirports: req.user.assignedAirports, attemptedAirport: targetAirport },
        result: 'DENIED'
      });

      return res.status(403).json({
        error: 'Akses Bandara Terbatas (403 Forbidden)',
        message: `Akun Anda hanya memiliki hak akses untuk bandara [${req.user.assignedAirports.join(', ')}]. Akses ke bandara ${targetAirport} ditolak.`
      });
    }

    next();
  };
}
