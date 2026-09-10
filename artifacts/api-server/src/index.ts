import app from "./app";
import { logger } from "./lib/logger";
import { startAutonomousWatch } from "./lib/autonomous-watch";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  const watchIntervalMs = process.env["WATCH_INTERVAL_MS"]
    ? Number(process.env["WATCH_INTERVAL_MS"])
    : 3600_000;
  startAutonomousWatch(watchIntervalMs);

  logger.info({ port, watchIntervalMs }, "Server listening and autonomous background watch started");
});
