import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  GitFork,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
  FileWarning,
} from 'lucide-react';

export interface ContaminationTier {
  id: string;
  level: number;
  badge: string;
  badgeColor: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  doi: string;
  role: 'retracted_root' | 'research_paper' | 'review_article' | 'grant_proposal';
  status: 'retracted' | 'intermediate_carrier' | 'synthesizing_review' | 'contaminated_aim';
  claimSnippet: string;
  whyContaminated: string;
  evidence: string;
}

export const DEFAULT_CONTAMINATION_CHAIN: ContaminationTier[] = [
  {
    id: 'tier-root',
    level: 1,
    badge: 'ROOT SOURCE · RETRACTED',
    badgeColor: 'bg-rose-500 text-white border-rose-600',
    title: 'Stimulus-triggered fate conversion of somatic cells into pluripotency',
    authors: 'Obokata, Sasai, Niwa et al.',
    venue: 'Nature 505:641–647',
    year: 2014,
    doi: '10.1038/nature13358',
    role: 'retracted_root',
    status: 'retracted',
    claimSnippet: 'Asserted that transient low-pH stress generates pluripotent stem cells without genetic transcription factors (STAP protocol).',
    whyContaminated: 'Primary fraudulent literature source. Retracted July 2, 2014 by Nature following institutional misconduct findings (fabricated DNA profiling & duplicated gel images).',
    evidence: 'Retraction Watch & Nature Editorial: Retraction notice confirmed (2014-07-02).',
  },
  {
    id: 'tier-paper',
    level: 2,
    badge: 'INTERMEDIATE RESEARCH PAPER',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    title: 'Characterization of cellular viability in microfluidic acid-stress environments',
    authors: 'Martinez, Zhao & Becker et al.',
    venue: 'Biomaterials 112:88–97',
    year: 2017,
    doi: '10.1016/j.biomaterials.2016.11.018',
    role: 'research_paper',
    status: 'intermediate_carrier',
    claimSnippet: 'Calibrated microfluidic shear-stress equations assuming baseline cell plasticity metrics reported in Obokata et al. (2014).',
    whyContaminated: 'This research paper was NEVER retracted itself. However, its baseline mathematical equations for cell survival under acid stress adopted Obokata et al.\'s fabricated plasticity threshold.',
    evidence: 'Semantic Scholar Graph: Cites 10.1038/nature13358 in Section 2.1 (Methods Calibration).',
  },
  {
    id: 'tier-review',
    level: 3,
    badge: 'SECONDARY REVIEW ARTICLE',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    title: 'Downstream applications of stimulus-triggered pluripotency in tissue engineering',
    authors: 'Lin, Martinez, Zhao et al.',
    venue: 'Cell Stem Cell 16:210–224',
    year: 2015,
    doi: '10.1016/j.stem.2015.01.002',
    role: 'review_article',
    status: 'synthesizing_review',
    claimSnippet: 'Synthesized regenerative tissue scaffold approaches, endorsing low-pH stress conditioning as an energy-efficient alternative protocol.',
    whyContaminated: 'Synthesizes findings across multiple labs. Fails to note that the foundational stress-protocol was retracted, passing the contaminated premise downstream as standard literature.',
    evidence: 'Crossref + Semantic Scholar: Clean direct DOI, but Section 3.2 embeds 2nd-order retracted dependency.',
  },
  {
    id: 'tier-proposal',
    level: 4,
    badge: 'YOUR GRANT PROPOSAL',
    badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    title: 'NSF CAREER: Bio-orthogonal Hydrogels for Neural Tissue Regeneration',
    authors: 'Your Laboratory (Dr. Elena Rossi, PI)',
    venue: 'Active Grant Proposal Workspace',
    year: 2026,
    doi: 'PROPOSAL-2026-AIM-2',
    role: 'grant_proposal',
    status: 'contaminated_aim',
    claimSnippet: 'Specific Aim 2 (Hypothesis 2B): Proposes using transient micro-acidic buffering to precondition neural progenitors on scaffolds, citing Lin et al. (2015).',
    whyContaminated: '⚠ CONTAMINATION DETECTED: Your grant proposal does not directly cite the retracted 2014 paper, but its Aim 2 experimental design leans on a review article that inherited the fraudulent mechanism.',
    evidence: 'Grant Guardian Dependency Engine: Multi-hop trace confirmed 2 hops from retracted root to Proposal Aim 2.',
  },
];

