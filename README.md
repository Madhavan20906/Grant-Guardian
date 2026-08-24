# Grant Guardian

Grant Guardian is an autonomous research-operations agent for solo researchers and small labs. It watches two silent risks: citation rot (retractions and corrections) and compliance drift (IRB and funding deadlines). It automates repetitive investigation and drafting, while routing ambiguous calls to a human.

## What is real in this build

- A persistent PostgreSQL data model for users, citations, deadlines, activity, drafts, and preferences.
- An observable tool-first agent loop: Crossref metadata lookup, Retraction Watch lookup, Semantic Scholar one-hop reference traversal, then conservative reasoning.
- Direct retraction signals are flagged; second-order propagation risks are escalated instead of auto-decided.
- BibTeX/DOI ingestion via `POST /api/guardian/citations/import`.
- Compliance drafts are generated from the actual deadline and supplied lab context and saved as drafts. Nothing is submitted automatically.
- Rate limiting, short-lived GET caching, provider timeouts, structured error handling, and provider failure visibility.
- Optional Amazon Bedrock reasoning via `AWS_REGION` and `BEDROCK_MODEL_ID`. The deterministic safety policy remains active when Bedrock is unavailable.
- When `STRANDS_AGENT_URL` is configured, every live scan sends its tracked citations to the Python Strands service and records the returned agent trace; the local policy remains the safety boundary for persisted decisions.

## Run

Provision PostgreSQL and set `DATABASE_URL`. For optional model reasoning, set AWS credentials through the runtime secret manager (never commit them), plus `AWS_REGION` and `BEDROCK_MODEL_ID`.

```bash
pnpm install
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
```

Set `RETRACTION_WATCH_API_URL` to a live Retraction Watch-compatible endpoint. When `RETRACTION_WATCH_API_URL` is not set, the agent uses an offline fallback dataset containing verified benchmark DOIs (such as STAP cell paper retractions) for demonstration purposes. The agent explicitly labels fallback matches as `Retraction Watch (Offline Demo Fallback Dataset)` and unmatched DOIs as `Retraction Watch (Provider Failsafe Active — Bypassed Safe)` to maintain complete transparency in traces and UI audit logs.

Set `STRANDS_AGENT_URL` to the reachable URL of the Python service (for local development, `http://127.0.0.1:8010`).

Run the complete unit and route integration test suite with:

```bash
pnpm test
```

## Architecture

```mermaid
flowchart LR
  UI[React dashboard] --> API[Express API]
  API --> DB[(PostgreSQL / Drizzle)]
  API --> LOOP[Guardian agent loop]
  LOOP --> CR[Crossref]
  LOOP --> RW[Retraction Watch]
  LOOP --> SS[Semantic Scholar graph]
  LOOP --> POLICY[Safety policy]
  POLICY -->|clear direct signal| DB
  POLICY -->|ambiguous propagation| HUMAN[Decision log / human review]
  LOOP -. optional .-> BEDROCK[Amazon Bedrock]
```

The agent never submits a compliance report and never converts a second-order relationship into a direct retraction claim.

## Scope and submission disclosure

This submission intentionally targets one research workspace so the demo can focus on trustworthy agent behavior rather than account administration. It does not claim production multi-user authentication. AWS account/Builder ID association, licensed Retraction Watch access, and deployment configuration are submission prerequisites and are kept outside source control.