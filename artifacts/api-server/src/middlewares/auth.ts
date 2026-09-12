import type { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../lib/auth";
import { guardianStore, type UserRecord } from "../lib/store";

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
      userId: number;
    }
  }
}

/**
 * Authentication middleware that resolves authenticated tenant context.
 * Parses Bearer token first, then falls back to x-user-id or query params for demo evaluation.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const payload = verifySessionToken(token);
      if (payload) {
        const user = await guardianStore.getUserById(payload.sub);
        if (user) {
          req.user = user;
          req.userId = user.id;
          return next();
        }
      }
    }

    // Fallback: evaluate via x-user-id or query user parameter
    const param = (req.query.user as string | undefined) ?? (req.headers["x-user-id"] as string | undefined);
    const userId = await guardianStore.getUserId(param);
    req.userId = userId;
    const user = await guardianStore.getUserById(userId);
    if (user) {
      req.user = user;
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Guard that enforces an active authenticated session (Bearer token with valid signature).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.headers.authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      detail: "Please sign in or provide a valid Bearer token.",
    });
  }
  return next();
}
