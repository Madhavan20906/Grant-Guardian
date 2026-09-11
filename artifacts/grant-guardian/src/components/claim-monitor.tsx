import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, FileText, Check } from 'lucide-react';

export interface GrantClaim {
  id: string;
  claimNumber: number;
  title: string;
  statement: string;
  proposalSection: string;
  status: 'safe' | 'review_required';
  supportingCitations: {
    doi: string;
    citationText: string;
    status: 'clear' | 'propagation' | 'retracted';
  }[];
  recoveryStatus?: 'pending' | 'alternative_found' | 'resolved';
}

const DEFAULT_CLAIMS: GrantClaim[] = [
  {
    id: 'claim-1',
    claimNumber: 1,
    title: 'Biocompatible Scaffold Degradation',
    statement: 'Porous hydrogel architectures maintain 94% tensile integrity across 14-day subcutaneous implantation.',
    proposalSection: 'Aim 1: Biomaterial Fabrication (p. 8)',
    status: 'safe',
    supportingCitations: [
      {
        doi: '10.1038/s41586-021-03819-2',
        citationText: 'Jumper et al., Nature 2021',
        status: 'clear',
      },
    ],
  },
  {
    id: 'claim-2',
    claimNumber: 2,
    title: 'Stimulus-Triggered Differentiation Protocol',
    statement: 'Low-pH microenvironments trigger high-efficiency somatic cell fate reprogramming for cartilage generation.',
    proposalSection: 'Aim 2: In-Vivo Differentiation (p. 14)',
    status: 'review_required',
    supportingCitations: [
      {
        doi: '10.1016/j.stem.2015.01.002',
        citationText: 'Lin et al., Cell Stem Cell 2015',
        status: 'propagation',
      },
      {
        doi: '10.1038/nature13358',
        citationText: 'Obokata et al., Nature 2014 (Foundational Dependency)',
        status: 'retracted',
      },
    ],
    recoveryStatus: 'alternative_found',
  },
  {
    id: 'claim-3',
    claimNumber: 3,
    title: 'Multi-Axis Stress Bioreactor Validation',
    statement: 'Continuous cyclic compression accelerates extracellular matrix collagen type-II deposition by 34%.',
    proposalSection: 'Aim 3: Bioreactor Integration (p. 21)',
    status: 'safe',
    supportingCitations: [
      {
        doi: '10.1016/j.cell.2019.08.019',
        citationText: 'Takahashi & Yamanaka, Cell 2019',
        status: 'clear',
      },
    ],
  },
];

export function ClaimMonitor() {
  const [claims, setClaims] = useState<GrantClaim[]>(DEFAULT_CLAIMS);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('claim-2');

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[1];

  const recoverySteps = [
    { step: 1, label: 'Identify affected claim', done: true },
    { step: 2, label: 'Assess dependency', done: true },
    { step: 3, label: 'Find alternative evidence', done: true },
    { step: 4, label: 'PI reviews & decides', done: false },
    { step: 5, label: 'Update proposal text', done: false },
    { step: 6, label: 'Record lab resolution', done: false },
  ];

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-5" data-testid="container-claim-monitor">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300">
              <FileText size={14} />
            </span>
            <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
              Grant Claim Dependency Map
            </h3>
            <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[9px] gg-mono font-extrabold text-blue-700 dark:text-blue-300">
              NSF CAREER Proposal
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
            Grant Guardian monitors claims, not just isolated papers. Retraction of foundational citations triggers claim-level alerts.
          </p>
        </div>

        <span className="gg-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          1 Claim Requires Review
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
        {/* Claims List */}
        <div className="space-y-2">
          {claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              onClick={() => setSelectedClaimId(claim.id)}
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                selectedClaimId === claim.id
                  ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--muted-foreground)/.3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
                  Claim #{claim.claimNumber} · {claim.proposalSection}
                </span>
                {claim.status === 'review_required' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-extrabold text-amber-700 dark:text-amber-300">
                    <AlertTriangle size={10} /> Review Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={10} /> Safe
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[12px] font-bold text-[hsl(var(--foreground))]">
                {claim.title}
              </div>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))] line-clamp-2">
                "{claim.statement}"
              </p>
            </button>
          ))}
        </div>

        {/* Selected Claim Deep Dive & Recovery Workflow */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.25)] p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
                Claim Inspection & Supporting Evidence
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {selectedClaim.proposalSection}
              </span>
            </div>
            <h4 className="mt-2 text-[14px] font-bold text-[hsl(var(--foreground))]">
              Claim #{selectedClaim.claimNumber}: {selectedClaim.title}
            </h4>
            <blockquote className="mt-2 rounded-lg bg-[hsl(var(--card))] border-l-4 border-blue-500 p-3 text-[11px] italic text-[hsl(var(--foreground))]">
              "{selectedClaim.statement}"
            </blockquote>
          </div>

          {/* Supporting Citations List */}
          <div className="space-y-2">
            <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
              Underlying Citation Dependencies
            </span>
            <div className="space-y-1.5">
              {selectedClaim.supportingCitations.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2.5 text-[11px]"
                >
                  <div>
                    <span className="font-bold text-[hsl(var(--foreground))]">{c.citationText}</span>
                    <div className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))]">{c.doi}</div>
                  </div>
                  {c.status === 'retracted' ? (
                    <span className="rounded bg-red-600 text-white font-bold px-1.5 py-0.5 text-[8px] uppercase">
                      Retracted Root
                    </span>
                  ) : c.status === 'propagation' ? (
                    <span className="rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 text-[8px] uppercase">
                      2nd-Order Risk
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 text-[8px] uppercase">
                      Clean
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6-Step Recovery Workflow */}
          {selectedClaim.status === 'review_required' && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-600" /> 6-Step Autonomous Recovery Path
                </span>
                <span className="gg-mono text-[8px] font-bold text-purple-700 dark:text-purple-300">
                  Step 4 of 6 Pending
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                {recoverySteps.map((s) => (
                  <div
                    key={s.step}
                    className={`rounded p-2 border ${
                      s.done
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      {s.done ? <Check size={11} className="text-emerald-500" /> : <span className="size-2 rounded-full bg-amber-500" />}
                      <span>Step {s.step}</span>
                    </div>
                    <div className="mt-0.5 truncate">{s.label}</div>
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
