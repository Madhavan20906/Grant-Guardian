import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  createSessionToken,
  verifySessionToken,
} from "./auth";

describe("Cryptographic Authentication & Password Security (10/10)", () => {
  describe("Password strength validation", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const result = validatePasswordStrength("Short1!");
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("8 characters")));
    });

    it("should reject passwords missing uppercase letters", () => {
      const result = validatePasswordStrength("lowercase123!");
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("uppercase")));
    });

    it("should reject passwords missing lowercase letters", () => {
      const result = validatePasswordStrength("UPPERCASE123!");
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("lowercase")));
    });

    it("should reject passwords missing numbers", () => {
      const result = validatePasswordStrength("NoNumberHere!");
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("number")));
    });

    it("should reject passwords missing special characters", () => {
      const result = validatePasswordStrength("NoSpecialChar123");
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("special character")));
    });

    it("should accept strong passwords meeting all requirements", () => {
      const result = validatePasswordStrength("QuantumBio#2026Lab!");
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe("PBKDF2-SHA512 Password Hashing & Constant-Time Verification", () => {
    it("should generate a secure 64-byte hex hash and 32-byte salt", () => {
      const { hash, salt } = hashPassword("SuperSecret!2026");
      assert.ok(hash);
      assert.ok(salt);
      assert.equal(hash.length, 128); // 64 bytes in hex = 128 chars
      assert.equal(salt.length, 64); // 32 bytes in hex = 64 chars
    });

    it("should verify correct password", () => {
      const { hash, salt } = hashPassword("ValidPassword#123");
      assert.equal(verifyPassword("ValidPassword#123", hash, salt), true);
    });

    it("should reject incorrect password", () => {
      const { hash, salt } = hashPassword("ValidPassword#123");
      assert.equal(verifyPassword("WrongPassword#123", hash, salt), false);
    });

    it("should generate different hashes for same password with different salts", () => {
      const hash1 = hashPassword("MySecretPass!1");
      const hash2 = hashPassword("MySecretPass!1");
      assert.notEqual(hash1.salt, hash2.salt);
      assert.notEqual(hash1.hash, hash2.hash);
    });
  });

  describe("HMAC-SHA256 Bearer Session Tokens", () => {
    const user = {
      id: 42,
      email: "researcher@lab.org",
      name: "Dr. Alice Turing",
      role: "PI",
      tenantSlug: "turing-lab",
    };

    it("should create and verify valid session token", () => {
      const token = createSessionToken(user);
      assert.ok(token);
      const decoded = verifySessionToken(token);
      assert.ok(decoded);
      assert.equal(decoded.sub, 42);
      assert.equal(decoded.email, "researcher@lab.org");
      assert.equal(decoded.name, "Dr. Alice Turing");
      assert.equal(decoded.tenantSlug, "turing-lab");
      assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
    });

    it("should reject tampered token signatures", () => {
      const token = createSessionToken(user);
      const parts = token.split(".");
      // Alter signature
      const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -4)}XXXX`;
      assert.equal(verifySessionToken(tampered), null);
    });

    it("should reject tampered payload", () => {
      const token = createSessionToken(user);
      const parts = token.split(".");
      // Alter payload (e.g. elevate sub/id)
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: 1, email: "hacked@lab.org" })).toString("base64");
      const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      assert.equal(verifySessionToken(tampered), null);
    });
  });
});
