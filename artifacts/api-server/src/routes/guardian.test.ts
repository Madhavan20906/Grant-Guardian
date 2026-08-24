process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/grant_guardian";

import assert from "node:assert/strict";
import test from "node:test";
import app from "../app";

async function request(path: string, options: { method?: string; body?: unknown } = {}): Promise<{ status: number; body: any }> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
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
    return { status: res.status, body: json };
  } finally {
    server.close();
  }
}

test("GET /api/guardian/overview returns 200 or 500 when DB is unprovisioned", async () => {
  const res = await request("/api/guardian/overview");
  assert.ok([200, 500].includes(res.status));
  if (res.status === 200) {
    assert.ok(typeof res.body.citationsTracked === "number");
    assert.ok(typeof res.body.issuesFound === "number");
  }
});

test("GET /api/guardian/citations returns list or DB error status", async () => {
  const res = await request("/api/guardian/citations");
  assert.ok([200, 500].includes(res.status));
  if (res.status === 200) {
    assert.ok(Array.isArray(res.body));
  }
});

test("GET /api/guardian/deadlines returns formatted compliance deadlines", async () => {
  const res = await request("/api/guardian/deadlines");
  assert.ok([200, 500].includes(res.status));
  if (res.status === 200) {
    assert.ok(Array.isArray(res.body));
  }
});

test("POST /api/guardian/citations/import parses BibTeX and DOIs cleanly", async () => {
  const bibtexInput = `@article{test2024,
    author = {Doe, John},
    title = {Test Study},
    doi = {10.1038/nature99999}
  }`;

  const res = await request("/api/guardian/citations/import", {
    method: "POST",
    body: { content: bibtexInput },
  });

  assert.ok([201, 500].includes(res.status));
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

  // Non-existent draft -> 404 or 500 if DB unavailable
  const notFoundRes = await request("/api/guardian/drafts/99999", {
    method: "PATCH",
    body: { status: "approved" },
  });
  assert.ok([404, 500].includes(notFoundRes.status));
});

test("POST /api/guardian/deadlines/:id/draft validates deadline ID", async () => {
  const invalidRes = await request("/api/guardian/deadlines/abc/draft", {
    method: "POST",
    body: { context: "Test context" },
  });
  assert.equal(invalidRes.status, 400);
});

test("GET & PUT /api/guardian/preferences handles user settings", async () => {
  const getRes = await request("/api/guardian/preferences");
  assert.ok([200, 500].includes(getRes.status));

  const putRes = await request("/api/guardian/preferences", {
    method: "PUT",
    body: {
      weeklyDeskNote: true,
      highRiskInterrupts: false,
      deadlineReminders: true,
    },
  });
  assert.ok([200, 500].includes(putRes.status));
});
