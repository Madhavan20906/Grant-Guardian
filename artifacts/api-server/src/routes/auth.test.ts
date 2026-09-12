process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import app from "../app";

async function request(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<{ status: number; body: any }> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { ...options.headers };
  let body: string | undefined;

  if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

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

describe("Multi-Tenant Authentication & Isolation API", () => {
  const timestamp = Date.now();
  const testEmailA = `investigator.a.${timestamp}@lab-a.edu`;
  const testEmailB = `investigator.b.${timestamp}@lab-b.org`;
  let tokenA = "";
  let tokenB = "";
  let userAId = 0;
  let userBId = 0;

  it("should reject registration with a weak password", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Weak Password User",
        email: `weak.${timestamp}@lab.org`,
        password: "weak",
      },
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes("security requirements"));
    assert.ok(Array.isArray(res.body.details));
  });

  it("should successfully register Tenant A with strong password & lab identity", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Alice Morgan",
        email: testEmailA,
        password: "SecureMorganLab!2026",
        title: "Prof.",
        labName: "Morgan Structural Genomics Lab",
        institution: "Oxford University",
        focus: "Cryo-EM Protein Dynamics",
        proposalName: "ERC Advanced Grant — CryoDynamics",
      },
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmailA.toLowerCase());
    assert.equal(res.body.user.labName, "Morgan Structural Genomics Lab");
    assert.equal(res.body.user.institution, "Oxford University");
    tokenA = res.body.token;
    userAId = res.body.user.id;
  });

  it("should reject duplicate registration for existing email", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Impostor",
        email: testEmailA,
        password: "SecureMorganLab!2026",
      },
    });

    assert.equal(res.status, 409);
    assert.ok(res.body.error.includes("already exists"));
  });

  it("should successfully register Tenant B with independent lab identity", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Benjamin Vance",
        email: testEmailB,
        password: "VanceQuantumBio!2026",
        title: "Dr.",
        labName: "Vance Quantum Biology Center",
        institution: "Caltech",
        focus: "Quantum Coherence in Photosynthesis",
        proposalName: "DOE Quantum Horizons Proposal",
      },
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.labName, "Vance Quantum Biology Center");
    tokenB = res.body.token;
    userBId = res.body.user.id;
    assert.notEqual(userAId, userBId);
  });

  it("should reject login with wrong password", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        email: testEmailA,
        password: "IncorrectPassword!1",
      },
    });

    assert.equal(res.status, 401);
    assert.ok(res.body.error.includes("Invalid email or password"));
  });

  it("should login successfully with correct password and return valid token", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        email: testEmailA,
        password: "SecureMorganLab!2026",
      },
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, "Dr. Alice Morgan");
  });

  it("should fetch current authenticated profile via /api/auth/me", async () => {
    const res = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, testEmailA.toLowerCase());
    assert.equal(res.body.user.labName, "Morgan Structural Genomics Lab");
  });

  it("should allow tenant to update lab and profile settings via PUT /api/auth/profile", async () => {
    const res = await request("/api/auth/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        labName: "Morgan Advanced Cryo-EM Institute",
        proposalName: "Wellcome Discovery Award 2026",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.labName, "Morgan Advanced Cryo-EM Institute");
    assert.equal(res.body.user.proposalName, "Wellcome Discovery Award 2026");
  });

  it("should enforce strict multi-tenant data isolation for citations", async () => {
    const testDoiA = `10.1038/nature.morgan.${timestamp}`;
    const testDoiB = `10.1016/cell.vance.${timestamp}`;

    // Tenant A imports DOI A
    const addARes = await request("/api/guardian/citations/import", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { content: `Here is our reference: https://doi.org/${testDoiA}` },
    });

    assert.equal(addARes.status, 201);

    // Tenant B imports DOI B
    const addBRes = await request("/api/guardian/citations/import", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { content: `Vance reference: https://doi.org/${testDoiB}` },
    });

    assert.equal(addBRes.status, 201);

    // Verify Tenant A can only see DOI A and NOT DOI B
    const citationsARes = await request("/api/guardian/citations", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.equal(citationsARes.status, 200);
    const doisA = citationsARes.body.map((c: any) => c.doi);
    assert.ok(doisA.includes(testDoiA), "Tenant A should see their own DOI");
    assert.ok(!doisA.includes(testDoiB), "Tenant A must NEVER see Tenant B's DOI");

    // Verify Tenant B can only see DOI B and NOT DOI A
    const citationsBRes = await request("/api/guardian/citations", {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert.equal(citationsBRes.status, 200);
    const doisB = citationsBRes.body.map((c: any) => c.doi);
    assert.ok(doisB.includes(testDoiB), "Tenant B should see their own DOI");
    assert.ok(!doisB.includes(testDoiA), "Tenant B must NEVER see Tenant A's DOI");
  });
});
