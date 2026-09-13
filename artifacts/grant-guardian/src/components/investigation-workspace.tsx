import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  GitFork,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Search,
  ArrowRight,
  Layers,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import type { Citation } from '@workspace/api-client-react';
import { useAuth } from '@/context/auth-context';
import { CitationGraph } from './citation-graph';
import { BlastRadius } from './blast-radius';
import { WhyThisDecisionPanel } from './why-this-decision-panel';
import { ContaminationCascade } from './contamination-cascade';
import { HumanDecisionBoundary, HumanDecisionAction } from './human-decision-boundary';

export interface InvestigationWorkspaceProps {
  citation: Citation;
  onClose: () => void;
  onJudgment: (id: number, judgment: any, notes?: string, replacementDoi?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function InvestigationWorkspace({
  citation,
  onClose,
  onJudgment,
  isSubmitting = false,
}: InvestigationWorkspaceProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'why' | 'cascade' | 'matrix' | 'graph' | 'agent' | 'decision'>('overview');
  const [notes, setNotes] = useState('');
  const [showWhyAlert, setShowWhyAlert] = useState(true);
  const [showWhyNotQuarantine, setShowWhyNotQuarantine] = useState(true);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  const isPropagation = citation.status === 'propagation' || citation.risk === 'medium';
  const isRetracted = citation.status === 'retracted';

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))]" data-testid="investigation-workspace">
      {/* Header bar */}
      <div className="border-b border-[hsl(var(--border))] px-6 py-4 bg-[hsl(var(--background))]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex size-8 items-center justify-center rounded-lg ${
              isRetracted
                ? 'bg-red-500/20 text-red-600'
                : isPropagation
                ? 'bg-amber-500/20 text-amber-600'
                : 'bg-emerald-500/20 text-emerald-600'
            }`}>
              {isRetracted ? <ShieldAlert size={18} /> : isPropagation ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="gg-mono text-[9px] uppercase tracking-widest font-extrabold text-[hsl(var(--muted-foreground))]">
                  Investigation Workspace
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] gg-mono font-bold uppercase ${
                  isRetracted
                    ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                    : isPropagation
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {citation.status}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Evidence Freshness: <span className="text-emerald-600 font-bold">🟢 Fresh (Verified 12m ago)</span>
                </span>
              </div>
              <h2 className="text-[17px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                {citation.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://doi.org/${citation.doi}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md border border-[hsl(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              DOI Record <ExternalLink size={11} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[hsl(var(--border))] p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4 -mb-4 overflow-x-auto border-t border-[hsl(var(--border))] pt-2">
          {[
            { id: 'overview', label: 'Overview & Explainer' },
            { id: 'why', label: 'Why This Decision?' },
            { id: 'cascade', label: 'Contamination Cascade' },
            { id: 'graph', label: 'Citation Graph & Ripple' },
            { id: 'matrix', label: 'Evidence Matrix' },
            { id: 'agent', label: 'Agent Activity Trace' },
            { id: 'decision', label: 'Human Decision Boundary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-[11px] font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                  : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {tab.id === 'decision' && isPropagation && (
                <span className="ml-1.5 size-1.5 inline-block rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Why You're Seeing This Callout */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowWhyAlert(!showWhyAlert)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle size={15} className="text-amber-600" />
                  <span className="text-[12px] font-bold text-amber-900 dark:text-amber-200">
                    Why you're seeing this alert
                  </span>
                </div>
                {showWhyAlert ? <ChevronUp size={14} className="text-amber-600" /> : <ChevronDown size={14} className="text-amber-600" />}
              </button>

              {showWhyAlert && (
                <div className="space-y-2 text-[11px] text-[hsl(var(--foreground))] pt-2 border-t border-amber-500/20">
                  <p className="leading-relaxed">
                    Guardian detected a 2nd-order propagation relationship:
                  </p>
                  <div className="font-mono text-[10px] bg-[hsl(var(--card))] p-3 rounded-lg border border-amber-500/20 space-y-1">
                    <div>Your proposal: {user.proposalName} ({user.labName})</div>
                    <div className="text-amber-600 font-bold">  ↓ cites</div>
                    <div>Paper A: Lin et al., Cell Stem Cell (2015)</div>
                    <div className="text-red-600 font-bold">  ↓ relies on (Sec 3.2)</div>
                    <div className="text-red-700 dark:text-red-300 font-extrabold">Paper B: Obokata et al., Nature (2014) ⚠️ RETRACTED</div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                    <strong>Crucial distinction:</strong> Lin et al. is not itself retracted. Guardian therefore <em>did NOT</em> automatically quarantine your citation. Human scientific judgment is required to assess whether your specific claim relies on the retracted stimulus findings.
                  </p>
                </div>
              )}
            </div>

            {/* Why Didn't Guardian Quarantine Callout */}
            {isPropagation && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowWhyNotQuarantine(!showWhyNotQuarantine)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-blue-600" />
                    <span className="text-[12px] font-bold text-blue-900 dark:text-blue-200">
                      Why didn't Guardian quarantine this automatically?
                    </span>
                  </div>
                  {showWhyNotQuarantine ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                </button>

                {showWhyNotQuarantine && (
                  <div className="space-y-2 text-[11px] text-[hsl(var(--foreground))] pt-2 border-t border-blue-500/20">
                    <ul className="space-y-1 font-medium text-[11px]">
                      <li className="flex items-center gap-1.5 text-emerald-600">✓ Retraction in underlying reference verified</li>
                      <li className="flex items-center gap-1.5 text-emerald-600">✓ Citation relationship confirmed via Semantic Scholar</li>
                      <li className="flex items-center gap-1.5 text-amber-600">✕ Direct retraction of Lin et al. was NOT found</li>
                      <li className="flex items-center gap-1.5 text-amber-600">✕ Scientific invalidity cannot be declared by AI</li>
                    </ul>
                    <div className="rounded bg-blue-500/10 p-2 text-[10px] text-blue-800 dark:text-blue-300 font-mono font-bold">
                      🛡️ SAFETY POLICY: AUTO-QUARANTINE BLOCKED · HUMAN REVIEW MANDATORY
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paper Metadata Card */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4 space-y-2">
                <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
                  Authors & Journal
                </span>
                <div className="text-[13px] font-bold">{citation.authors}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {citation.venue} ({citation.year})
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4 space-y-2">
                <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
                  Identifier & Evidence Status
                </span>
                <div className="text-[12px] font-bold font-mono truncate">{citation.doi}</div>
                <div className="text-[11px] text-emerald-600 font-bold">
                  Crossref Verified · Retraction Watch Clean (Direct)
                </div>
              </div>
            </div>

            {/* Recovery Path & Alternative Evidence Finder */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-600" />
                  <span className="text-[12px] font-bold text-purple-900 dark:text-purple-200">
                    Recovery Path: Recommended Alternative Evidence
                  </span>
                </div>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 gg-mono text-[8px] font-extrabold text-purple-700 dark:text-purple-300">
                  ASSISTANT RECOVERY
                </span>
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                If you decide this dependency compromises your proposal, Guardian identified independent, unretracted alternative literature:
              </p>

              <div className="rounded-lg border border-purple-500/30 bg-[hsl(var(--card))] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[hsl(var(--foreground))]">
                    Takahashi & Yamanaka (2019) · Cell Review
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ Clean Literature Record
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Independent lineage using Yamanaka factor induction. Provides the exact biocompatible scaffold compatibility without relying on low-pH stimuli.
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px]">
                  <span className="gg-mono text-[hsl(var(--muted-foreground))]">DOI: 10.1016/j.cell.2019.08.019</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('decision')}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    Adopt Alternative in Decision →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold">Evidence Confidence Matrix</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Granular multi-dimensional assessment separating verified evidence from scientific human judgment.
                </p>
              </div>
              <span className="gg-mono text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1">
                Calibrated Assessment
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[hsl(var(--muted)/.6)] gg-mono text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                  <tr>
                    <th className="px-4 py-3">Dimension</th>
                    <th className="px-4 py-3">Assessment</th>
                    <th className="px-4 py-3">Source / Method</th>
                    <th className="px-4 py-3">Authority Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  <tr>
                    <td className="px-4 py-3 font-bold">Retraction evidence</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">🟢 Strong</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Retraction Watch Registry (Notice confirmed)</td>
                    <td className="px-4 py-3 gg-mono text-[10px]">Autonomous Verify</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold">DOI identity & metadata</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">🟢 Verified</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Crossref API (10.1016/j.stem.2015.01.002)</td>
                    <td className="px-4 py-3 gg-mono text-[10px]">Autonomous Verify</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold">Citation relationship</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">🟢 Verified</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Semantic Scholar Graph (Referenced in Sec 3.2)</td>
                    <td className="px-4 py-3 gg-mono text-[10px]">Autonomous Traverse</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold">Scientific dependency</td>
                    <td className="px-4 py-3 text-amber-600 font-bold">🟡 Uncertain</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Domain claim interaction cannot be inferred by AI</td>
                    <td className="px-4 py-3 gg-mono text-[10px] text-amber-700">HUMAN DOMAIN</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold">Impact on grant proposal</td>
                    <td className="px-4 py-3 text-amber-600 font-bold">🟠 Human Review</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Principal Investigator assessment required</td>
                    <td className="px-4 py-3 gg-mono text-[10px] text-amber-700">PI AUTHORITY</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4 text-[11px] leading-relaxed space-y-1">
              <span className="font-bold text-[hsl(var(--foreground))]">Architectural Principle:</span>
              <p className="text-[hsl(var(--muted-foreground))]">
                Grant Guardian will never produce a monolithic "94% safe" AI percentage. Real scientific credibility demands distinguishing high observable evidence confidence from unknown scientific dependency.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: GRAPH & RIPPLE */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <CitationGraph compact={false} selectedNodeId="lin2015" />
            <BlastRadius />
          </div>
        )}

        {/* TAB 4: AGENT ACTIVITY TRACE */}
        {activeTab === 'agent' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold">Observable Agent Tool Selection & Trace</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  No hidden chain-of-thought. Inspect exact API calls, parameters, and deterministic policies.
                </p>
              </div>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 gg-mono text-[9px] font-bold text-purple-700 dark:text-purple-300">
                Strands Orchestrator
              </span>
            </div>

            {/* Observable Tool Result Cards */}
            <div className="grid gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-[hsl(var(--card))] p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Database size={13} /> 1. TOOL: crossref_doi_verifier
                  </span>
                  <span className="gg-mono text-[10px] text-emerald-600">✓ 200 OK · 120ms</span>
                </div>
                <div className="text-[11px] text-[hsl(var(--foreground))] font-mono">
                  Input: {'{ doi: "10.1016/j.stem.2015.01.002" }'}
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Output: Verified publication status. No errata, expressions of concern, or direct retractions registered with Crossref.
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-[hsl(var(--card))] p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={13} /> 2. TOOL: retraction_watch_query
                  </span>
                  <span className="gg-mono text-[10px] text-emerald-600">✓ 200 OK · 76ms</span>
                </div>
                <div className="text-[11px] text-[hsl(var(--foreground))] font-mono">
                  Input: {'{ query: "10.1016/j.stem.2015.01.002" }'}
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Output: Direct paper has 0 matches. Clean record.
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-[hsl(var(--card))] p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <GitFork size={13} /> 3. TOOL: semantic_scholar_reference_graph
                  </span>
                  <span className="gg-mono text-[10px] text-amber-600">⚠ 1 Flagged Dependency · 315ms</span>
                </div>
                <div className="text-[11px] text-[hsl(var(--foreground))] font-mono">
                  Input: {'{ doi: "10.1016/j.stem.2015.01.002", depth: 1 }'}
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Output: 44 references traversed. Reference #18 links to 10.1038/nature13358 (Retracted Nature 2014 study).
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-[hsl(var(--card))] p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                    <ShieldAlert size={13} /> 4. SAFETY POLICY: deterministic_guardrail
                  </span>
                  <span className="gg-mono text-[10px] text-purple-600">🛡️ Auto-Quarantine Blocked · 14ms</span>
                </div>
                <div className="text-[11px] text-[hsl(var(--foreground))] font-mono">
                  Rule evaluated: {'{ relation: "second_order", direct_retraction: false }'}
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Action enforced: Automatic deletion/quarantine blocked. Second-order scientific invalidity cannot be assumed. Escalating to human decision inbox.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: WHY THIS DECISION? */}
        {activeTab === 'why' && (
          <div className="space-y-6">
            <WhyThisDecisionPanel
              doi={citation.doi}
              paperTitle={citation.title}
              status={citation.status}
            />
          </div>
        )}

        {/* TAB: CONTAMINATION CASCADE */}
        {activeTab === 'cascade' && (
          <div className="space-y-6">
            <ContaminationCascade />
          </div>
        )}

        {/* TAB: HUMAN DECISION BOUNDARY */}
        {activeTab === 'decision' && (
          <div className="space-y-6">
            <HumanDecisionBoundary
              citationId={citation.id}
              citationTitle={citation.title}
              citationDoi={citation.doi}
              currentStatus={citation.status}
              recommendedAction={
                isPropagation
                  ? "Replace Section 3.2 low-pH pluripotency citations with standardized Yamanaka transcription factors (Cell 2019)."
                  : isRetracted
                  ? "Quarantine citation permanently from active grant drafts."
                  : "Citation verified clear across registries."
              }
              onDecision={async (action, notes, replacementDoi) => {
                await onJudgment(citation.id, action, notes, replacementDoi);
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
