import json
from strands import Agent as StrandsAgent, tool
from strands.models.model import Model

class OfflineInvestigationModel(Model):
    def update_config(self, **kwargs): pass
    def get_config(self): return {}
    async def structured_output(self, *args, **kwargs): pass

    async def stream(self, messages, tool_specs=None, system_prompt=None, **kwargs):
        tool_results = {}
        tool_uses = []
        for msg in messages:
            for block in msg.get("content", []):
                if isinstance(block, dict):
                    if "toolUse" in block:
                        tool_uses.append(block["toolUse"])
                    elif "toolResult" in block:
                        tr = block["toolResult"]
                        call_id = tr.get("toolUseId")
                        raw_c = tr.get("content", [{}])[0].get("text", "{}")
                        if isinstance(raw_c, dict):
                            parsed = raw_c
                        elif isinstance(raw_c, str):
                            try:
                                parsed = json.loads(raw_c)
                            except Exception:
                                parsed = {}
                        else:
                            parsed = {}
                        tool_results[call_id] = parsed

        calls_by_name = {u["name"]: tool_results.get(u["toolUseId"]) for u in tool_uses if u["toolUseId"] in tool_results}
        
        user_msg = messages[0].get("content", [{}])[0].get("text", "")
        doi = "10.1038/nature13358"
        for word in user_msg.replace('"', ' ').replace("\n", " ").split():
            if "10." in word and "/" in word:
                doi = word.strip(" ,;:")
                break

        # 1. crossref_lookup
        if "crossref_lookup" not in calls_by_name:
            call_id = f"call_cr_{len(tool_uses)+1}"
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"toolUse": {"toolUseId": call_id, "name": "crossref_lookup"}}}}
            yield {"contentBlockDelta": {"delta": {"toolUse": {"input": json.dumps({"doi": doi})}}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "tool_use"}}
            return

        cr_res = calls_by_name.get("crossref_lookup") or {}
        is_cr_retracted = cr_res.get("is_retracted", False) if isinstance(cr_res, dict) else False

        # 2. retraction_watch_lookup
        if "retraction_watch_lookup" not in calls_by_name:
            call_id = f"call_rw_{len(tool_uses)+1}"
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"toolUse": {"toolUseId": call_id, "name": "retraction_watch_lookup"}}}}
            yield {"contentBlockDelta": {"delta": {"toolUse": {"input": json.dumps({"doi": doi})}}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "tool_use"}}
            return

        rw_res = calls_by_name.get("retraction_watch_lookup") or {}
        is_rw_retracted = rw_res.get("retracted", False) if isinstance(rw_res, dict) else False
        is_direct_retracted = is_cr_retracted or is_rw_retracted

        # If directly retracted, prune reference crawl!
        if is_direct_retracted:
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"text": ""}}}
            yield {"contentBlockDelta": {"delta": {"text": f"Direct retraction confirmed for {doi}. Reference crawling pruned. Quarantined."}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "end_turn"}}
            return

        # 3. semantic_scholar_graph
        if "semantic_scholar_graph" not in calls_by_name:
            call_id = f"call_ss_{len(tool_uses)+1}"
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"toolUse": {"toolUseId": call_id, "name": "semantic_scholar_graph"}}}}
            yield {"contentBlockDelta": {"delta": {"toolUse": {"input": json.dumps({"doi": doi})}}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "tool_use"}}
            return

        ss_res = calls_by_name.get("semantic_scholar_graph", {})
        ref_dois = ss_res.get("referenced_dois", [])

        # 4. check_reference_retractions
        if ref_dois and "check_reference_retractions" not in calls_by_name:
            call_id = f"call_ref_{len(tool_uses)+1}"
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"toolUse": {"toolUseId": call_id, "name": "check_reference_retractions"}}}}
            yield {"contentBlockDelta": {"delta": {"toolUse": {"input": json.dumps({"referenced_dois": ref_dois})}}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "tool_use"}}
            return

        ref_check_res = calls_by_name.get("check_reference_retractions", {})
        has_propagation = ref_check_res.get("has_propagation_risk", False)
        retracted_refs = ref_check_res.get("retracted_references", [])

        # 5. escalate_to_human
        if has_propagation and "escalate_to_human" not in calls_by_name:
            call_id = f"call_esc_{len(tool_uses)+1}"
            flagged = retracted_refs[0] if retracted_refs else {}
            yield {"messageStart": {"role": "assistant"}}
            yield {"contentBlockStart": {"start": {"toolUse": {"toolUseId": call_id, "name": "escalate_to_human"}}}}
            yield {"contentBlockDelta": {"delta": {"toolUse": {"input": json.dumps({"root_doi": doi, "retracted_ref_doi": flagged.get("doi", ""), "reason": flagged.get("reason", "")})}}}}
            yield {"contentBlockStop": {}}
            yield {"messageStop": {"stopReason": "tool_use"}}
            return

        # 6. Conclude
        summary = f"Completed investigation for {doi}."
        if has_propagation:
            summary += f" 2nd-order propagation risk detected ({len(retracted_refs)} retracted reference(s)). Escalated to PI."
        else:
            summary += " Direct paper and reference graph clean."
        
        yield {"messageStart": {"role": "assistant"}}
        yield {"contentBlockStart": {"start": {"text": ""}}}
        yield {"contentBlockDelta": {"delta": {"text": summary}}}
        yield {"contentBlockStop": {}}
        yield {"messageStop": {"stopReason": "end_turn"}}

