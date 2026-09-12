#!/bin/sh
set -e

export STRANDS_AGENT_URL="http://127.0.0.1:8010"
export PORT="${PORT:-10000}"

echo "======================================================"
echo " Starting Grant Guardian All-in-One Service"
echo " Port: ${PORT}"
echo " Strands Internal Agent: ${STRANDS_AGENT_URL}"
echo "======================================================"

# 1. Start Python Strands Agent on internal port 8010
echo "[1/2] Launching Python Strands Agent on internal port 8010..."
cd /app/agent-service
python -m uvicorn main:app --host 127.0.0.1 --port 8010 &
AGENT_PID=$!

# Wait for Python agent healthcheck
echo "Verifying Strands Agent availability..."
RETRY_COUNT=0
MAX_RETRIES=30
while ! curl -s http://127.0.0.1:8010/health > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Notice: Strands Agent health check timed out; continuing."
    break
  fi
  sleep 0.5
done
echo "Strands Agent ready (PID: ${AGENT_PID})."

# 2. Start Express API Server (serves React SPA on / and API on /api/*)
echo "[2/2] Launching Express Server on port ${PORT}..."
cd /app/artifacts/api-server
exec node ./dist/index.mjs
