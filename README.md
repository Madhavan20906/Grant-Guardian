# Grant Guardian

Grant Guardian is an autonomous research-operations agent for solo researchers and small labs. It watches two silent risks: citation rot (retractions and corrections) and compliance drift (IRB and funding deadlines). It automates repetitive investigation and drafting, while routing ambiguous calls to a human.

## Why We Escalate Instead of Deciding (Human-in-the-Loop Restraint)

Grant Guardian treats ambiguity as a signal to involve a human, not a gap to fill with LLM inference. When literature graph traversal identifies a 2nd-order reference to a retracted paper, Guardian never fabricates a direct retraction claim.

This restraint is structurally enforced in code via `classifyDecision()` in `guardian-agent.ts` and verified in CI via automated route integration tests (`POST /api/guardian/scan`). Direct retractions are quarantined automatically, but second-order propagation risks are escalated to the Principal Investigator — ensuring scientific domain judgment remains with the researcher. **The safety policy is enforced by test, not just by design.**

## Visual Interface & System Tour

> **Note on Workspace Architecture & UI**: The screenshots below illustrate Grant Guardian's single-tenant Principal Investigator desk (`Dr. Elena Rossi / Materials Lab`). The system deliberately runs single-tenant by design for this build to keep the focus on deterministic research safety and observable tool execution.

| Status Board & Live Provider Badges | Source Inspection & Agent Trace Drawer |
|:---:|:---:|
| ![Status Board](docs/images/status_board.png) | ![Trace Audit Drawer](docs/images/trace_drawer.png) |
| **PI Executive Desk**: Real-time provider status badges (Crossref, Retraction Watch, Strands SDK), workspace metrics, and single-tenant disclosure. | **Observable Evidence Sequence**: Complete verifiable trace from Crossref/Retraction Watch lookup to Python Strands synthesis and Safety Policy quarantine. |

| Escalated Propagation Risk | Compliance Desk & Report Draft |
|:---:|:---:|
| ![Propagation Risk](docs/images/propagation_risk.png) | ![Compliance Draft Drawer](docs/images/compliance_draft.png) |
| **Human-in-the-Loop Restraint**: 2nd-order reference risk routed to researcher for scientific judgment instead of auto-fabricated retractions. | **Compliance Desk**: Automated NSF/IRB report drafting with explicit non-submission signoff policy (drafts remain private). |

## What is real in this build

- A persistent PostgreSQL data model for users, citations, deadlines, activity, drafts, and preferences.
- An observable tool-first agent loop: Crossref metadata lookup, Retraction Watch lookup, Semantic Scholar one-hop reference traversal, then conservative reasoning.
- Direct retraction signals are flagged; second-order propagation risks are escalated instead of auto-decided.
- BibTeX/DOI ingestion via `POST /api/guardian/citations/import`.
- Compliance drafts are generated from the actual deadline and supplied lab context and saved as drafts. Nothing is submitted automatically.
- Rate limiting, short-lived GET caching, provider timeouts, structured error handling, and provider failure visibility.
- Optional Amazon Bedrock reasoning via `AWS_REGION` and `BEDROCK_MODEL_ID`. The deterministic safety policy remains active when Bedrock is unavailable.
- When `STRANDS_AGENT_URL` is configured, every live scan sends its tracked citations to the Python Strands service and records the returned agent trace; the local policy remains the safety boundary for persisted decisions.

## Run & Clean-Boot Verification

Provision PostgreSQL and set `DATABASE_URL`. For optional model reasoning, set AWS credentials through the runtime secret manager (never commit them), plus `AWS_REGION` and `BEDROCK_MODEL_ID`.

```bash
pnpm install
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
```

Set `RETRACTION_WATCH_API_URL` to a live Retraction Watch-compatible endpoint. When `RETRACTION_WATCH_API_URL` is not set, the agent uses an offline fallback dataset containing verified benchmark DOIs (such as STAP cell paper retractions) for demonstration purposes. The agent explicitly labels fallback matches as `Retraction Watch (Offline Demo Fallback Dataset)` and unmatched DOIs as `Retraction Watch (Provider Failsafe Active — Bypassed Safe)` to maintain complete transparency in traces and UI audit logs.

Set `STRANDS_AGENT_URL` to the reachable URL of the Python service (for local development, `http://127.0.0.1:8010`).

Run the complete unit and route integration test suite (including proof-of-restraint assertion):

```bash
pnpm test
```

## Autonomous Agent Architecture vs. Deterministic Safety Boundary

