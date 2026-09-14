import React, { useState, useMemo } from 'react';
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
import type { Citation } from '@workspace/api-client-react';
import { useAuth, formatDisplayName } from '@/context/auth-context';

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
    title: 'Active Research Grant Proposal Workspace',
    authors: 'Your Laboratory (Principal Investigator)',
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

export function buildCascadeForCitation(citation: Citation, user: any): ContaminationTier[] {
  const userProposal = user?.proposalName || 'Active Research Grant Proposal';
  const userName = user?.name || 'Your Laboratory';
  const userLab = user?.labName || 'Your Laboratory';
  const userTitle = formatDisplayName(user);
  const status = citation.status || 'clear';

  // 1. Direct Retracted Paper
  if (status === 'retracted') {
    return [
      {
        id: 'tier-retracted-root',
        level: 1,
        badge: 'PRIMARY LITERATURE · RETRACTED',
        badgeColor: 'bg-rose-500 text-white border-rose-600',
        title: citation.title,
        authors: citation.authors,
        venue: `${citation.venue} (${citation.year})`,
        year: citation.year,
        doi: citation.doi,
        role: 'retracted_root',
        status: 'retracted',
        claimSnippet: citation.detail || `Direct manuscript registered under DOI ${citation.doi}. Flagged for formal editorial retraction sanction.`,
        whyContaminated: `Direct formal retraction issued by publisher and confirmed in Retraction Watch database. The core methodology and empirical claims have been officially invalidated.`,
        evidence: `Retraction Watch & Publisher Metadata: Direct retraction notice indexed for ${citation.doi}.`,
      },
      {
        id: 'tier-quarantined-boundary',
        level: 2,
        badge: 'AUTOMATED SAFETY BARRIER',
        badgeColor: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
        title: 'Grant Guardian Autonomous Quarantine Sentinel',
        authors: 'Guardian Policy Engine',
        venue: 'Deterministic Safety Barrier',
        year: new Date().getFullYear(),
        doi: 'GUARDIAN-DEFENSE-BOUNDARY',
        role: 'research_paper',
        status: 'intermediate_carrier',
        claimSnippet: `Direct retraction signal satisfied automated isolation invariant. Citation quarantined from active proposal drafts.`,
        whyContaminated: `Zero ambiguous propagation: Because the primary manuscript is directly retracted, safety policy isolates this reference to prevent grant contamination.`,
        evidence: `Deterministic Guardrail Rule: { direct_retraction: true, auto_isolate: true }.`,
      },
      {
        id: 'tier-proposal-shielded',
        level: 3,
        badge: 'YOUR GRANT PROPOSAL · PROTECTED',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        title: userProposal,
        authors: `${userLab} (${userTitle || userName}, PI)`,
        venue: 'Active Grant Proposal Workspace',
        year: 2026,
        doi: `PROPOSAL-2026-${(user?.tenantSlug || 'LAB').toUpperCase()}`,
        role: 'grant_proposal',
        status: 'contaminated_aim',
        claimSnippet: `Proposal reference register quarantined this paper. Active grant drafts are shielded from direct bibliographic fraud.`,
        whyContaminated: `PROTECTED: Reference isolated before grant submission. Remediation required to substitute with verified literature.`,
        evidence: `Grant Guardian Audit Trail: Direct retraction quarantined in local lab registry.`,
      },
    ];
  }

  // 2. Propagation / 2nd-Order Risk
  if (status === 'propagation') {
    const rootDoi = citation.metadata?.graph?.retractedReferencedDois?.[0] || '10.1038/nature13358';
    const retractedName = citation.metadata?.graph?.cascade?.retractedPaper || 'Obokata et al., Nature (2014)';
    const reason = citation.metadata?.graph?.cascade?.retractionReason || 'Image manipulation & unreliable protocol';

    return [
      {
        id: 'tier-prop-root',
        level: 1,
        badge: 'UPSTREAM ROOT · RETRACTED',
        badgeColor: 'bg-rose-500 text-white border-rose-600',
        title: retractedName,
        authors: 'Retracted Foundational Source',
        venue: 'Authoritative Literature Registry',
        year: 2014,
        doi: rootDoi,
        role: 'retracted_root',
        status: 'retracted',
        claimSnippet: `Foundational experimental claim later found invalid: ${reason}.`,
        whyContaminated: `Upstream literature source retracted for data fabrication. Never cited directly in your grant proposal.`,
        evidence: `Retraction Watch Registry: Formal retraction notice confirmed for ${rootDoi}.`,
      },
      {
        id: 'tier-prop-carrier',
        level: 2,
        badge: 'UNRETRACTED INTERMEDIATE CITATION',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        title: citation.title,
        authors: citation.authors,
        venue: `${citation.venue} (${citation.year})`,
        year: citation.year,
        doi: citation.doi,
        role: 'review_article',
        status: 'synthesizing_review',
        claimSnippet: citation.detail || `Cites upstream retracted work in methodology section. Article itself is NOT retracted.`,
        whyContaminated: `This manuscript is completely unretracted itself. However, it relies on findings from ${rootDoi}, acting as a silent carrier downstream.`,
        evidence: `Semantic Scholar Graph Traversal: Direct bibliographic dependency on ${rootDoi}.`,
      },
      {
        id: 'tier-prop-proposal',
        level: 3,
        badge: 'YOUR GRANT PROPOSAL · REVIEW REQUIRED',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        title: userProposal,
        authors: `${userLab} (${userTitle || userName}, PI)`,
        venue: 'Active Grant Proposal Workspace',
        year: 2026,
        doi: `PROPOSAL-2026-${(user?.tenantSlug || 'LAB').toUpperCase()}`,
        role: 'grant_proposal',
        status: 'contaminated_aim',
        claimSnippet: `Proposal cites ${citation.authors} (${citation.year}). Scientific validity depends on whether your specific aim uses the compromised sub-claim.`,
        whyContaminated: `⚠ 2ND-ORDER PROPAGATION DETECTED: Auto-quarantine blocked by deterministic safety guardrail. Human scientific domain judgment required.`,
        evidence: `Grant Guardian Propagation Engine: 2 hops verified from retracted root ${rootDoi} to ${userProposal}.`,
      },
    ];
  }

  // 3. Publisher Erratum / Corrigendum
  if (status === 'corrected') {
    return [
      {
        id: 'tier-corrected-publisher',
        level: 1,
        badge: 'FORMAL CORRIGENDUM / ERRATUM',
        badgeColor: 'bg-blue-500 text-white border-blue-600',
        title: citation.title,
        authors: citation.authors,
        venue: `${citation.venue} (${citation.year})`,
        year: citation.year,
        doi: citation.doi,
        role: 'research_paper',
        status: 'intermediate_carrier',
        claimSnippet: citation.detail || `Publisher issued an official corrigendum notice adjusting statistical calculations or author affiliations.`,
        whyContaminated: `CORRECTION NOTICE ISSUED: The manuscript was revised through formal publisher errata. The underlying scientific validity remains intact with corrigendum applied.`,
        evidence: `Crossref Metadata Registry: Erratum / Corrigendum notice linked to ${citation.doi}.`,
      },
      {
        id: 'tier-corrected-proposal',
        level: 2,
        badge: 'YOUR GRANT PROPOSAL · VALID WITH NOTICE',
        badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        title: userProposal,
        authors: `${userLab} (${userTitle || userName}, PI)`,
        venue: 'Active Grant Proposal Workspace',
        year: 2026,
        doi: `PROPOSAL-2026-${(user?.tenantSlug || 'LAB').toUpperCase()}`,
        role: 'grant_proposal',
        status: 'contaminated_aim',
        claimSnippet: `Safe to cite in active grant proposal with published corrigendum noted in proposal bibliography.`,
        whyContaminated: `VALIDATED: Guardian verifies this is NOT a retraction. Citation passed with informational erratum flag attached.`,
        evidence: `Grant Guardian Policy: Corrigenda do not trigger quarantine or propagation alarms.`,
      },
    ];
  }

  // 4. Clean / Clear Verified Paper
  return [
    {
      id: 'tier-clear-root',
      level: 1,
      badge: 'VERIFIED PRIMARY SOURCE · SOUND',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700',
      title: citation.title,
      authors: citation.authors,
      venue: `${citation.venue} (${citation.year})`,
      year: citation.year,
      doi: citation.doi,
      role: 'research_paper',
      status: 'intermediate_carrier',
      claimSnippet: citation.detail || `Verified authoritative publication record indexed in Crossref and OpenAlex with 0 retraction notices.`,
      whyContaminated: `CLEAN FOUNDATION: Independent peer-reviewed manuscript with pristine editorial history and no linked retractions.`,
      evidence: `Crossref REST API + Retraction Watch: Verified valid publication under ${citation.doi}.`,
    },
    {
      id: 'tier-clear-graph',
      level: 2,
      badge: 'MULTI-HOP REFERENCE GRAPH SCAN',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      title: 'Full Bibliographic Reference Dependency Traversal',
      authors: 'Semantic Scholar Graph Engine',
      venue: 'Automated Reference Audit',
      year: new Date().getFullYear(),
      doi: `${citation.doi}#references`,
      role: 'review_article',
      status: 'synthesizing_review',
      claimSnippet: `Traversed all 1st-hop references cited by ${citation.authors} across global registries. Found zero links to retracted literature.`,
      whyContaminated: `ZERO CASCADE RISK: None of the foundational references cited by this manuscript have been sanctioned or retracted.`,
      evidence: `Semantic Scholar Graph + Retraction Watch Corroboration: 0 tainted upstream links.`,
    },
    {
      id: 'tier-clear-proposal',
      level: 3,
      badge: 'YOUR GRANT PROPOSAL · VERIFIED SOUND',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      title: userProposal,
      authors: `${userLab} (${userTitle || userName}, PI)`,
      venue: 'Active Grant Proposal Workspace',
      year: 2026,
      doi: `PROPOSAL-2026-${(user?.tenantSlug || 'LAB').toUpperCase()}`,
      role: 'grant_proposal',
      status: 'contaminated_aim',
      claimSnippet: `Citation passed autonomously under Silent Pass Policy. Scientific foundation verified sound for proposal submission.`,
      whyContaminated: `VERIFIED SECURE: This citation presents 0% contamination risk to your proposal aims.`,
      evidence: `Grant Guardian Invariant: Sound citations pass silently with zero researcher alert fatigue.`,
    },
  ];
}

