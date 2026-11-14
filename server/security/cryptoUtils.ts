import crypto from 'crypto';

// Common breached/weak passwords blocklist (case-insensitive check)
const COMMON_PASSWORD_BLOCKLIST = new Set([
  'password1234!',
  'password12345!',
  'admin1234567!',
  'administrator1!',
  'welcome123456!',
  'soekarnohatta1!',
  'bandarasoetta1!',
  'wildlife12345!',
  'airport123456!',
  'qwertyuiop123!',
  '1234567890123!',
  'letmein123456!'
]);

/**
 * Hash a password using PBKDF2 with SHA-512 and salt (100,000 iterations)
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const bufA = Buffer.from(hashToVerify, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validate password against enterprise security policy:
 * - Minimum 12 characters
 * - Uppercase, lowercase, number, and special symbol
 * - Not in common password blocklist
 */
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 12) {
    return { valid: false, error: 'Kata sandi minimal harus 12 karakter.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Kata sandi harus mengandung minimal 1 huruf besar (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Kata sandi harus mengandung minimal 1 huruf kecil (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Kata sandi harus mengandung minimal 1 angka (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Kata sandi harus mengandung minimal 1 simbol/karakter khusus (!@#$%^&*).' };
  }
  if (COMMON_PASSWORD_BLOCKLIST.has(password.toLowerCase().trim())) {
    return { valid: false, error: 'Kata sandi terlalu umum/mudah ditebak. Pilih kombinasi yang lebih unik.' };
  }
  return { valid: true };
}

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32_ALPHABET[bytes[i] % 32];
  }
  return result;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate 6-digit TOTP code for a secret and counter (RFC 6238)
 */
export function generateTotpCode(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify TOTP code with drift tolerance of ±1 time step (30 seconds)
 */
export function verifyTotpCode(secretBase32: string, token: string): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) return false;
  const currentTimeStep = Math.floor(Date.now() / 1000 / 30);

  // Check windows: -1, 0, +1
  for (let window = -1; window <= 1; window++) {
    const expected = generateTotpCode(secretBase32, currentTimeStep + window);
    if (expected === token) {
      return true;
    }
  }
  return false;
}

/**
 * Generate otpauth:// URI for QR code generation
 */
export function generateOtpauthUri(email: string, secretBase32: string, issuer = 'WIII WHMS'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate 10 one-time emergency recovery codes
 */
export function generateRecoveryCodes(count = 10): { plaintextCodes: string[]; hashedCodes: string[] } {
  const plaintextCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars e.g. 'A1B2C3D4'
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plaintextCodes.push(formatted);
    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }

  return { plaintextCodes, hashedCodes };
}

/**
 * Verify a single recovery code against stored hashes
 */
export function verifyRecoveryCode(code: string, hashedCodes: string[]): { valid: boolean; remainingHashedCodes: string[] } {
  const normalized = code.trim().toUpperCase();
  const inputHash = crypto.createHash('sha256').update(normalized).digest('hex');

  const index = hashedCodes.findIndex(h => h === inputHash);
  if (index !== -1) {
    const remaining = [...hashedCodes];
    remaining.splice(index, 1);
    return { valid: true, remainingHashedCodes: remaining };
  }
  return { valid: false, remainingHashedCodes: hashedCodes };
}

/**
 * Append-only cryptographic hash calculation for audit logs.
 * SHA-256(previousHash | id | timestamp | actorUserId | action | entityType | entityId | result | correlationId | beforeJson | afterJson)
 */
export function computeAuditRowHash(
  previousHash: string,
  entry: {
    id: string;
    timestamp: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    result: string;
    correlationId: string;
    beforeValues?: Record<string, any> | null;
    afterValues?: Record<string, any> | null;
  }
): string {
  const beforeStr = entry.beforeValues ? JSON.stringify(entry.beforeValues) : 'null';
  const afterStr = entry.afterValues ? JSON.stringify(entry.afterValues) : 'null';

  const payload = [
    previousHash,
    entry.id,
    entry.timestamp,
    entry.actorUserId,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.result,
    entry.correlationId,
    beforeStr,
    afterStr
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export const GENESIS_AUDIT_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
