"""Grant Guardian's canonical Strands agent.

The web API can call this service in AWS/AgentCore or run its equivalent
TypeScript adapter locally. Tools are intentionally small and observable:
the model decides which tool to use, while the tools own external I/O.
"""
from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI
from pydantic import BaseModel
from strands import Agent, tool

app = FastAPI(title="Grant Guardian Strands Agent")


@tool
def check_retraction_status(doi: str) -> dict[str, Any]:
    """Check DOI metadata and update relations using Crossref."""
    response = httpx.get(
        f"https://api.crossref.org/works/{doi}",
        headers={"User-Agent": "GrantGuardian/1.0"},
        timeout=8,
    )
    response.raise_for_status()
    message = response.json()["message"]
    relations = message.get("relation", {})
    return {
        "doi": doi,
        "is_retracted": "is-retracted-by" in relations,
        "is_corrected": "is-corrected-by" in relations,
        "relations": relations,
    }


@tool
def check_propagation_risk(doi: str) -> dict[str, Any]:
    """Traverse one reference hop using Semantic Scholar.

    This tool only returns evidence. The agent must escalate a second-order
    hit because impact depends on the researcher's actual claim.
    """
    response = httpx.get(
        f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}",
        params={"fields": "references.externalIds"},
        timeout=8,
    )
    response.raise_for_status()
    references = response.json().get("references", [])
    return {
        "doi": doi,
        "depth": 1,
        "referenced_dois": [
            ref.get("externalIds", {}).get("DOI")
            for ref in references
            if ref.get("externalIds", {}).get("DOI")
        ],
        "requires_human_judgment": True,
    }


@tool
def escalate_to_human(reason: str, context: str, urgency: str = "normal") -> str:
    """Record a decision that must be reviewed by the researcher."""
    return f"Escalated ({urgency}): {reason}. Evidence: {context}"


@tool
def draft_compliance_report(deadline: str, requirement_details: str) -> str:
    """Draft routine report language; never submits it."""
    return (
        f"Draft for {deadline}\n\n"
        "Current status: researcher review required.\n"
        f"Requirement context: {requirement_details}\n\n"
        "Next steps: add verified results, deviations, and attachments before "
        "the responsible researcher signs and submits."
    )


def build_agent() -> Agent:
    return Agent(
        system_prompt=(
            "You are Grant Guardian. Act on clear retraction signals, never "
            "invent evidence, and escalate all propagation-risk findings. "
            "Always state the evidence behind an action. You are not a chatbot "
            "and you never submit compliance reports."
        ),
        tools=[
            check_retraction_status,
            check_propagation_risk,
            draft_compliance_report,
            escalate_to_human,
        ],
    )


class ScanRequest(BaseModel):
    citations: list[dict[str, Any]]


@app.post("/scan")
def scan(request: ScanRequest) -> dict[str, Any]:
    prompt = (
        "Scan these tracked citations. Check each DOI, use propagation analysis "
        "where possible, and return a concise JSON-like decision trace:\n"
        f"{request.citations}"
    )
    result = build_agent()(prompt)
    return {"result": str(result), "agent": "strands", "tools": 4}


@app.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "strands"}