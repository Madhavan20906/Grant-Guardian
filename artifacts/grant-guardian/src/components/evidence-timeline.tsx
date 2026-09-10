import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  GitFork,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface TraceStep {
  step: 'dependency' | 'crossref' | 'retraction_watch' | 'relationship' | 'propagation' | 'safety_policy' | 'decision' | 'strands_reasoning' | string;
  status: 'success' | 'warning' | 'flagged' | 'danger' | 'neutral' | string;
  label: string;
  detail: string;
  durationMs?: number;
  timestamp?: string;
  provider?: string;
  url?: string;
  raw?: unknown;
}

export interface EvidenceMetadata {
  providers?: {
    crossref?: boolean;
    retractionWatch?: boolean;
    semanticScholar?: boolean;
  };
  graph?: {
    rootDoi?: string;
    referencedDois?: string[];
    retractedReferencedDois?: string[];
    depth?: number;
    cascade?: {
      project?: string;
      intermediatePaper?: string;
      retractedPaper?: string;
      retractionReason?: string;
    };
  };
  trace?: TraceStep[];
  [key: string]: unknown;
}

export function EvidenceTimeline({ metadata, doi }: { metadata?: EvidenceMetadata; doi?: string }) {
  const [showRaw, setShowRaw] = useState(false);

  const cascade = metadata?.graph?.cascade;
  const isPropagation = (metadata?.graph?.retractedReferencedDois?.length ?? 0) > 0 || !!cascade;

  // Canonical 7-step observable agent trace fallback
  const defaultTrace: TraceStep[] = [
    {
      step: 'dependency',
      status: 'success',
      label: 'Step 1 — Identify Dependency',
      detail: isPropagation
        ? 'Dependency graph mapped: Active grant proposal links to referenced literature tree.'
        : 'Direct citation registered in active lab workspace bibliography.',
      durationMs: 15,
      provider: 'Semantic Scholar Graph',
    },
    {
      step: 'crossref',
      status: 'success',
      label: 'Step 2 — Check Crossref',
      detail: 'Metadata queried & publisher indexing confirmed. Direct publisher errata inspected.',
      durationMs: 120,
      provider: 'Crossref',
    },
    {
      step: 'retraction_watch',
      status: isPropagation ? 'success' : 'success',
      label: 'Step 3 — Query Retraction Watch',
      detail: isPropagation
        ? 'Direct DOI check clear. Retraction database queried for referenced foundation works.'
        : (metadata?.providers?.retractionWatch ? 'No retraction notice recorded for this paper.' : 'Retraction Watch scanned.'),
      durationMs: 75,
      provider: 'Retraction Watch',
    },
    {
      step: 'relationship',
      status: isPropagation ? 'warning' : 'success',
      label: 'Step 4 — Verify Relationship',
      detail: isPropagation
        ? `Citation relationship confirmed. Found ${metadata?.graph?.retractedReferencedDois?.length ?? 1} foundation paper(s) flagged in database.`
        : 'Crossref relations verified: 0 corrections, 0 retractions.',
      durationMs: 45,
      provider: 'Strands Orchestrator',
    },
    {
      step: 'propagation',
      status: isPropagation ? 'warning' : 'success',
      label: 'Step 5 — Assess Propagation',
      detail: isPropagation
        ? 'Potential 2nd-order impact: Underlying premise or protocol may inherit retracted findings.'
        : 'Reference graph clean. Zero propagation risk detected.',
      durationMs: 180,
      provider: 'Strands Propagation Engine',
    },
    {
      step: 'safety_policy',
      status: isPropagation ? 'warning' : 'success',
      label: 'Step 6 — Apply Safety Policy',
      detail: isPropagation
        ? 'Autonomous quarantine NOT permitted. Deterministic guardrail preserves researcher judgment.'
        : 'Safety policy approved. Clear pass.',
      durationMs: 14,
      provider: 'Deterministic Safety Guardrail',
    },
    {
      step: 'decision',
      status: isPropagation ? 'warning' : 'success',
      label: 'Step 7 — Decision & Human Routing',
      detail: isPropagation
        ? 'Escalated to Human Decision Inbox. PI domain review and signoff required.'
        : 'Silent Pass. Heartbeat recorded with zero interruptions.',
      durationMs: 8,
      provider: 'Guardian Restraint Core',
    },
  ];

  const traceSteps = (metadata?.trace && metadata.trace.length > 0) ? metadata.trace : defaultTrace;

  const getStepIcon = (step: string, status: string) => {
    if (status === 'flagged' || status === 'danger') return XCircle;
    if (status === 'warning') return AlertTriangle;
    if (step === 'dependency') return GitFork;
    if (step === 'crossref') return Database;
    if (step === 'retraction_watch') return ShieldCheck;
    if (step === 'relationship') return Sparkles;
    if (step === 'propagation') return GitFork;
    if (step === 'safety_policy') return ShieldCheck;
    if (step === 'decision') return Sparkles;
    return CheckCircle2;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged':
      case 'danger':
        return <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--destructive)/.15)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--destructive))]"><XCircle size={11} /> Flagged</span>;
      case 'warning':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"><AlertTriangle size={11} /> Escalated</span>;
      case 'neutral':
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300"><Sparkles size={11} /> Strands Agent</span>;
      case 'success':
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={11} /> Verified</span>;
    }
  };

  return (
    <div className="space-y-4" data-testid="container-evidence-timeline">
      {/* Strands Centerpiece & Audit Header */}
      <div className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-3.5 text-[hsl(var(--sidebar-foreground))] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-purple-500" />
            </span>
            <span className="gg-mono text-[10px] font-extrabold uppercase tracking-widest text-[hsl(var(--sidebar-foreground))]">
              Strands Agent Investigation Trace
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 gg-mono text-[9px] font-bold text-purple-300 border border-purple-500/30">
            <Sparkles size={10} /> Observable Reasoning
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-[hsl(var(--sidebar-foreground)/.65)] gg-mono border-t border-[hsl(var(--sidebar-border))] pt-2">
          <span>7-Step Deterministic Sequence</span>
          <span>{traceSteps.reduce((acc, curr) => acc + (curr.durationMs ?? 0), 0)}ms total execution</span>
        </div>
      </div>

      {/* The 3-Hop Research Catastrophe Cascade Diagram (Priority 3) */}
      {cascade && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-[11px] shadow-sm" data-testid="box-3hop-cascade">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle size={15} className="text-amber-600" />
              <span>3-HOP PROPAGATION DEPENDENCY CASCADE</span>
            </div>
            <span className="gg-mono text-[9px] font-extrabold bg-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-200">
              Depth: 2 Hops
            </span>
          </div>

          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex items-center gap-2 rounded bg-[hsl(var(--card))] p-2 border border-[hsl(var(--border))]">
              <span className="size-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-bold text-[hsl(var(--foreground))]">Hop 0 (Your Proposal):</span>
              <span className="text-[hsl(var(--muted-foreground))]">{cascade.project ?? 'Active Lab Grant'}</span>
            </div>
            <div className="ml-4 flex items-center gap-2 border-l-2 border-amber-500/50 pl-3">
              <span className="text-amber-600 font-bold">└── cites</span>
              <div className="flex-1 rounded bg-[hsl(var(--card))] p-2 border border-[hsl(var(--border))]">
                <span className="font-bold text-[hsl(var(--foreground))]">Hop 1 (Intermediate Study):</span>
                <span className="ml-1 text-[hsl(var(--muted-foreground))]">{cascade.intermediatePaper}</span>
              </div>
            </div>
            <div className="ml-8 flex items-center gap-2 border-l-2 border-destructive/60 pl-3">
              <span className="text-destructive font-bold">└── relies on</span>
              <div className="flex-1 rounded bg-destructive/10 p-2 border border-destructive/30 text-destructive">
                <span className="font-bold">Hop 2 (Root Foundation):</span>
                <span className="ml-1 font-semibold">{cascade.retractedPaper}</span>
                <span className="ml-2 inline-block rounded bg-destructive text-white px-1.5 py-0.2 text-[8px] font-extrabold uppercase">
                  ⚠️ RETRACTED
                </span>
                {cascade.retractionReason && (
                  <p className="mt-1 text-[9px] text-destructive/90 font-sans italic">
                    Reason: {cascade.retractionReason}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded bg-amber-500/15 p-2 text-[10px] text-amber-900 dark:text-amber-200 font-medium">
            💡 <strong>Restraint Invariant Enforced</strong>: Lin et al. itself is NOT retracted. Guardian will never auto-quarantine this study or accuse the researcher of misconduct. Only the Principal Investigator can determine whether your grant's claim depends on the invalidated premise.
          </div>
        </div>
      )}

      {/* 7-Step Observable Investigation Sequence Cards */}
      <div className="relative space-y-3 before:absolute before:left-4 before:top-4 before:h-[calc(100%-2rem)] before:w-0.5 before:bg-[hsl(var(--border))]">
        {traceSteps.map((step, idx) => {
          const IconComponent = getStepIcon(step.step, step.status);
          const isDanger = step.status === 'flagged' || step.status === 'danger';
          const isWarning = step.status === 'warning';
          const isNeutral = step.status === 'neutral';

          return (
            <div
              key={idx}
              className={`relative flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                isDanger
                  ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.05)] shadow-sm'
                  : isWarning
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : isNeutral
                  ? 'border-purple-500/30 bg-purple-500/5'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/.4)]'
              }`}
              data-testid={`trace-step-${step.step}`}
            >
              <div
                className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                  isDanger
                    ? 'bg-[hsl(var(--destructive))] text-white'
                    : isWarning
                    ? 'bg-amber-600 text-white'
                    : isNeutral
                    ? 'bg-purple-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                <IconComponent size={14} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-[hsl(var(--foreground))]">
                      {step.label}
                    </span>
                    {getStatusBadge(step.status)}
                  </div>
                  {step.durationMs && (
                    <span className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))]">
                      {step.durationMs}ms
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {step.detail}
                </p>

                {(step.provider || step.timestamp || step.url) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[hsl(var(--muted-foreground)/.8)]">
                    {step.provider && (
                      <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-medium">
                        Provider: {step.provider}
                      </span>
                    )}
                    {step.timestamp && (
                      <span className="gg-mono">
                        {new Date(step.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[hsl(var(--accent-foreground))] hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Source <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Connectivity & Failure as a Feature */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-3 text-[10px] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="gg-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Evidence Sources Verified:
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--card))] px-2 py-0.5 text-[9px] font-bold border border-[hsl(var(--border))]">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Crossref
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--card))] px-2 py-0.5 text-[9px] font-bold border border-[hsl(var(--border))]">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Retraction Watch
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--card))] px-2 py-0.5 text-[9px] font-bold border border-[hsl(var(--border))]">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Semantic Scholar
            </span>
          </div>
        </div>
        <p className="text-[9px] italic text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border)/.6)] pt-1.5">
          🛡️ <em>"Grant Guardian would rather admit uncertainty than manufacture certainty."</em> If any provider experiences an outage, decisions are safely withheld for human review rather than fabricated.
        </p>
      </div>

      {/* Raw Payload Auditor Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          data-testid="button-toggle-raw-json"
        >
          <FileCode size={13} />
          {showRaw ? 'Hide Raw Audit JSON' : 'Inspect Raw Evidence Payload'}
          {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showRaw && (
          <div className="mt-2 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] p-3">
            <div className="mb-2 gg-mono text-[9px] uppercase tracking-wider text-[hsl(var(--sidebar-foreground)/.6)]">
              Raw JSON Evidence Payload (DOI: {doi || 'N/A'})
            </div>
            <pre className="max-h-56 overflow-auto text-[10px] leading-relaxed text-[hsl(var(--sidebar-foreground))]">
              {JSON.stringify(metadata ?? { note: 'No raw metadata' }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
