import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const requestCounts = new Map<string, { count: number; resetAt: number }>();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOriginsEnv = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOriginsEnv.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".replit.dev") || host.endsWith(".repl.co")) return true;
    if (host.endsWith(".onrender.com") || host.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
  else if (++current.count > 120) return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
  res.setHeader("Cache-Control", req.method === "GET" ? "private, max-age=15" : "no-store");
  return next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve static frontend SPA build in production if available
const candidateStaticPaths = [
  path.resolve(process.cwd(), "artifacts/grant-guardian/dist/public"),
  path.resolve(process.cwd(), "../grant-guardian/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
];

const clientDistPath = candidateStaticPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ error: "Guardian could not complete that operation", detail: process.env.NODE_ENV === "development" ? message : undefined });
});

export default app;