export function ContaminationCascade({
  chain = DEFAULT_CONTAMINATION_CHAIN,
}: {
  chain?: ContaminationTier[];
}) {
  const [selectedTierId, setSelectedTierId] = useState<string>(chain[chain.length - 1].id);
  const [isTracing, setIsTracing] = useState(false);

  const selected = chain.find((c) => c.id === selectedTierId) || chain[chain.length - 1];

  const triggerTraceAnimation = () => {
    setIsTracing(true);
    setTimeout(() => setIsTracing(false), 2400);
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs overflow-hidden" data-testid="contamination-cascade-component">
      {/* Signature Header */}
      <div className="border-b border-[hsl(var(--border))] p-5 bg-[hsl(var(--card))]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                <FileWarning size={15} />
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--muted-foreground))]">
                Signature Feature · Research Propagation
              </span>
              <span className="rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--foreground))]">
                Multi-Hop Contamination
              </span>
            </div>
            <h3 className="mt-1 text-[16px] font-bold text-[hsl(var(--foreground))]">
              How Compromised Research Propagates Into Grant Proposals
            </h3>
            <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))] max-w-2xl font-medium">
              <strong className="text-[hsl(var(--foreground))]">The problem isn&apos;t just that a citation was retracted.</strong> The problem is that the retraction silently propagated through intermediate literature into your grant.
            </p>
          </div>

          <button
            type="button"
            onClick={triggerTraceAnimation}
            disabled={isTracing}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            data-testid="btn-animate-cascade"
          >
            <RefreshCw size={12} className={isTracing ? 'animate-spin text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'} />
            <span>{isTracing ? 'Tracing Contamination Flow...' : 'Simulate Contamination Flow'}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[hsl(var(--border))]">
        {/* Visual Cascade Vertical Chain Canvas */}
        <div className="p-6 bg-[hsl(var(--card))] flex flex-col items-center justify-center">
          <div className="w-full max-w-[460px] space-y-2 relative">
            {chain.map((tier, idx) => {
              const isSelected = selectedTierId === tier.id;
              const isLast = idx === chain.length - 1;

              return (
                <React.Fragment key={tier.id}>
                  {/* Tier Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all relative shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'border-[hsl(var(--foreground))] bg-[hsl(var(--muted))] ring-1 ring-[hsl(var(--border))]'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/.4)]'
                    }`}
                    data-testid={`cascade-tier-${tier.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                        {tier.badge}
                      </span>
                      <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                        Hop {idx}
                      </span>
                    </div>

                    <h4 className="mt-2 text-[13px] font-bold text-[hsl(var(--foreground))] leading-snug">
                      {tier.title}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                      <span>{tier.authors}</span>
                      <span>·</span>
                      <span>{tier.venue} ({tier.year})</span>
                    </div>

                    <p className="mt-2 text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-2">
                      {tier.claimSnippet}
                    </p>
                  </button>

                  {/* Flow Arrow with "cited by" label */}
                  {!isLast && (
                    <div className="flex flex-col items-center justify-center my-1.5 py-1">
                      <div className={`w-0.5 h-3 ${isTracing ? 'bg-[hsl(var(--foreground))] animate-pulse' : 'bg-[hsl(var(--border))]'}`} />
                      <div className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
                        <ArrowDown size={10} className={isTracing ? 'text-[hsl(var(--foreground))] animate-bounce' : 'text-[hsl(var(--muted-foreground))]'} />
                        <span>cited by</span>
                      </div>
                      <div className={`w-0.5 h-3 ${isTracing ? 'bg-[hsl(var(--foreground))] animate-pulse' : 'bg-[hsl(var(--border))]'}`} />
                    </div>
                  )}

                  {/* Terminal Contamination Alert Tag */}
                  {isLast && (
                    <div className="mt-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold text-[hsl(var(--foreground))] uppercase tracking-widest">
                        <AlertTriangle size={14} className="text-[hsl(var(--muted-foreground))]" />
                        ⚠ CONTAMINATION REACHES PROPOSAL AIM
                      </div>
                      <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                        Hypothesis in Aim 2 is vulnerable to grant reviewer challenge unless remediated.
                      </p>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Tier Inspector Details Panel */}
        <div className="p-6 flex flex-col justify-between space-y-5 bg-[hsl(var(--card))]">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-[hsl(var(--muted-foreground))]">
                  Cascade Node Inspector
                </span>
                <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                  {selected.badge}
                </span>
              </div>
              <h3 className="mt-2 text-[15px] font-bold text-[hsl(var(--foreground))] leading-tight">
                {selected.title}
              </h3>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                {selected.authors} · {selected.venue} ({selected.year})
              </p>
              <div className="mt-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                Identifier: <span className="text-[hsl(var(--foreground))] select-all font-semibold">{selected.doi}</span>
              </div>
            </div>

            {/* How it propagates contamination */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[hsl(var(--foreground))] tracking-wider">
                <AlertTriangle size={12} />
                Contamination Mechanism
              </div>
              <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
                {selected.whyContaminated}
              </p>
            </div>

            {/* Scientific claim */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.2)] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))] tracking-wider">
                <Info size={12} />
                Claim / Experimental Text
              </div>
              <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-serif italic">
                &ldquo;{selected.claimSnippet}&rdquo;
              </p>
            </div>

            {/* Authoritative evidence */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))] tracking-wider">
                <ShieldCheck size={12} className="text-[hsl(var(--muted-foreground))]" />
                Authoritative Provenance
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                {selected.evidence}
              </p>
            </div>
          </div>

          {/* Vetted Alternative Pathway Callout */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase font-bold text-[hsl(var(--foreground))]">
                Recommended Clean Recovery Pathway
              </span>
              <span className="rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--foreground))]">
                Zero Retraction Cascade
              </span>
            </div>
            <p className="text-[11px] text-[hsl(var(--foreground))] font-medium">
              Replace Section 3.2 acid-stress conditioning citations with <strong>Takahashi &amp; Yamanaka (Cell 2019)</strong> standard transcription factors.
            </p>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              Crossref verified: 0 errata · Fully reproducible protocol
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
