# Grant Guardian: Building a Safety-First Autonomous Research Integrity Agent on AWS Bedrock & Strands

**Author**: Elena Rossi & Grant Guardian Team  
**Category**: Artificial Intelligence / AWS Bedrock / Python Strands SDK / AgentCore  

---

## 📌 Executive Summary

Every year, thousands of published scientific papers are retracted due to data fabrication, image manipulation, or methodological flaws. When principal investigators (PIs) write multi-million-dollar federal grant proposals (NSF, NIH, DOE), citing a retracted paper or a work built on a retracted foundation can lead to immediate compliance rejection, institutional embarrassment, or wasted funding.

**Grant Guardian** is an autonomous, safety-first research integrity supervisor built on **Amazon Bedrock**, **Python Strands SDK**, **Express/TypeScript**, and **AWS AgentCore**. 

Unlike naive LLM wrappers that hallucinate retraction statuses, Grant Guardian implements a strict **Safety Policy**:
1. **Direct Retractions** are caught via real-time Crossref and Retraction Watch API verification and quarantined automatically.
2. **Second-Order Propagation Risks** (citing papers that cite retracted works) are detected via Semantic Scholar graph traversal and **escalated** to the human researcher rather than auto-flagged.
3. **Bedrock Reasoning** provides executive summary passes without ever fabricating provider signals.

---

## 🏗️ System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GRANT GUARDIAN FRONTEND                            │
│                  (React / Vite / Tailwind / Visual Trace UI)                   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ REST API / JSON
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                            EXPRESS API SERVER (Node.js)                         │
│                    Orchestration · Drizzle ORM · SQLite DB                      │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ Tool Loop & Fallback
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                     PYTHON STRANDS AGENT SERVICE (FastAPI)                      │
│                  Main Agent Loop · Graph Traversal · Verification               │
└───────────────┬───────────────────────┬─────────────────────────┬───────────────┘
                │                       │                         │
┌───────────────▼───────────┐ ┌─────────▼─────────────┐ ┌─────────▼───────────────┐
│       CROSSREF API        │ │ RETRACTION WATCH API  │ │   SEMANTIC SCHOLAR    │
│  Publisher Errata Lookup  │ │  Direct Retractions   │ │ 1-Hop Citation Graph  │
└───────────────────────────┘ └───────────────────────┘ └───────────────────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                            AMAZON BEDROCK CONVERSE                              │
│                    Anthropic Claude 3.5 Sonnet / Converse API                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features & Innovations

### 1. Visual Execution Trace Sequence
Instead of presenting researchers with raw JSON responses or black-box predictions, Grant Guardian generates a cryptographic execution sequence for every citation scan:
- **Step 1: Crossref Metadata Lookup** — Confirms publisher indexing and errata links.
- **Step 2: Retraction Watch Database Lookup** — Audits direct retraction registries.
- **Step 3: Semantic Scholar Graph Traversal** — Traverses 1-hop reference trees for 2nd-order propagation risks.
- **Step 4: Guardian Safety Policy Decision** — Applies deterministic safety rules.

### 2. High-Reliability Retraction Watch Verification & Failsafe
To ensure 100% test reliability during live demos and production outages, Grant Guardian implements a 3-tier fallback architecture:
1. **Live HTTP Endpoint**: Queries real-time Retraction Watch APIs when configured.
2. **Verified Fallback Registry**: In-memory registry containing real-world historical benchmarks (e.g., STAP cell retractions `10.1038/nature13358`).
3. **Safe Disclosure Failsafe**: Explicitly marks provider status as "Configured / Fallback Active" rather than failing silently or inventing data.

---

## 🛠️ Code Implementation: Amazon Bedrock & Strands Integration

### Amazon Bedrock Converse Integration (`guardian-agent.ts`)
```typescript
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

async function reasonWithBedrock(prompt: string) {
  if (!process.env.AWS_REGION || !process.env.BEDROCK_MODEL_ID) return null;
  try {
    const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
    const result = await client.send(new ConverseCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 500, temperature: 0 },
    }));
    return result.output?.message?.content?.map((part) => "text" in part ? part.text : "").join("") || null;
  } catch (error) {
    console.warn("Bedrock fallback active:", error);
    return null;
  }
}
```

---

## 🐳 AWS AgentCore & Containerization

Grant Guardian's Python agent service (`agent-service/`) is containerized for seamless execution on **AWS AgentCore** and **Amazon ECR**.

`agent-service/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🎯 Conclusion & Value Proposition

Grant Guardian bridges the gap between agentic AI capabilities and scientific integrity. By combining **Amazon Bedrock's reasoning power**, **Python Strands SDK tool orchestration**, and a **deterministic safety policy**, Grant Guardian guarantees that federal grant proposals remain untainted by retracted literature.

*Protecting scientific truth, one grant proposal at a time.*
