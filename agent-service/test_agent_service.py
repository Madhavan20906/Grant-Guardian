"""Comprehensive test suite for Grant Guardian Strands Agent Service."""
import unittest
from unittest.mock import patch, MagicMock

import httpx
from fastapi.testclient import TestClient

from main import (
    app,
    crossref_lookup,
    retraction_watch_lookup,
    semantic_scholar_graph,
    check_reference_retractions,
    escalate_to_human,
    draft_compliance_report,
    build_agent,
    KNOWN_RETRACTED_DOIS,
)

client = TestClient(app)


class TestStrandsAgentService(unittest.TestCase):
    def test_health_endpoints(self):
        """Verify health check endpoints return operational status."""
        for path in ["/health", "/healthz"]:
            response = client.get(path)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "ok")
            self.assertEqual(data["agent"], "strands")
            self.assertEqual(data["version"], "2.0.0")

    def test_retraction_watch_known_retracted_benchmark(self):
        """Verify known benchmark DOI returns confirmed retraction details."""
        doi = "10.1038/nature13358"
        result = retraction_watch_lookup(doi)
        self.assertTrue(result["retracted"])
        self.assertIn("STAP", result["reason"])
        self.assertEqual(result["source"], "Retraction Watch (Offline Fallback Dataset)")

    def test_retraction_watch_clean_doi(self):
        """Verify non-retracted DOI returns clean status with failsafe notice."""
        doi = "10.1038/s41586-021-03819-2"
        result = retraction_watch_lookup(doi)
        self.assertFalse(result["retracted"])
        self.assertIn("Clean signal", result["source"])

    def test_check_reference_retractions_detects_propagation_risk(self):
        """Verify propagation engine flags retracted referenced works."""
        referenced = [
            "10.1038/s41586-021-03819-2",  # clean
            "10.1038/nature13358",         # retracted
        ]
        result = check_reference_retractions(referenced)
        self.assertEqual(result["total_checked"], 2)
        self.assertEqual(result["retracted_count"], 1)
        self.assertTrue(result["has_propagation_risk"])
        self.assertEqual(result["retracted_references"][0]["doi"], "10.1038/nature13358")

    def test_escalate_to_human_preserves_scientific_judgment(self):
        """Verify 2nd-order propagation generates structured escalation without auto-retraction."""
        result = escalate_to_human(
            root_doi="10.1016/j.stem.2015.01.002",
            retracted_ref_doi="10.1038/nature13358",
            reason="Retracted STAP foundation paper cited in section 3.2",
        )
        self.assertEqual(result["action"], "escalate_to_human")
        self.assertEqual(result["root_doi"], "10.1016/j.stem.2015.01.002")
        self.assertEqual(result["retracted_reference_doi"], "10.1038/nature13358")
        self.assertIn("requires PI review", result["explanation"])
        # Invariant: Never auto-quarantine or auto-retract 2nd order dependencies
        self.assertNotEqual(result.get("action"), "auto_retract")

    def test_draft_compliance_report_enforces_non_submission_invariant(self):
        """Verify drafted compliance report strictly prohibits external automated submission."""
        report = draft_compliance_report(
            deadline="NSF Annual Progress Report",
            requirement_details="Section 4 deliverables",
            progress=70,
        )
        self.assertIn("Researcher signature required", report)
        self.assertIn("must be reviewed, edited, and officially signed", report)
        self.assertIn("Human-in-the-Loop Signoff", report)

    def test_scan_endpoint_e2e(self):
        """Verify /scan endpoint handles citation payload and invokes agent orchestrator."""
        payload = {
            "citations": [
                {
                    "doi": "10.1016/j.stem.2015.01.002",
                    "title": "Downstream study citing STAP cell paper",
                },
                {
                    "doi": "10.1038/nature13358",
                    "title": "STAP cell paper",
                }
            ]
        }
        response = client.post("/scan", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["agent"], "strands")
        self.assertEqual(data["version"], "2.0.0")
        self.assertEqual(data["tools_available"], 6)
        self.assertTrue(len(data["result"]) > 0)

    def test_compliance_draft_endpoint_e2e(self):
        """Verify /compliance/draft endpoint generates preliminary draft with PI signoff policy."""
        payload = {
            "title": "NSF Annual Progress Report",
            "type": "NSF",
            "dueDate": "2026-10-01",
            "progress": 65,
            "context": "Progress towards milestone 3 in nanomaterial synthesis",
        }
        response = client.post("/compliance/draft", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["agent"], "strands")
        self.assertIn("draft", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