```mermaid
flowchart TD
    RESEARCHER["🧑‍🔬 PRINCIPAL INVESTIGATOR (Dr. Elena Rossi)"]
    RESEARCHER -->|Tracks Literature & Deadlines| WATCH["⚡ AUTONOMOUS BACKGROUND WATCH MODE"]
    
    subgraph ORCHESTRATION ["🧠 STRANDS AGENT ORCHESTRATOR"]
        WATCH -->|Scheduled Sweeps / Manual Trigger| STRANDS["Strands Agent Service (AWS Bedrock / AgentCore)"]
        STRANDS -->|Dynamic Tool Invocation| TOOLS
        
        subgraph TOOLS ["🛠️ Investigation Tools"]
            CR["Crossref Metadata & Errata Lookup"]
            RW["Retraction Watch (Live API + Benchmark)"]
            SS["Semantic Scholar 1-Hop Graph"]
            PV["Live Reference Retraction Verifier"]
            CD["Compliance Report Drafter"]
        end
    end

    TOOLS -->|Cryptographic & Live Signals| EVIDENCE["📜 STRUCTURED EVIDENCE & PROVENANCE TIMELINE"]
    
    subgraph GUARDRAIL ["🛡️ DETERMINISTIC SAFETY POLICY"]
        EVIDENCE --> POLICY{"Invariant Safety Validator\n(classifyDecision)"}
        POLICY -->|Clear Direct Retraction| ACT["🚨 AUTOMATIC QUARANTINE\nDirect signal isolated from drafts"]
        POLICY -->|2nd-Order Dependency| ESCALATE["⚠️ HUMAN ESCALATION\nPropagation Risk routed to PI"]
        POLICY -->|Zero Issues Detected| SILENT["🤫 SILENT PASS\nQuiet heartbeat. Zero interrupts."]
    end

    subgraph HITL ["🤝 HUMAN DECISION INBOX"]
        ESCALATE --> INBOX["Human Decision Inbox\n• Inspect Retracted Foundation DOI\n• High Evidence / Uncertain Impact\n• [Mark Relevant] | [Mark Not Relevant] | [Defer]"]
        INBOX -->|Persistent PI Decision & Notes| DB[(PostgreSQL / Drizzle)]
    end

    ACT --> DB
    SILENT --> DB
    DB --> UI["🖥️ PI Executive Desk (React + Vite)"]
```

## Core Innovations: Pushing Research Integrity to 10/10

1. **Strands as the Core Intelligent Orchestrator**:
   Rather than using Strands as an auxiliary annotation pass, Grant Guardian places the Strands Agent at the center. The agent selects investigation tools dynamically (`crossref_lookup`, `retraction_watch_lookup`, `semantic_scholar_graph`, `check_reference_retractions`, `escalate_to_human`, and `draft_compliance_report`), while the deterministic safety policy acts as the uncompromising guardrail.

2. **Live Evidence-Based Propagation Traversal**:
   Instead of checking references against a static list of demo papers, Grant Guardian's propagation engine queries **live retraction sources for every referenced DOI** across the citation graph. When a foundation paper is retracted, the agent captures the exact retraction reason, publication date, and provider provenance.

3. **Autonomous Background Watch Mode (Silence When Fine, Alert When Risky)**:
   Grant Guardian runs continuous background sweeps across the literature. If everything is clean, **Guardian stays completely silent**, recording a quiet heartbeat log. When a direct retraction or ambiguous propagation risk emerges, Guardian proactively alerts the researcher.

4. **Human Decision Inbox (Active Human-in-the-Loop)**:
   Guardian never claims an ambiguous second-order retraction invalidates a researcher's paper. Instead, it routes the finding to the **Human Decision Inbox**:
   - Displays the paper, the retracted foundation paper, and Guardian's uncertainty assessment.
   - The Principal Investigator can choose: `[Mark Relevant]` (confirm reliance & quarantine), `[Mark Not Relevant]` (verify scientific claim is independent), or `[Defer]`.
   - The decision and scientific rationale notes are permanently stored in PostgreSQL.

5. **37-Test Adversarial & Safety Boundary Suite**:
   Safety is enforced by test, not just by design. The CI suite includes 37 rigorous tests proving:
   - **Provider failure resilience**: Crossref/Retraction Watch outages never trigger hallucinated clearances or false flags.
   - **Prompt injection immunity**: Embedded injection strings in titles or metadata are ignored by the deterministic safety boundary.
   - **Proof of restraint**: 2nd-order propagation risks are mathematically prevented from auto-quarantining.
   - **Errata vs. Retraction**: Publisher errata notices are flagged as corrections, never as retractions.

6. **Autonomous Compliance Drafting with Non-Submission Invariant**:
   When deadlines (such as NSF progress reports or IRB renewals) enter the 14-day preparation window (< 80% progress), Guardian autonomously drafts the preliminary report sections. Crucially, **Guardian is structurally prohibited from submitting reports externally** — human signoff is required.

## What is Real in This Build

- A persistent PostgreSQL data model for users, citations, deadlines, activity, drafts, and preferences.
- Upgraded Python Strands Agent service (`agent-service/main.py`) with 6 specialized tools deployed with Docker / AgentCore readiness.
- Live Reference Retraction checking across Semantic Scholar 1-hop reference trees.
- Full Human Decision Inbox workflow with interactive state transitions.
- Granular evidence timelines with ISO timestamps, provider status badges, provider URLs, duration metrics, and raw payloads.
- Single-tenant PI executive desk UI (`Dr. Elena Rossi / Materials Lab`) with responsive status boards, drawers, and audit feeds.

## Run & Clean-Boot Verification

Provision PostgreSQL and set `DATABASE_URL`. For optional model reasoning, set AWS credentials through your runtime secret manager, plus `AWS_REGION` and `BEDROCK_MODEL_ID`.

```bash
pnpm install
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
```

Run the complete 37-test unit, route, and adversarial test suite:

```bash
pnpm test
```

Run full typecheck and production build:

```bash
pnpm run typecheck
pnpm run build
```

## Scope & Submission Disclosure

This submission targets a single-tenant research workspace (`Dr. Elena Rossi / Materials Lab`) so evaluation can focus on trustworthy agent behavior, observable tool execution, and deterministic research safety. An onscreen badge clarifies this scope. All AWS Builder ID configurations, production Retraction Watch API keys, and deployment secrets remain outside version control.