@tool
def crossref_lookup(doi: str) -> dict:
    return {"doi": doi, "is_retracted": False}

@tool
def retraction_watch_lookup(doi: str) -> dict:
    return {"doi": doi, "retracted": False}

@tool
def semantic_scholar_graph(doi: str) -> dict:
    return {"doi": doi, "referenced_dois": ["10.1038/nature13358"]}

@tool
def check_reference_retractions(referenced_dois: list) -> dict:
    return {"has_propagation_risk": True, "retracted_references": [{"doi": "10.1038/nature13358", "reason": "STAP cell paper"}]}

@tool
def escalate_to_human(root_doi: str, retracted_ref_doi: str, reason: str) -> dict:
    return {"action": "escalate_to_human", "root_doi": root_doi, "retracted_ref_doi": retracted_ref_doi}

agent = StrandsAgent(
    model=OfflineInvestigationModel(),
    tools=[crossref_lookup, retraction_watch_lookup, semantic_scholar_graph, check_reference_retractions, escalate_to_human]
)

res = agent("Please investigate 10.1016/j.stem.2015.01.002")
print("=== PROPAGATION RUN ===")
print("Total messages in conversation:", len(agent.messages))
for idx, m in enumerate(agent.messages):
    role = m.get("role")
    for block in m.get("content", []):
        if "toolUse" in block:
            print(f"  Step {idx} [{role}]: Tool call -> {block['toolUse']['name']}")

@tool
def retraction_watch_lookup_retracted(doi: str) -> dict:
    return {"doi": doi, "retracted": True, "reason": "STAP cell data fabrication"}

# Rename to match tool name
retraction_watch_lookup_retracted.__name__ = "retraction_watch_lookup"

agent_direct = StrandsAgent(
    model=OfflineInvestigationModel(),
    tools=[crossref_lookup, retraction_watch_lookup_retracted, semantic_scholar_graph, check_reference_retractions, escalate_to_human]
)
res_direct = agent_direct("Please investigate 10.1038/nature13358")
print("\n=== DIRECT RETRACTION RUN (PRUNED) ===")
print("Total messages in conversation:", len(agent_direct.messages))
for idx, m in enumerate(agent_direct.messages):
    role = m.get("role")
    for block in m.get("content", []):
        if "toolUse" in block:
            print(f"  Step {idx} [{role}]: Tool call -> {block['toolUse']['name']}")
print("Final text:", res_direct.message["content"][0]["text"])
