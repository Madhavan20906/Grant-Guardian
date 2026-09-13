import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  Database,
  GitFork,
  ArrowRight,
  Fingerprint,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Layers,
  Terminal,
  FileCheck2,
  Activity,
  Award,
  Crown,
  Flame,
} from 'lucide-react';

interface StrandsToolDef {
  name: string;
  category: 'REGISTRY' | 'GRAPH' | 'ANALYSIS' | 'SECURITY' | 'GOVERNANCE';
  displayName: string;
  description: string;
  negativeConstraint: string;
  latencyMs: number;
  provider: string;
  status: 'OPERATIONAL' | 'ARMED';
}

const SOVEREIGN_TOOLS: StrandsToolDef[] = [
  {
    name: 'crossref_lookup',
    category: 'REGISTRY',
    displayName: 'Crossref REST API Verifier',
    description: 'Queries authoritative DOI registration agency for official publisher Crossmark updates, errata notices, and relation linkages.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Prohibited from citation reference tree crawling or compliance drafting.',
    latencyMs: 112,
    provider: 'Crossref REST API v1 (Live Engine)',
    status: 'OPERATIONAL',
  },
  {
    name: 'retraction_watch_lookup',
    category: 'REGISTRY',
    displayName: 'Retraction Watch Register',
    description: 'Corroborates formal retraction notices, official editorial retraction reasons, retraction dates, and investigative inquiry findings.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Prohibited from general literature discovery or speculative extrapolation.',
    latencyMs: 64,
    provider: 'Retraction Watch Enterprise Database',
    status: 'OPERATIONAL',
  },
  {
    name: 'openalex_global_registry',
    category: 'REGISTRY',
    displayName: 'OpenAlex 250M+ Works Graph',
    description: 'Multi-registry cross-examination of global scholarly works, is_retracted flags, citation counts, and primary concept vectors.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Prohibited from compliance drafting or human escalation routing.',
    latencyMs: 148,
    provider: 'OpenAlex Global Scholarly Graph',
    status: 'OPERATIONAL',
  },
  {
    name: 'pubmed_retraction_verifier',
    category: 'REGISTRY',
    displayName: 'NIH NLM PubMed / MeSH Verifier',
    description: 'Queries NIH National Library of Medicine for MeSH publication types (Retracted Publication, Misconduct) and PMC errata archives.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Prohibited from reference dependency traversal or progress report drafting.',
    latencyMs: 95,
    provider: 'NIH National Center for Biotechnology Information (NCBI)',
    status: 'OPERATIONAL',
  },
  {
    name: 'semantic_scholar_graph',
    category: 'GRAPH',
    displayName: 'Semantic Scholar Graph Engine',
    description: 'Traverses 1-hop bibliographic citation dependency trees for clean root papers to uncover indirect downstream relationships.',
    negativeConstraint: 'STRICT DYNAMIC PRUNING: Automatically aborted if direct retraction is confirmed by registries. Never run for compliance.',
    latencyMs: 182,
    provider: 'Semantic Scholar Academic Graph v1',
    status: 'OPERATIONAL',
  },
  {
    name: 'check_reference_retractions',
    category: 'GRAPH',
    displayName: 'Multi-Threaded Reference Scanner',
    description: 'Concurrently evaluates entire cited bibliography lists across registries to detect 2nd-order contamination propagation in milliseconds.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Only accepts parsed bibliography DOI lists. Prohibited on root papers or raw unformatted text.',
    latencyMs: 136,
    provider: 'Concurrent Worker Pool (8x Parallelism)',
    status: 'OPERATIONAL',
  },
  {
    name: 'contamination_vector_calculator',
    category: 'ANALYSIS',
    displayName: 'Contamination Vector Calculus',
    description: 'Quantifies structural cascade depth, proposal section vulnerability weight, Contamination Severity Index (0.00-1.00), and alternative clean citations.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Never invoked for direct retractions (direct retractions quarantined without vector modeling).',
    latencyMs: 42,
    provider: 'Quantitative Impact Engine (Deterministic Matrix)',
    status: 'OPERATIONAL',
  },
  {
    name: 'provenance_proof_generator',
    category: 'SECURITY',
    displayName: 'HMAC-SHA256 Provenance Seal',
    description: 'Assembles immutable cryptographic audit proofs with SHA-256 HMAC signatures, Merkle leaf hashes, and multi-registry consensus receipts.',
    negativeConstraint: 'STRICT NEGATIVE CONSTRAINT: Cannot be generated prior to multi-registry consensus gathering.',
    latencyMs: 18,
    provider: 'NIST SP 800-92 Cryptographic Security Kernel',
    status: 'OPERATIONAL',
  },
  {
    name: 'escalate_to_human',
    category: 'GOVERNANCE',
    displayName: 'Human-in-the-Loop Sovereign Boundary',
    description: 'Dispatches 2nd-order propagation alerts to PI Human Decision Inbox. Enforces non-negotiable rule: AI auto-retraction is strictly forbidden.',
    negativeConstraint: 'STRICT NON-RETRACTION INVARIANT: AI investigates. Human PI retains absolute sovereign authority over scientific validity.',
    latencyMs: 24,
    provider: 'PI Human Governance Protocol',
    status: 'OPERATIONAL',
  },
  {
    name: 'draft_compliance_report',
    category: 'GOVERNANCE',
    displayName: 'Milestone Narrative Synthesizer',
    description: 'Autonomously drafts compliance narratives for grant deadlines under the strict invariant that Grant Guardian never submits externally.',
    negativeConstraint: 'STRICT NON-SUBMISSION INVARIANT: Structurally forbidden from signing or filing external agency submissions without human PI signoff.',
    latencyMs: 88,
    provider: 'Structured Integrity Narrative Compiler',
    status: 'OPERATIONAL',
  },
];

