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
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((value) => value.trim()) : false,
  credentials: Boolean(process.env.CORS_ORIGIN),
}));
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
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ error: "Guardian could not complete that operation", detail: process.env.NODE_ENV === "development" ? message : undefined });
});

export default app;