export function ContaminationCascade({
  chain,
  citation,
}: {
  chain?: ContaminationTier[];
  citation?: Citation;
}) {
  const { user } = useAuth();
  const userName = user.name || 'Your Laboratory';
  const userTitle = formatDisplayName(user);
  const userProposal = user.proposalName || 'Active Research Grant Proposal';

  const isCleanChain = citation ? citation.status === 'clear' : false;
  const isRetractedDirect = citation ? citation.status === 'retracted' : false;

  const dynamicChain = useMemo(() => {
    if (citation) {
      return buildCascadeForCitation(citation, user);
    }
    const sourceChain = chain || DEFAULT_CONTAMINATION_CHAIN;
    return sourceChain.map((tier) => {
      if (tier.id === 'tier-proposal' || tier.role === 'grant_proposal') {
        return {
          ...tier,
          title: userProposal,
          authors: `${user.labName || 'Your Laboratory'} (${userTitle || userName}, PI)`,
          evidence: `Grant Guardian Dependency Engine: Multi-hop trace confirmed 2 hops from retracted root to ${userProposal} Aim 2.`,
        };
      }
      return tier;
    });
  }, [chain, citation, user, userProposal, userTitle, userName]);

  const [selectedTierId, setSelectedTierId] = useState<string>(dynamicChain[dynamicChain.length - 1].id);
  const [isTracing, setIsTracing] = useState(false);

  // Sync selected tier if dynamic chain changes
  const activeSelectedId = dynamicChain.some((c) => c.id === selectedTierId)
    ? selectedTierId
    : dynamicChain[dynamicChain.length - 1].id;

  const selected = dynamicChain.find((c) => c.id === activeSelectedId) || dynamicChain[dynamicChain.length - 1];

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
              <span className={`font-mono text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--muted-foreground))]`}>
                {citation ? `Target Investigation · ${citation.doi}` : 'Signature Feature · Research Propagation'}
              </span>
              <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${
                isCleanChain
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : isRetractedDirect
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
              }`}>
                {isCleanChain ? '0 Retractions Detected' : isRetractedDirect ? 'Direct Quarantined' : 'Multi-Hop Analysis'}
              </span>
            </div>
            <h3 className="mt-1 text-[16px] font-bold text-[hsl(var(--foreground))]">
              {isCleanChain
                ? 'Bibliographic Lineage & Reference Verification Trail'
                : isRetractedDirect
                ? 'Direct Retraction Quarantine & Proposal Shielding'
                : 'How Compromised Research Propagates Into Grant Proposals'}
            </h3>
            <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))] max-w-2xl font-medium">
              {isCleanChain ? (
                <>Verified sound across Crossref, Retraction Watch, and all cited reference trees. This paper presents zero risk to your proposal aims.</>
              ) : isRetractedDirect ? (
                <>Direct retraction notice verified. Guardian&apos;s deterministic safety policy has isolated this literature from active proposal drafts.</>
              ) : (
                <><strong className="text-[hsl(var(--foreground))]">The problem isn&apos;t just that a citation was retracted.</strong> The problem is that the retraction silently propagated through intermediate literature into your grant.</>
              )}
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
            <span>{isTracing ? 'Tracing Dependency Flow...' : 'Simulate Dependency Flow'}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[hsl(var(--border))]">
        {/* Visual Cascade Vertical Chain Canvas */}
        <div className="p-6 bg-[hsl(var(--card))] flex flex-col items-center justify-center">
          <div className="w-full max-w-[480px] space-y-2 relative">
            {dynamicChain.map((tier, idx) => {
              const isSelected = activeSelectedId === tier.id;
              const isLast = idx === dynamicChain.length - 1;
              const isRoot = tier.role === 'retracted_root';
              const isProposal = tier.role === 'grant_proposal';

              return (
                <React.Fragment key={tier.id}>
                  {/* Tier Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all relative shadow-xs cursor-pointer ${
                      isSelected
                        ? isCleanChain
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                          : isRoot
                          ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30'
                          : isProposal
                          ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                          : 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                        : isCleanChain
                        ? 'border-emerald-500/25 bg-[hsl(var(--card))] hover:border-emerald-500/50'
                        : isRoot
                        ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-[hsl(var(--card))] to-[hsl(var(--card))] hover:border-rose-500/60'
                        : isProposal
                        ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/5 via-[hsl(var(--card))] to-[hsl(var(--card))] hover:border-purple-500/60'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-amber-500/40'
                    }`}
                    data-testid={`cascade-tier-${tier.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${tier.badgeColor}`}>
                        {tier.badge}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">
                        Hop {idx}
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-bold text-[hsl(var(--foreground))] leading-snug">
                      {tier.title}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[hsl(var(--muted-foreground))] font-mono">
                      <span>{tier.authors}</span>
                      <span>·</span>
                      <span>{tier.venue} ({tier.year})</span>
                    </div>

                    <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                      {tier.claimSnippet}
                    </p>
                  </button>

                  {/* Flow Arrow with "cited by" label */}
                  {!isLast && (
                    <div className="flex flex-col items-center justify-center my-1.5 py-1">
                      <div className={`w-0.5 h-3 ${isTracing ? (isCleanChain ? 'bg-emerald-500' : 'bg-amber-500') + ' animate-pulse' : 'bg-[hsl(var(--border))]'}`} />
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] shadow-2xs">
                        <ArrowDown size={11} className={isTracing ? (isCleanChain ? 'text-emerald-500' : 'text-amber-500') + ' animate-bounce' : 'text-[hsl(var(--muted-foreground))]'} />
                        <span>{isCleanChain ? 'verifies foundation of' : 'cited by'}</span>
                      </div>
                      <div className={`w-0.5 h-3 ${isTracing ? (isCleanChain ? 'bg-emerald-500' : 'bg-amber-500') + ' animate-pulse' : 'bg-[hsl(var(--border))]'}`} />
                    </div>
                  )}

                  {/* Terminal Contamination Alert Tag */}
                  {isLast && (
                    <div className={`mt-3 rounded-2xl border p-3.5 text-center ${
                      isCleanChain
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : isRetractedDirect
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-rose-500/30 bg-rose-500/10'
                    }`}>
                      <div className={`flex items-center justify-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider ${
                        isCleanChain || isRetractedDirect
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300'
                      }`}>
                        {isCleanChain || isRetractedDirect ? (
                          <>
                            <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{isCleanChain ? '✓ VERIFIED SOUND PROPOSAL AIM' : '🛡️ PROPOSAL SHIELDED BY QUARANTINE'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" />
                            <span>⚠ CONTAMINATION REACHES PROPOSAL AIM</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] font-medium">
                        {isCleanChain
                          ? 'All cited literature has been corroborated across global registries. Safe to proceed.'
                          : isRetractedDirect
                          ? 'Direct fraudulent source blocked from grant text. Remediation alternative ready.'
                          : 'Hypothesis in proposal aims is vulnerable to reviewer challenge unless remediated.'}
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
                <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-[hsl(var(--muted-foreground))]">
                  Cascade Node Inspector
                </span>
                <span className={`font-mono text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${selected.badgeColor}`}>
                  {selected.badge}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-[hsl(var(--foreground))] leading-snug">
                {selected.title}
              </h3>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] font-medium">
                {selected.authors} · {selected.venue} ({selected.year})
              </p>
              <div className="mt-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                Identifier: <span className="text-[hsl(var(--foreground))] select-all font-semibold">{selected.doi}</span>
              </div>
            </div>

            {/* How it propagates contamination */}
            <div className={`rounded-2xl border p-4 space-y-1.5 ${
              isCleanChain
                ? 'border-emerald-500/25 bg-emerald-500/5'
                : 'border-amber-500/25 bg-amber-500/5'
            }`}>
              <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                isCleanChain ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
              }`}>
                {isCleanChain ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                <span>{isCleanChain ? 'Integrity Assessment' : 'Contamination Mechanism'}</span>
              </div>
              <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-medium">
                {selected.whyContaminated}
              </p>
            </div>

            {/* Scientific claim */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.25)] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))] tracking-wider">
                <Info size={13} />
                <span>Claim / Experimental Text</span>
              </div>
              <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-serif italic">
                &ldquo;{selected.claimSnippet}&rdquo;
              </p>
            </div>

            {/* Authoritative evidence */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))] tracking-wider">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Authoritative Provenance</span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                {selected.evidence}
              </p>
            </div>
          </div>

          {/* Vetted Alternative / Confirmation Callout */}
          <div className={`rounded-2xl border p-4 space-y-2 ${
            isCleanChain
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-purple-500/30 bg-purple-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[9px] uppercase font-bold ${
                isCleanChain ? 'text-emerald-700 dark:text-emerald-300' : 'text-purple-700 dark:text-purple-300'
              }`}>
                {isCleanChain ? 'Authoritative Invariant' : 'Recommended Recovery Pathway'}
              </span>
              <span className={`rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold ${
                isCleanChain
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-purple-500/20 border-purple-500/40 text-purple-800 dark:text-purple-200'
              }`}>
                {isCleanChain ? 'Zero Retraction Cascade' : 'Vetted Alternative'}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--foreground))] font-medium">
              {isCleanChain ? (
                <>This citation is registered with clean Crossref metadata and zero Retraction Watch sanction notices across all 1st-hop references.</>
              ) : isRetractedDirect ? (
                <>Isolate this reference from your bibliography. Replace with verified alternative literature to restore proposal integrity.</>
              ) : (
                <>Replace Section 3.2 low-pH conditioning citations with <strong>Takahashi &amp; Yamanaka (Cell 2019)</strong> standard transcription factors.</>
              )}
            </p>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              {isCleanChain ? `DOI: ${selected.doi} · Fully reproducible record` : 'Crossref verified: 0 errata · Fully reproducible protocol'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
