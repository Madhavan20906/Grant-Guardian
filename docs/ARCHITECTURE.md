# Grant Guardian Architecture Specification

![Grant Guardian Architecture](architecture-diagram.svg)

## 1. System Overview

Grant Guardian is an autonomous research integrity and grant compliance agent designed for Principal Investigators (PIs), research labs, and academic institutions. The system operates on a dual-engine architecture:

1. **Python Strands Agent Core (`agent-service/`)**: An intelligent multi-step reasoning orchestrator running on Python 3.11 with AWS Bedrock (`Claude 3.5 Sonnet v2`) and the Strands Agents SDK. It controls 6 specialized tools for registry querying, 1-hop reference graph traversal, concurrent citation verification, and compliance drafting.
2. **Deterministic Safety Policy (`artifacts/api-server/src/lib/guardian-agent.ts`)**: A rule-based mathematical guardrail (`classifyDecision()`) that enforces immutable scientific invariants. Untrusted LLM outputs or prompt injections are barred from altering quarantine states.

---

## 2. Component Tiers

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│   • Executive Desk        • Trace Drawer         • Interactive Graph   │
│   • Human Decision Inbox  • Blast Radius Map     • Compliance Center   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Express API Server (Node.js :3001)                  │
│   • Autonomous Watch Scheduler (Cron / Background Sweeps)              │
│   • Fast-Failover Database Adapter (Drizzle ORM + In-Memory Fallback)  │
│   • Multi-Tenant User Context Resolver                                 │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    │ HTTP /scan                     │ Drizzle ORM
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Python Strands Service (:8010)      │  │     PostgreSQL Database      │
│  • AWS Bedrock / AgentCore Manifest  │  │  • users (Partition key)     │
│  • 6 Specialized Scientific Tools    │  │  • citations (userId FK)     │
│  • Dynamic Reasoning Loop            │  │  • deadlines (userId FK)     │
│  • ThreadPool Parallel Verification  │  │  • activities (userId FK)    │
│  • 7-Step Provenance Generator       │  │  • drafts (userId FK)        │
└───────────────────┬──────────────────┘  └──────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Deterministic Safety Boundary                     │
│                           classifyDecision()                           │
│                                                                        │
│   Direct Retraction    ➔ Automatic Quarantine from Proposal Bibliographies│
│   2nd-Order Dependency ➔ Mandatory Escalation to Human Decision Center │
│   Clean Literature     ➔ Silent Heartbeat (Quiet by Default)           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 6 Specialized Scientific Tools

| Tool Name | Scope & Mechanism | Downstream Impact |
|:---|:---|:---|
| `crossref_lookup` | Queries Crossref REST API for formal retraction notices, `update-to` relations, and publisher errata. | Provides ground-truth publisher status. |
| `retraction_watch_lookup` | Queries Retraction Watch records and offline benchmark register for confirmed retraction reasons and dates. | Identifies discredited or fraudulent manuscripts. |
| `semantic_scholar_graph` | Dynamically fetches 1-hop outgoing references from the paper's bibliography. | Unveils hidden foundational dependencies. |
| `check_reference_retractions` | Concurrently checks all referenced child DOIs against retraction registries using a `ThreadPoolExecutor`. | Detects multi-hop propagation cascades in seconds. |
| `escalate_to_human` | Generates a structured escalation package with root DOI, child DOI, and uncertainty assessment. | Routes decision to PI without auto-fabricating claims. |
| `draft_compliance_report` | Assembles preliminary NSF/NIH narrative sections from tracked milestones and citations. | Enforces strict non-submission invariant (PI signoff required). |

---

## 4. The Deterministic Safety Boundary (`classifyDecision`)

Why an LLM alone cannot make research integrity decisions:
- **Hallucinated Retractions**: LLMs often assert a paper is retracted based on controversial discourse rather than publisher records.
- **Premature Auto-Quarantine**: A downstream paper may cite a retracted paper only in its introduction to dispute its findings or replicate its failure. An automated system that blindly retracts downstream papers destroys valid scientific work.
- **Proof-of-Restraint**: `classifyDecision()` deterministically guarantees that:
  1. If `direct_retraction === true` ➔ `QUARANTINE_CLAIM` (Automatic quarantine).
  2. If `has_propagation_risk === true` ➔ `ESCALATE_TO_PI` (Human escalation).
  3. If untrusted prompt injection text exists in metadata ➔ Invariant holds; injected commands are stripped.

---

## 5. Multi-Tenant Architecture & Scoping Note

Grant Guardian is built on a single-tenant mental model for the researcher (a focused, distraction-free command center for their laboratory), backed by a strict multi-tenant database schema:

- **Partitioning**: Every entity (`citations`, `deadlines`, `activities`, `drafts`, `preferences`) has a foreign key to `users.id`.
- **Isolation**: API routes resolve `userId` from `req.query.user` or the session header `x-user-id`. Queries filter explicitly on `where(eq(table.userId, userId))`.
- **First-Time Lab Onboarding**: The `new-lab` persona (User ID 4) provides a clean unseeded slate with 0 citations, triggering the interactive onboarding guide and quick-import tools.

---

## 6. Verifiable Test Suite
 
The system maintains 59 passing automated tests with zero external API dependencies:
- **43 TypeScript Tests**: Adversarial prompt injection immunity, route validation, circuit breaker failsafes, proof of restraint, and deterministic decision boundaries.
- **16 Python Tests**: Dynamic tool selection branching, recorded Bedrock Converse transcript replays, parallel reference checking, authentic Strands SDK agent orchestration, and non-submission draft compliance.
