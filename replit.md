# Grant Guardian

Grant Guardian is a single-workspace research-operations agent that checks citation integrity and prepares compliance drafts while escalating judgment calls to a researcher.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `AWS_REGION`, `BEDROCK_MODEL_ID`, `RETRACTION_WATCH_API_URL`, `STRANDS_AGENT_URL`
- Optional Python agent: `cd agent-service && pip install -r requirements.txt && uvicorn main:app --port 8010`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Agent: Strands Agents SDK (Python), with optional Amazon Bedrock Converse

## Where things live

## Where things live

- `artifacts/api-server/src/routes/guardian.ts` — persistence-backed API and agent orchestration
- `artifacts/api-server/src/lib/guardian-agent.ts` — provider tools, graph traversal, safety policy, and Bedrock reasoning
- `agent-service/main.py` — canonical Strands agent and tool definitions
- `lib/db/src/schema/index.ts` — PostgreSQL source-of-truth schema
- `artifacts/grant-guardian/src/pages/` — dashboard screens
- `lib/api-spec/openapi.yaml` — API contract source

## Architecture decisions

## Architecture decisions

- The first release is intentionally single-tenant for a reliable hackathon demo; the persistent user row establishes ownership boundaries without pretending to provide production identity management.
- Clear direct provider evidence is flagged automatically; one-hop propagation risk is always escalated because only the researcher can judge claim-level impact.
- Provider failures are evidence gaps, never negative findings. Timeouts and unavailable providers are retained in citation metadata.
- Compliance reports are saved as drafts only. The agent has no submission tool.
- Bedrock is optional for local development, but the Strands service is the canonical production agent path.

## Product

## Product

The dashboard tracks a bibliography, runs an observable citation scan, shows the evidence and reasoning trail, tracks compliance deadlines, generates reviewable drafts, and stores attention preferences. DOI/BibTeX import is available through the API. No report is submitted autonomously.

## User preferences

## User preferences

The demo workspace stores high-risk interrupts, weekly desk notes, and deadline reminders in PostgreSQL. Settings are workspace-level rather than browser-local.

## Gotchas

## Gotchas

- Run `pnpm --filter @workspace/db run push` before starting the API against a new database.
- `PORT` and `BASE_PATH` are required by the generated development configs.
- Set `RETRACTION_WATCH_API_URL` to a compatible licensed endpoint; there is no unauthenticated public Retraction Watch API.
- AWS credentials must be supplied through Replit Secrets or the deployment secret manager, never committed.
- This is a single-tenant hackathon build, not a claim of production identity/authentication.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
