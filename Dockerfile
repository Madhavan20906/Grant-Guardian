# All-in-One Production Container for Grant Guardian (Render.com Deployment)
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production \
    PORT=10000 \
    STRANDS_AGENT_URL=http://127.0.0.1:8010

# 1. Install system utilities and Node.js 20 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm@10.5.2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install Python dependencies
COPY agent-service/requirements.txt ./agent-service/
RUN pip install --no-cache-dir -r agent-service/requirements.txt

# 3. Copy monorepo dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY lib/ ./lib/
COPY artifacts/ ./artifacts/
COPY agent-service/ ./agent-service/

# 4. Install Node dependencies and build all packages (libraries, frontend, and API server)
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm run typecheck:libs && pnpm -C artifacts/grant-guardian build && pnpm -C artifacts/api-server build

# 5. Copy startup script
COPY start.sh ./
RUN chmod +x ./start.sh

EXPOSE 10000

# Health check verifies Express and Strands are operational
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:10000/api/healthz || exit 1

ENTRYPOINT ["./start.sh"]
