import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyDecision,
  draftWithAgent,
  parseDoisFromContent,
  retractionWatch,
  traversePropagationGraph,
  KNOWN_RETRACTED_DOIS,
  type CitationInput,
  type ToolResult,
} from "./guardian-agent";

test("classifyDecision: clear evidence stays clear and does not interrupt", () => {
  assert.deepEqual(classifyDecision({ directRetraction: false, propagation: false }), {
    status: "clear",
    risk: "low",
    escalated: false,
  });
});

test("classifyDecision: direct retraction is flagged as high risk without escalation", () => {
  assert.deepEqual(classifyDecision({ directRetraction: true, propagation: true }), {
    status: "retracted",
    risk: "high",
    escalated: false,
  });
});

test("classifyDecision: propagation risk is escalated rather than auto-flagged", () => {
  assert.deepEqual(classifyDecision({ directRetraction: false, propagation: true }), {
    status: "propagation",
    risk: "medium",
    escalated: true,
  });
});

test("retractionWatch: fallback hit on known retracted paper returns honest offline fallback source label", async () => {
  const result = await retractionWatch("10.1038/nature13358");
  assert.equal(result.tool, "retraction_watch_lookup");
  assert.equal(result.ok, true);
  const data = result.data as { match: boolean; retracted: boolean; source: string; reason: string };
  assert.equal(data.match, true);
  assert.equal(data.retracted, true);
  assert.equal(data.source, "Retraction Watch (Offline Demo Fallback Dataset)");
  assert.match(data.reason, /STAP.*retracted/i);
});

test("retractionWatch: fallback hit handles case insensitivity and whitespace", async () => {
  const result = await retractionWatch("  10.1038/NATURE13358  ");
  assert.equal(result.ok, true);
  const data = result.data as { match: boolean; retracted: boolean; source: string };
  assert.equal(data.match, true);
  assert.equal(data.retracted, true);
  assert.equal(data.source, "Retraction Watch (Offline Demo Fallback Dataset)");
});

test("retractionWatch: clean DOI returns failsafe clear response with configuration disclosure", async () => {
  const result = await retractionWatch("10.1038/s41586-021-03819-2");
  assert.equal(result.tool, "retraction_watch_lookup");
  assert.equal(result.ok, true);
  const data = result.data as { match: boolean; retracted: boolean; source: string; configured: boolean };
  assert.equal(data.match, false);
  assert.equal(data.retracted, false);
  assert.equal(data.source, "Retraction Watch (Provider Failsafe Active — Bypassed Safe)");
  assert.equal(data.configured, false);
});

test("traversePropagationGraph: detects 1-hop reference to retracted DOI", () => {
  const rootCitation: CitationInput = {
    id: 10,
    doi: "10.1016/j.stem.2015.01.002",
    title: "Downstream Study",
    status: "clear",
    risk: "low",
  };
  const crossrefData: ToolResult = {
    tool: "crossref_lookup",
    ok: true,
    data: {
      references: [
        { DOI: "10.1038/nature13358" }, // Known retracted STAP DOI
        { DOI: "10.1038/nature03819" }, // Clean DOI
      ],
    },
  };
  const known = new Map<string, CitationInput>();
  const graph = traversePropagationGraph(rootCitation, crossrefData, known);

  assert.equal(graph.rootDoi, "10.1016/j.stem.2015.01.002");
  assert.deepEqual(graph.referencedDois, ["10.1038/nature13358", "10.1038/nature03819"]);
  assert.deepEqual(graph.retractedReferencedDois, ["10.1038/nature13358"]);
  assert.equal(graph.depth, 1);
});

test("traversePropagationGraph: handles clean reference graph with no retractions", () => {
  const rootCitation: CitationInput = {
    id: 11,
    doi: "10.1038/s41586-021-03819-2",
    title: "Clean Study",
    status: "clear",
    risk: "low",
  };
  const crossrefData: ToolResult = {
    tool: "crossref_lookup",
    ok: true,
    data: {
      references: [{ DOI: "10.1000/182" }, { DOI: "10.1000/183" }],
    },
  };
  const known = new Map<string, CitationInput>();
  const graph = traversePropagationGraph(rootCitation, crossrefData, known);

  assert.deepEqual(graph.retractedReferencedDois, []);
  assert.equal(graph.depth, 0);
});

test("traversePropagationGraph: handles empty or missing reference data gracefully", () => {
  const rootCitation: CitationInput = {
    id: 12,
    doi: "10.1000/empty",
    title: "No References",
    status: "clear",
    risk: "low",
  };
  const crossrefData: ToolResult = { tool: "crossref_lookup", ok: false, data: null };
  const known = new Map<string, CitationInput>();
  const graph = traversePropagationGraph(rootCitation, crossrefData, known);

  assert.deepEqual(graph.referencedDois, []);
  assert.deepEqual(graph.retractedReferencedDois, []);
  assert.equal(graph.depth, 0);
});

test("parseDoisFromContent: extracts DOIs from BibTeX and plain text", () => {
  const bibtex = `@article{test, author={Smith}, title={Title}, doi={10.1038/nature13358}}`;
  assert.deepEqual(parseDoisFromContent(bibtex), ["10.1038/nature13358"]);

  const rawText = "Check DOIs 10.1038/nature13358 and 10.1016/j.cell.2016.10.024 for updates.";
  assert.deepEqual(parseDoisFromContent(rawText), [
    "10.1038/nature13358",
    "10.1016/j.cell.2016.10.024",
  ]);
});

test("parseDoisFromContent: handles duplicate DOIs and trailing punctuation", () => {
  const text = "DOIs: 10.1038/nature13358. And again 10.1038/nature13358}";
  assert.deepEqual(parseDoisFromContent(text), ["10.1038/nature13358"]);
});

test("parseDoisFromContent: returns empty array for invalid or empty input", () => {
  assert.deepEqual(parseDoisFromContent("No DOIs here"), []);
  assert.deepEqual(parseDoisFromContent(""), []);
});

test("draftWithAgent: generates conservative report fallback when Bedrock is unconfigured", async () => {
  const deadline = {
    title: "NSF Annual Report",
    type: "Funding report",
    dueDate: new Date("2026-10-15"),
    progress: 50,
  };
  const report = await draftWithAgent(deadline, "Supplied lab notes.");
  assert.match(report, /NSF Annual Report/);
  assert.match(report, /Current status/);
  assert.match(report, /Risks and deviations/);
});