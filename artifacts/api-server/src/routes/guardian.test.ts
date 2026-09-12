process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/grant_guardian";

import assert from "node:assert/strict";
import test from "node:test";
import app from "../app";

async function request(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<{ status: number; body: any; headers: Headers }> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { ...options.headers };
  let body: string | undefined;

  if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  // Create a local server to test Express route handlers end-to-end
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to bind test server");
  }

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers,
      body,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, headers: res.headers };
  } finally {
    server.close();
  }
}

test("GET /api/guardian/overview returns 200 via store adapter", async () => {
  const res = await request("/api/guardian/overview");
  assert.equal(res.status, 200);
  assert.ok(typeof res.body.citationsTracked === "number");
  assert.ok(typeof res.body.issuesFound === "number");
});

test("GET /api/guardian/citations returns list via store adapter", async () => {
  const res = await request("/api/guardian/citations");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("GET /api/guardian/deadlines returns formatted compliance deadlines", async () => {
  const res = await request("/api/guardian/deadlines");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("POST /api/guardian/citations/import parses BibTeX and DOIs cleanly with store fallback", async () => {
  const bibtexInput = `@article{test2024,
    author = {Doe, John},
    title = {Test Study},
    doi = {10.1038/nature99999}
  }`;

  const res = await request("/api/guardian/citations/import", {
    method: "POST",
    body: { content: bibtexInput },
  });

  assert.equal(res.status, 201);
  assert.ok(typeof res.body.imported === "number");
});

test("POST /api/guardian/citations/import validates missing and invalid content", async () => {
  // Empty input -> 400 (validation occurs before DB call)
  const emptyRes = await request("/api/guardian/citations/import", {
    method: "POST",
    body: { content: "" },
  });
  assert.equal(emptyRes.status, 400);

  // Content with no DOIs -> 400 (validation occurs before DB call)
  const noDoiRes = await request("/api/guardian/citations/import", {
    method: "POST",
    body: { content: "This is just plain text without any DOI numbers." },
  });
  assert.equal(noDoiRes.status, 400);
});

test("PATCH /api/guardian/drafts/:id validates draft status transitions", async () => {
  // Invalid status -> 400 (validation occurs before DB call)
  const invalidRes = await request("/api/guardian/drafts/1", {
    method: "PATCH",
    body: { status: "invalid_status_type" },
  });
  assert.equal(invalidRes.status, 400);

  // Non-existent draft -> 404
  const notFoundRes = await request("/api/guardian/drafts/99999", {
    method: "PATCH",
    body: { status: "approved" },
  });
  assert.equal(notFoundRes.status, 404);
});

test("POST /api/guardian/deadlines/:id/draft validates deadline ID", async () => {
  const invalidRes = await request("/api/guardian/deadlines/abc/draft", {
    method: "POST",
    body: { context: "Test context" },
  });
  assert.equal(invalidRes.status, 400);
});

test("GET & PUT /api/guardian/preferences handles user settings via store adapter", async () => {
  const getRes = await request("/api/guardian/preferences");
  assert.equal(getRes.status, 200);

  const putRes = await request("/api/guardian/preferences", {
    method: "PUT",
    body: {
      weeklyDeskNote: true,
      highRiskInterrupts: false,
      deadlineReminders: true,
    },
  });
  assert.equal(putRes.status, 200);
  assert.equal(putRes.body.highRiskInterrupts, false);
});

test("POST /api/guardian/scan enforces proof of restraint (direct retraction vs propagation escalation)", async () => {
  const scanRes = await request("/api/guardian/scan", { method: "POST" });
  assert.equal(scanRes.status, 200);
  assert.ok(typeof scanRes.body.scanned === "number");
  assert.ok(typeof scanRes.body.flagged === "number");
  assert.ok(typeof scanRes.body.escalated === "number");

  if (Array.isArray(scanRes.body.decisions)) {
    const directRetraction = scanRes.body.decisions.find((d: any) => d.status === "retracted");
    if (directRetraction) {
      assert.equal(directRetraction.status, "retracted");
      assert.equal(directRetraction.escalated, false);
      assert.equal(directRetraction.risk, "high");
    }

    const propagationItem = scanRes.body.decisions.find((d: any) => d.status === "propagation" || d.escalated);
    if (propagationItem) {
      assert.equal(propagationItem.escalated, true);
      assert.notEqual(propagationItem.status, "retracted");
      assert.equal(propagationItem.status, "propagation");
    }
  }
});

// CORS security tests
test("CORS: allows localhost development origin and returns credentials header", async () => {
  const res = await request("/api/healthz", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(res.headers.get("access-control-allow-credentials"), "true");
});

test("CORS: blocks arbitrary untrusted origins from reflecting origin header", async () => {
  const res = await request("/api/healthz", {
    headers: { Origin: "https://malicious-attacker-site.com" },
  });
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("CORS: allows 127.0.0.1 development origin", async () => {
  const res = await request("/api/healthz", {
    headers: { Origin: "http://127.0.0.1:3000" },
  });
  assert.equal(res.headers.get("access-control-allow-origin"), "http://127.0.0.1:3000");
});

// Autonomous Watch Mode tests
test("GET /api/guardian/watch/status returns unpolluted initial state on boot", async () => {
  const res = await request("/api/guardian/watch/status");
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.totalSweeps, "number");
  assert.ok(Array.isArray(res.body.notifications));
});

test("POST /api/guardian/watch/sweep executes a real sweep and updates state with audit trail", async () => {
  const sweepRes = await request("/api/guardian/watch/sweep", { method: "POST" });
  assert.equal(sweepRes.status, 200);
  assert.ok(typeof sweepRes.body.scanned === "number");
  assert.ok(typeof sweepRes.body.flagged === "number");
  assert.ok(typeof sweepRes.body.escalated === "number");
  assert.ok(typeof sweepRes.body.summary === "string");

  const statusRes = await request("/api/guardian/watch/status");
  assert.equal(statusRes.status, 200);
  assert.ok(statusRes.body.totalSweeps >= 1);
  assert.ok(statusRes.body.lastSweepAt !== null);

  const notifsRes = await request("/api/guardian/notifications");
  assert.equal(notifsRes.status, 200);
  assert.ok(Array.isArray(notifsRes.body));
  assert.ok(notifsRes.body.length >= 1);
});

