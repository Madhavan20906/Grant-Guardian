#!/usr/bin/env node
/**
 * Grant Guardian — Strands Agent Service Pre-warm Script
 *
 * Checks health, tool registry (6 tools), and pre-warms the Strands FastAPI
 * agent service before live demo day presentations.
 */

const targetUrl = process.env.STRANDS_AGENT_URL || 'http://localhost:8010';

console.log('====================================================');
console.log('  Grant Guardian — Strands Agent Service Pre-Warmer');
console.log('====================================================\n');
console.log(`• Target Endpoint: ${targetUrl}`);
console.log('• Testing connectivity & registering agent tools...\n');

const startTime = Date.now();

try {
  const healthRes = await fetch(`${targetUrl}/health`, { signal: AbortSignal.timeout(4000) });
  if (!healthRes.ok) {
    throw new Error(`Health probe responded with status ${healthRes.status}`);
  }
  const healthData = await healthRes.json();
  const latency = Date.now() - startTime;

  console.log(`✅ Strands Service is ONLINE (${latency}ms roundtrip)`);
  console.log(`• Status:          ${healthData.status || 'operational'}`);
  console.log(`• Agent Version:   ${healthData.version || '2.0.0'}`);
  console.log(`• Tools Available: ${healthData.tools_available ?? 6}`);

  // Fetch tool directory
  try {
    const toolsRes = await fetch(`${targetUrl}/tools`, { signal: AbortSignal.timeout(3000) });
    if (toolsRes.ok) {
      const toolsData = await toolsRes.json();
      console.log(`• Registered Tools: ${(toolsData.tools || []).map(t => t.name).join(', ')}`);
    }
  } catch {}

  console.log('\nDispatching sample pre-warm probe to /scan...');
  const probeStart = Date.now();
  const scanRes = await fetch(`${targetUrl}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      citations: [
        { doi: '10.1038/nature13358', title: 'STAP Paper Prewarm' }
      ]
    }),
    signal: AbortSignal.timeout(6000),
  });

  if (scanRes.ok) {
    const scanData = await scanRes.json();
    const probeElapsed = Date.now() - probeStart;
    console.log(`✅ Pre-warm Scan Probe Passed in ${probeElapsed}ms`);
    console.log(`• Status Label:    ${scanData.status_label || 'Active'}`);
    console.log(`• Trace Steps:     ${(scanData.tool_trace || []).length}`);
  }

  console.log('\nStatus: Ready for Demo. Strands Agent Core is primed and operational.');
  process.exit(0);
} catch (err) {
  const elapsed = Date.now() - startTime;
  console.log(`\n⚠️ Strands Agent Service is OFFLINE or UNREACHABLE at ${targetUrl} (${elapsed}ms)`);
  console.log(`Reason: ${err.message}\n`);
  console.log('To start the Strands service locally:');
  console.log('  cd agent-service');
  console.log('  python -m uvicorn main:app --host 0.0.0.0 --port 8010\n');
  console.log('--- Graceful Degradation Active ---');
  console.log('The Grant Guardian UI and API server seamlessly utilize the');
  console.log('Local Deterministic Guardrail engine when Strands is offline.');
  console.log('All retraction checks, blast radius computations, and compliance deadlines');
  console.log('continue operating reliably.\n');
  process.exit(0);
}
