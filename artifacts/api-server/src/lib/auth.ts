import crypto from "node:crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "grant-guardian-sec-token-2026-ultra-secure-sign-key-9f8a";
const PBKDF2_ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha512";
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AuthTokenPayload {
  sub: number; // userId
  email: string;
  name: string;
  role: string;
  tenantSlug: string;
  iat: number;
  exp: number;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash a password using PBKDF2 with SHA-512 and a cryptographic 32-byte salt.
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(32).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Verify a password against a stored hash using constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const { hash } = hashPassword(password, storedSalt);
    const storedBuf = Buffer.from(storedHash, "hex");
    const derivedBuf = Buffer.from(hash, "hex");
    if (storedBuf.length !== derivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(storedBuf, derivedBuf);
  } catch {
    return false;
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Issue a cryptographically signed HMAC-SHA256 session token.
 */
export function createSessionToken(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  tenantSlug?: string | null;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantSlug: user.tenantSlug || `user-${user.id}`,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest();

  const encodedSignature = signature
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode an HMAC-SHA256 session token.
 * Uses timingSafeEqual on signatures and checks expiration.
 */
export function verifySessionToken(token: string): AuthTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest();

  let actualSignature: Buffer;
  try {
    let base64 = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    actualSignature = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const payload: AuthTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