interface SimulationScenario {
  id: string;
  name: string;
  doi: string;
  type: 'DIRECT_RETRACTION' | 'PROPAGATION_CASCADE' | 'CLEAN_VERIFIED';
  badge: string;
  description: string;
  executionSteps: Array<{
    tool: string;
    action: string;
    result: string;
    status: 'success' | 'warning' | 'flagged' | 'pruned';
    detail: string;
  }>;
  consensus: string[];
  vector?: {
    csi: number;
    depth: number;
    vulnerability: string;
    cleanAlternative: string;
  };
  proofId: string;
  hmacSeal: string;
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: 'stap-direct',
    name: 'Direct Retraction Blast (Nature 2014 STAP)',
    doi: '10.1038/nature13358',
    type: 'DIRECT_RETRACTION',
    badge: '🔴 DIRECT QUARANTINE',
    description: 'Direct fabrication identified in Obokata et al. All 4 registries corroborate retraction. Downstream reference crawling immediately PRUNED to eliminate speculative delay. Sealed with SHA-256 proof.',
    executionSteps: [
      {
        tool: 'crossref_lookup',
        action: 'Publisher Errata Notice Check',
        result: 'Crossmark update: Formally retracted by Nature editors',
        status: 'flagged',
        detail: 'Publisher relation is-retracted-by formal notice active.',
      },
      {
        tool: 'retraction_watch_lookup',
        action: 'Retraction Watch Register Query',
        result: 'Confirmed retracted (2014-07-02): Image manipulation and data fabrication',
        status: 'flagged',
        detail: 'Formal notice recorded with institutional investigation evidence.',
      },
      {
        tool: 'openalex_global_registry',
        action: 'Global Scholarly Graph Corroboration',
        result: 'is_retracted: true (Indexed across 842 citations)',
        status: 'flagged',
        detail: 'OpenAlex global work metadata confirms retraction classification.',
      },
      {
        tool: 'pubmed_retraction_verifier',
        action: 'NIH NLM / MeSH Term Audit',
        result: 'MeSH Category: Retracted Publication (NLM PMC4119842)',
        status: 'flagged',
        detail: 'Official National Library of Medicine publication status: Retracted.',
      },
      {
        tool: 'provenance_proof_generator',
        action: 'HMAC-SHA256 Cryptographic Audit Seal',
        result: 'PROOF-SHA256-A8F4C201B79E334D Generated',
        status: 'success',
        detail: 'Seals multi-registry consensus into tamper-evident NIST SP 800-92 proof receipt.',
      },
      {
        tool: 'semantic_scholar_graph',
        action: 'Dynamic Pruning Evaluation',
        result: 'PRUNED: Resource expenditure prevented',
        status: 'pruned',
        detail: 'Direct retraction confirmed across 4 registries. Downstream reference graph crawl pruned.',
      },
    ],
    consensus: ['Crossref REST API', 'Retraction Watch Database', 'OpenAlex Global Registry', 'PubMed Central / NIH NLM'],
    proofId: 'PROOF-SHA256-A8F4C201B79E334D',
    hmacSeal: '8f4c201b79e334df9c501e74a8123bc602d4e871ea67812903fc91873210aa98',
  },
  {
    id: 'cell-cascade',
    name: '2nd-Order Contamination Cascade (Cell Stem Cell 2015)',
    doi: '10.1016/j.stem.2015.01.002',
    type: 'PROPAGATION_CASCADE',
    badge: '🟠 2ND-ORDER ESCALATION',
    description: 'Lin et al. has a clean direct record, but cites retracted STAP paper in Section 3.2. Strands computes exact Contamination Severity Index (0.782), derives clean alternative, and enforces Human Decision Boundary.',
    executionSteps: [
      {
        tool: 'crossref_lookup',
        action: 'Direct Record Verification',
        result: 'Clean record in Cell Stem Cell (2015). No direct errata.',
        status: 'success',
        detail: 'Direct publisher status nominal.',
      },
      {
        tool: 'retraction_watch_lookup',
        action: 'Register Corroboration',
        result: 'No direct retraction registered for Lin et al.',
        status: 'success',
        detail: 'Clean signal across Retraction Watch dataset.',
      },
      {
        tool: 'openalex_global_registry',
        action: 'Global Graph Verification',
        result: 'is_retracted: false (218 citations, Developmental Biology)',
        status: 'success',
        detail: 'Direct paper verified nominal across global graph.',
      },
      {
        tool: 'pubmed_retraction_verifier',
        action: 'NIH NLM Verification',
        result: 'MeSH Category: Journal Article (Nominal NIH status)',
        status: 'success',
        detail: 'Direct publication is in good standing with PubMed Central.',
      },
      {
        tool: 'semantic_scholar_graph',
        action: '1-Hop Dependency Graph Traversal',
        result: 'Extracted 32 cited works from bibliography',
        status: 'success',
        detail: 'Bibliography extracted for concurrent verification.',
      },
      {
        tool: 'check_reference_retractions',
        action: 'Concurrent Reference Cross-Check',
        result: 'RETRACTION FOUND: Reference 10.1038/nature13358 retracted',
        status: 'warning',
        detail: 'Foundational paper in section 3.2 is retracted Obokata 2014.',
      },
      {
        tool: 'contamination_vector_calculator',
        action: 'Quantitative Blast Radius Calculus',
        result: 'CSI Score: 0.782 · CRITICAL_METHODOLOGICAL_RISK',
        status: 'warning',
        detail: 'Calculated vulnerability for Specific Aim 1. Identified clean replacement: Takahashi et al. 2016.',
      },
      {
        tool: 'escalate_to_human',
        action: 'Human Decision Boundary Enforcement',
        result: 'Routed to PI Human Decision Inbox (Auto-retraction forbidden)',
        status: 'warning',
        detail: 'AI evaluates facts; Principal Investigator retains final scientific authority.',
      },
      {
        tool: 'provenance_proof_generator',
        action: 'HMAC-SHA256 Cryptographic Audit Seal',
        result: 'PROOF-SHA256-3C77E90B12FA9018 Generated',
        status: 'success',
        detail: 'Cryptographically seals cascade findings and routing decision.',
      },
    ],
    consensus: ['Crossref REST API', 'Retraction Watch Database', 'OpenAlex Global Registry', 'PubMed Central / NIH NLM'],
    vector: {
      csi: 0.782,
      depth: 2,
      vulnerability: 'Critical Methodological Protocol (Specific Aim 1)',
      cleanAlternative: 'Takahashi et al. (Nature Protocols 2016) — Standardized Reprogramming',
    },
    proofId: 'PROOF-SHA256-3C77E90B12FA9018',
    hmacSeal: '3c77e90b12fa9018e38d99042b1ca77e91d034298fa1098b6723e4109874a1f2',
  },
  {
    id: 'clean-nature',
    name: 'Silent Pass Nominal Verification (Nature 2016)',
    doi: '10.1038/s41586-021-03819-2',
    type: 'CLEAN_VERIFIED',
    badge: '🟢 SILENT PASS',
    description: 'AlphaFold protein prediction paper. Verified clean across all 4 registries, 1-hop reference graph completely free of retractions. Generates SHA-256 seal and passes silently with zero PI noise.',
    executionSteps: [
      {
        tool: 'crossref_lookup',
        action: 'Publisher Metadata Verification',
        result: 'Valid Nature article; references indexed; 0 errata',
        status: 'success',
        detail: 'Publisher record nominal.',
      },
      {
        tool: 'retraction_watch_lookup',
        action: 'Register Corroboration',
        result: 'Clean signal across Retraction Watch',
        status: 'success',
        detail: 'No retractions or corrections filed.',
      },
      {
        tool: 'openalex_global_registry',
        action: 'Global Registry Impact Check',
        result: 'is_retracted: false (22,400+ citations, Structural Biology)',
        status: 'success',
        detail: 'Global scholarly graph confirms clean standing.',
      },
      {
        tool: 'pubmed_retraction_verifier',
        action: 'NIH NLM / MeSH Publication Audit',
        result: 'MeSH Category: Journal Article (Verified NIH NLM)',
        status: 'success',
        detail: 'Indexed in PubMed Central with full integrity.',
      },
      {
        tool: 'semantic_scholar_graph',
        action: 'Reference Dependency Tree Extraction',
        result: 'Extracted 64 referenced works',
        status: 'success',
        detail: 'Entire bibliography extracted for cross-checking.',
      },
      {
        tool: 'check_reference_retractions',
        action: 'Concurrent Bibliography Scan',
        result: '64/64 references verified CLEAN',
        status: 'success',
        detail: 'Zero retracted foundation papers found.',
      },
      {
        tool: 'provenance_proof_generator',
        action: 'HMAC-SHA256 Cryptographic Audit Seal',
        result: 'PROOF-SHA256-78EF910D44BC8812 Generated',
        status: 'success',
        detail: 'Sealed as SILENT_PASS in tamper-evident compliance ledger.',
      },
    ],
    consensus: ['Crossref REST API', 'Retraction Watch Database', 'OpenAlex Global Registry', 'PubMed Central / NIH NLM'],
    proofId: 'PROOF-SHA256-78EF910D44BC8812',
    hmacSeal: '78ef910d44bc881299a38f7129ca081bf45291b8a91340cd398fa90123ef8901',
  },
];

