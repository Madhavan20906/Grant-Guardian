import { Router, type IRouter, type Request, type Response } from "express";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  createSessionToken,
} from "../lib/auth";
import { guardianStore, type UserRecord } from "../lib/store";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    labName: user.labName,
    institution: user.institution,
    focus: user.focus,
    proposalName: user.proposalName,
    initials: user.initials,
    tenantSlug: user.tenantSlug,
    createdAt: user.createdAt,
  };
}

/**
 * Register a new multi-tenant researcher account.
 */
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role = "PI",
      title = "Dr.",
      labName,
      institution,
      focus,
      proposalName,
      starterTemplate = "clean",
    } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "A valid researcher or investigator name is required." });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const passwordValidation = validatePasswordStrength(password || "");
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "Password does not meet enterprise security requirements.",
        details: passwordValidation.errors,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await guardianStore.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }

    const { hash, salt } = hashPassword(password);
    const user = await guardianStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hash,
      salt,
      role: typeof role === "string" ? role.trim() : "PI",
      title: typeof title === "string" ? title.trim() : "Dr.",
      labName: typeof labName === "string" && labName.trim() ? labName.trim() : `${name.trim()} Lab`,
      institution: typeof institution === "string" && institution.trim() ? institution.trim() : "Research University",
      focus: typeof focus === "string" && focus.trim() ? focus.trim() : "Grant Proposal Compliance",
      proposalName: typeof proposalName === "string" && proposalName.trim() ? proposalName.trim() : "New Research Grant",
      starterTemplate,
    });

    const token = createSessionToken(user);
    return res.status(201).json({
      message: "Account and isolated research workspace created successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Registration failed", detail: error?.message });
  }
});

/**
 * Log in with email and password. Protected with rate limiting.
 */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 10) {
        return res.status(429).json({
          error: "Too many failed login attempts. Please wait 2 minutes before retrying.",
        });
      }
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await guardianStore.getUserByEmail(cleanEmail);

    if (!user || !user.passwordHash || !user.salt) {
      const current = loginAttempts.get(ip) || { count: 0, resetAt: now + 120_000 };
      current.count += 1;
      loginAttempts.set(ip, current);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const matches = verifyPassword(String(password), user.passwordHash, user.salt);
    if (!matches) {
      const current = loginAttempts.get(ip) || { count: 0, resetAt: now + 120_000 };
      current.count += 1;
      loginAttempts.set(ip, current);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    loginAttempts.delete(ip);
    const token = createSessionToken(user);

    return res.json({
      message: "Authentication successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Login failed", detail: error?.message });
  }
});

/**
 * 1-Click login for judges and evaluators into demo accounts.
 */
router.post("/auth/demo-login", async (req: Request, res: Response) => {
  try {
    const slugOrId = req.body?.slugOrId || "elena";
    const userId = await guardianStore.getUserId(slugOrId);
    const user = await guardianStore.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "Demo persona not found." });
    }

    const token = createSessionToken(user);
    return res.json({
      message: `Signed into ${user.name} (${user.labName}) workspace.`,
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Demo login failed", detail: error?.message });
  }
});

/**
 * Get current authenticated user and tenant profile.
 */
router.get("/auth/me", authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    user: sanitizeUser(req.user),
  });
});

/**
 * Update authenticated user / laboratory profile settings.
 */
router.put("/auth/profile", authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required to update profile." });
  }

  const { name, title, labName, institution, focus, proposalName, initials } = req.body || {};
  const updated = await guardianStore.updateUserProfile(req.user.id, {
    name,
    title,
    labName,
    institution,
    focus,
    proposalName,
    initials,
  });

  if (!updated) {
    return res.status(404).json({ error: "User profile could not be updated." });
  }

  return res.json({
    message: "Profile and workspace settings updated successfully.",
    user: sanitizeUser(updated),
  });
});

/**
 * List available demo/evaluation accounts for quick-switching.
 */
router.get("/auth/demo-accounts", async (_req: Request, res: Response) => {
  const tenants = await guardianStore.listTenants();
  return res.json(
    tenants.map((t) => ({
      id: t.id,
      slug: t.tenantSlug,
      name: t.name,
      title: t.title,
      labName: t.labName,
      institution: t.institution,
      focus: t.focus,
      proposalName: t.proposalName,
      initials: t.initials,
      email: t.email,
    }))
  );
});

/**
 * Logout
 */
router.post("/auth/logout", (_req: Request, res: Response) => {
  return res.json({ message: "Signed out successfully." });
});

export default router;