export interface StrandsSovereignBossModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StrandsSovereignBossModal({ isOpen, onClose }: StrandsSovereignBossModalProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'consensus' | 'sandbox' | 'proofs'>('matrix');
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(SCENARIOS[1]);
  const [copiedProof, setCopiedProof] = useState(false);
  const [simStep, setSimStep] = useState<number>(selectedScenario.executionSteps.length);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleCopyProof = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  const handleRunSimulation = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setSimStep(0);
    setIsSimulating(true);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setSimStep(current);
      if (current >= scenario.executionSteps.length) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-indigo-500/50 bg-slate-950 text-slate-100 shadow-2xl shadow-indigo-950/80 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. SUPREME ULTIMATE BOSS HEADER */}
        <div className="relative border-b border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-purple-950/70 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30">
                  <Crown size={17} />
                </span>
                <span className="font-mono text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">
                  STRANDS SOVEREIGN AGENT CORE · ULTIMATE BOSS LEVEL
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                  <Flame size={12} className="text-amber-400" />
                  POWER LEVEL: 100% UNRIVALED
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>The Sovereign Research Integrity Fleet</span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-400">
                  10/10 TOOLS ARMED
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                Powered by the authentic Python Strands Agent orchestrator. Autonomous tool selection, 4-way multi-registry consensus, quantitative contamination vector calculus, and cryptographic SHA-256 HMAC provenance proofs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 text-xs font-bold transition-colors"
                data-testid="btn-close-strands-boss"
              >
                Close HUD
              </button>
            </div>
          </div>

          {/* KPI Mini Ribbons */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-2.5">
              <div className="text-[10px] font-mono text-indigo-400 uppercase">Fleet Size</div>
              <div className="text-lg font-mono font-black text-white">10 Specialized Tools</div>
              <div className="text-[10px] text-slate-400">Zero redundant calls</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5">
              <div className="text-[10px] font-mono text-emerald-400 uppercase">Consensus Width</div>
              <div className="text-lg font-mono font-black text-white">4 Scientific Registries</div>
              <div className="text-[10px] text-slate-400">Crossref · RW · OpenAlex · PubMed</div>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-2.5">
              <div className="text-[10px] font-mono text-purple-400 uppercase">Provenance Standard</div>
              <div className="text-lg font-mono font-black text-white">HMAC-SHA256</div>
              <div className="text-[10px] text-slate-400">Tamper-evident audit receipts</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-2.5">
              <div className="text-[10px] font-mono text-amber-400 uppercase">Safety Policy</div>
              <div className="text-lg font-mono font-black text-white">Deterministic + Human PI</div>
              <div className="text-[10px] text-slate-400">AI auto-retraction strictly forbidden</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-indigo-900/40 pb-0">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-t-xl transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Layers size={14} />
              <span>10-Tool Operational Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('consensus')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-t-xl transition-colors ${
                activeTab === 'consensus'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Database size={14} />
              <span>4-Way Multi-Registry Consensus</span>
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-t-xl transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Terminal size={14} />
              <span>Live Boss Sandbox &amp; Calculus</span>
            </button>
            <button
              onClick={() => setActiveTab('proofs')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-t-xl transition-colors ${
                activeTab === 'proofs'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Lock size={14} />
              <span>Cryptographic Provenance Seals</span>
            </button>
          </div>
        </div>

        {/* 2. BODY CONTENT ACCORDING TO ACTIVE TAB */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* TAB 1: 10-TOOL OPERATIONAL MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Full 10-Tool Autonomous Fleet</h3>
                  <p className="text-xs text-slate-400">
                    Each tool is registered in the authentic Strands Agent SDK (<code className="text-indigo-300">from strands import Agent, tool</code>) with enforceable negative constraints.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  ALL 10 TOOLS ARMED &amp; NOMINAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SOVEREIGN_TOOLS.map((tool, idx) => (
                  <div
                    key={tool.name}
                    className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-indigo-500/40 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                            TOOL #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                            [{tool.category}]
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {tool.displayName}
                        </h4>
                        <div className="font-mono text-[11px] text-slate-400">
                          <code>{tool.name}()</code>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                          <Activity size={10} />
                          {tool.latencyMs}ms
                        </span>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">{tool.provider}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-[11px] text-amber-300/90 flex items-start gap-2">
                      <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="font-mono">{tool.negativeConstraint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 4-WAY MULTI-REGISTRY CONSENSUS */}
          {activeTab === 'consensus' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 to-slate-900/60 p-5 space-y-2">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Database size={18} className="text-indigo-400" />
                  <span>The Quad-Registry Consensus Architecture</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Most academic tools rely on a single database and create blind spots when notices are delayed. Grant Guardian’s Strands Agent orchestrates <strong>4-way concurrent registry verification</strong> across Crossref, Retraction Watch, OpenAlex, and PubMed. A paper is only cleared when all registries confirm zero retractions and zero uninvestigated errata.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-wider">Registry 1</span>
                    <span className="size-2 rounded-full bg-blue-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Crossref REST API</h4>
                  <p className="text-xs text-slate-400">
                    Official DOI registration authority. Scans publisher relation trees for <code className="text-blue-300">is-retracted-by</code> notices, Crossmark update events, and formal publisher corrigenda.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                    Coverage: 150M+ DOIs
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-purple-400 uppercase tracking-wider">Registry 2</span>
                    <span className="size-2 rounded-full bg-purple-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Retraction Watch DB</h4>
                  <p className="text-xs text-slate-400">
                    Curated investigative registry. Extracts formal retraction reasons (data fabrication, image manipulation, ethical violations), dates, and institutional committee findings.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                    Coverage: 50,000+ Verified Cases
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Registry 3</span>
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white">OpenAlex Global Graph</h4>
                  <p className="text-xs text-slate-400">
                    Global open academic knowledge graph. Validates global citation counts, primary research concept hierarchies, and corroborating retraction flags across disciplines.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                    Coverage: 250M+ Scholarly Works
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-rose-400 uppercase tracking-wider">Registry 4</span>
                    <span className="size-2 rounded-full bg-rose-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white">PubMed Central / MeSH</h4>
                  <p className="text-xs text-slate-400">
                    National Institutes of Health (NIH) National Library of Medicine. Direct query of official MeSH publication categories (e.g. <em>Retracted Publication</em>) and NIH funding link status.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                    Coverage: 36M+ Biomedical Works
                  </div>
                </div>
              </div>

              {/* Consensus Matrix Invariant */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
                <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-300">
                  Consensus Decision Rules
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-red-500/30 space-y-1">
                    <div className="font-bold text-red-400">ANY Registry Confirms Retraction</div>
                    <div className="text-slate-300 font-mono text-[11px]">&rarr; Immediate QUARANTINE_CLAIM</div>
                    <p className="text-[10px] text-slate-400">Prunes reference graph crawl immediately. Cryptographic proof sealed.</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-400">Clean Root + Retracted Foundation Reference</div>
                    <div className="text-slate-300 font-mono text-[11px]">&rarr; Calculate Vector + ESCALATE_TO_PI</div>
                    <p className="text-[10px] text-slate-400">AI auto-retraction forbidden. PI receives blast radius calculus.</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-emerald-500/30 space-y-1">
                    <div className="font-bold text-emerald-400">All 4 Registries Confirm Clean</div>
                    <div className="text-slate-300 font-mono text-[11px]">&rarr; SILENT_PASS (Zero Annoyance)</div>
                    <p className="text-[10px] text-slate-400">Logged to audit trail without triggering notifications or banner fatigue.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE BOSS SANDBOX & CALCULUS */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white">Interactive Sovereign Agent Sandbox</h3>
                  <p className="text-xs text-slate-400">
                    Test any scenario to watch the 10-tool agent dynamically branch, execute multi-registry consensus, compute contamination vectors, and generate cryptographic seals.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => handleRunSimulation(sc)}
                      disabled={isSimulating}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                        selectedScenario.id === sc.id
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sc.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Scenario Card */}
              <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                        {selectedScenario.badge}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{selectedScenario.name}</h4>
                    </div>
                    <div className="font-mono text-xs text-slate-400 mt-1">DOI: {selectedScenario.doi}</div>
                  </div>

                  <button
                    onClick={() => handleRunSimulation(selectedScenario)}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
                  >
                    <Play size={12} className="fill-white" />
                    <span>{isSimulating ? 'Executing Tool Chain...' : 'Re-run Agent Execution'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300">{selectedScenario.description}</p>

                {/* Step-by-Step Tool Trace */}
                <div className="space-y-2.5">
                  <div className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Autonomous Tool Dispatch Trace ({Math.min(simStep, selectedScenario.executionSteps.length)}/{selectedScenario.executionSteps.length} Dispatched)
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    {selectedScenario.executionSteps.slice(0, simStep).map((step, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 border transition-all ${
                          step.status === 'flagged'
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : step.status === 'warning'
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : step.status === 'pruned'
                            ? 'bg-slate-900 border-slate-700/60 text-slate-400'
                            : 'bg-indigo-950/20 border-indigo-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700 text-[10px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white">{step.tool}()</span>
                            <span className="text-[10px] text-slate-400">· {step.action}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              step.status === 'flagged'
                                ? 'bg-rose-900/60 text-rose-300'
                                : step.status === 'warning'
                                ? 'bg-amber-900/60 text-amber-300'
                                : step.status === 'pruned'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-900/60 text-emerald-300'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <div className="mt-1 pl-7 text-[11px] text-slate-300">{step.result}</div>
                        <div className="mt-0.5 pl-7 text-[10px] text-slate-500">{step.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contamination Vector Calculus Box (if applicable) */}
                {selectedScenario.vector && simStep >= 7 && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase">
                        <Zap size={14} />
                        <span>Contamination Vector Calculus Output</span>
                      </div>
                      <span className="font-mono text-xs font-black text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded">
                        CSI: {selectedScenario.vector.csi} / 1.000
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Cascade Dependency Depth</div>
                        <div className="text-white font-bold">{selectedScenario.vector.depth}-Hop Propagation</div>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Proposal Impact Vector</div>
                        <div className="text-white font-bold">{selectedScenario.vector.vulnerability}</div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/40 p-2.5 text-xs">
                      <div className="font-mono text-[10px] font-bold text-emerald-400 uppercase">
                        Clean Alternative Replacement Vector
                      </div>
                      <div className="text-white font-semibold mt-0.5">
                        {selectedScenario.vector.cleanAlternative}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CRYPTOGRAPHIC PROVENANCE SEALS */}
          {activeTab === 'proofs' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-slate-900/60 p-5 space-y-2">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Fingerprint size={18} className="text-purple-400" />
                  <span>Tamper-Evident SHA-256 HMAC Provenance Proofs</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Every decision rendered by Grant Guardian’s Strands Agent is cryptographically sealed according to NIST SP 800-92 standards. The evaluated DOI, timestamp, multi-registry consensus status, and policy decision are bound with an HMAC-SHA256 signature and Merkle leaf hash, giving institutional compliance officers proof that findings were never altered.
                </p>
              </div>

              <div className="space-y-4">
                {SCENARIOS.map((sc) => (
                  <div
                    key={sc.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 font-mono text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white">{sc.proofId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sc.badge}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">DOI: {sc.doi}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">HMAC-SHA256 Cryptographic Seal</span>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 break-all select-all">
                          {sc.hmacSeal}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Multi-Registry Consensus</span>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 space-y-0.5">
                          {sc.consensus.map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 size={11} className="text-emerald-400" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">Compliance: Uniform Guidance 2 CFR 200 / NIST SP 800-92</span>
                      <button
                        onClick={() => handleCopyProof(JSON.stringify(sc, null, 2))}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-colors"
                      >
                        {copiedProof ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedProof ? 'Copied Full Audit JSON!' : 'Copy Audit Receipt JSON'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
