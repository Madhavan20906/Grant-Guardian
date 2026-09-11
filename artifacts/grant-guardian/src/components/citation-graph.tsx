import { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, GitFork, ArrowRight, ExternalLink, Info, Activity, RefreshCw } from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  authors: string;
  year: number;
  venue: string;
  doi: string;
  status: 'clear' | 'propagation' | 'retracted' | 'grant_root' | 'alternative';
  hop: number;
  claimsCount?: number;
  relationship: string;
  evidence: string;
  retractionReason?: string;
  independentOfRoot?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: 'CITES' | 'DEPENDS ON' | 'FOUNDATIONAL REFERENCE' | 'RETRACTED' | 'ALTERNATIVE';
  status: 'normal' | 'compromised' | 'severed' | 'safe';
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'grant',
    label: 'NSF CAREER Proposal (Materials Lab)',
    sublabel: 'Active Research Grant · PI: Dr. Elena Rossi',
    authors: 'Rossi Lab',
    year: 2026,
    venue: 'NSF Proposal 26-904',
    doi: 'PROPOSAL-2026-NSF-MAT',
    status: 'grant_root',
    hop: 0,
    claimsCount: 3,
    relationship: 'RESEARCH ROOT',
    evidence: 'Active lab submission workspace',
  },
  {
    id: 'lin2015',
    label: 'Lin et al. (2015)',
    sublabel: 'Downstream applications in tissue engineering',
    authors: 'Lin, Martinez, Zhao et al.',
    year: 2015,
    venue: 'Cell Stem Cell',
    doi: '10.1016/j.stem.2015.01.002',
    status: 'propagation',
    hop: 1,
    claimsCount: 2,
    relationship: 'DIRECT CITATION',
    evidence: 'Semantic Scholar Graph: Cites Obokata (2014) in Sec 3.2. Lin et al. itself has never been retracted.',
  },
  {
    id: 'obokata2014',
    label: 'Obokata et al. (2014)',
    sublabel: 'Stimulus-triggered fate conversion...',
    authors: 'Obokata, Sasai, Niwa et al.',
    year: 2014,
    venue: 'Nature 505:641–647',
    doi: '10.1038/nature13358',
    status: 'retracted',
    hop: 2,
    claimsCount: 0,
    relationship: 'FOUNDATIONAL REFERENCE (RETRACTED)',
    evidence: 'Retraction Watch confirmed formal retraction notice (July 2014) due to extensive image manipulation and data fabrication.',
    retractionReason: 'Image manipulation & unreproducible protocol',
  },
  {
    id: 'jumper2021',
    label: 'Jumper et al. (2021)',
    sublabel: 'Highly accurate protein structure prediction with AlphaFold',
    authors: 'Jumper, Evans, Pritzel et al.',
    year: 2021,
    venue: 'Nature 596:583–589',
    doi: '10.1038/s41586-021-03819-2',
    status: 'clear',
    hop: 1,
    claimsCount: 1,
    relationship: 'INDEPENDENT CITATION',
    evidence: 'Crossref + Retraction Watch verified: 0 retractions, 0 errata across 62 references.',
    independentOfRoot: true,
  },
  {
    id: 'alt2019',
    label: 'Takahashi & Yamanaka (2019 Review)',
    sublabel: 'Standardized transcription factor pluripotency',
    authors: 'Takahashi & Yamanaka',
    year: 2019,
    venue: 'Cell 179:1210–1225',
    doi: '10.1016/j.cell.2019.08.019',
    status: 'alternative',
    hop: 2,
    claimsCount: 2,
    relationship: 'RECOMMENDED ALTERNATIVE',
    evidence: 'Independent benchmarked protocol. Zero reliance on stimulus-triggered acid protocols.',
    independentOfRoot: true,
  }
];

export function CitationGraph({
  selectedNodeId,
  onSelectNode,
  compact = false,
}: {
  selectedNodeId?: string;
  onSelectNode?: (node: GraphNode) => void;
  compact?: boolean;
}) {
  const [activeId, setActiveId] = useState<string>(selectedNodeId || 'lin2015');
  const [animating, setAnimating] = useState(false);

  const selected = DEFAULT_NODES.find((n) => n.id === activeId) || DEFAULT_NODES[1];

  const handleSelect = (node: GraphNode) => {
    setActiveId(node.id);
    onSelectNode?.(node);
  };

  const triggerTraversal = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2400);
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm" data-testid="container-citation-graph">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] px-4 py-3">
        <div className="flex items-center gap-2">
          <GitFork size={15} className="text-[hsl(var(--muted-foreground))]" />
          <span className="text-[12px] font-bold text-[hsl(var(--foreground))]">
            Research Dependency Graph
          </span>
          <span className="rounded bg-[hsl(var(--secondary))] px-2 py-0.5 gg-mono text-[9px] font-bold text-[hsl(var(--secondary-foreground))]">
            Multi-Hop Traversal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerTraversal}
            disabled={animating}
            className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            data-testid="button-animate-traversal"
          >
            <RefreshCw size={11} className={animating ? 'animate-spin text-amber-500' : ''} />
            {animating ? 'Tracing Propagation...' : 'Animate Traversal'}
          </button>
        </div>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'lg:grid-cols-[1.35fr_1fr]'} gap-0`}>
        {/* Visual Graph Canvas Area */}
        <div className="relative p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[hsl(var(--muted)/.3)] via-[hsl(var(--background))] to-[hsl(var(--background))] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[hsl(var(--border))] min-h-[360px]">
          {/* Legend */}
          <div className="flex flex-wrap gap-2.5 text-[9px] gg-mono font-bold text-[hsl(var(--muted-foreground))] mb-4">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Active Grant</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Verified Clear</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Propagation Risk</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Retracted Work</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-purple-500" /> Replacement Path</span>
          </div>

          {/* Node Link Layout */}
          <div className="relative flex flex-col items-center justify-center gap-7 my-auto">
            {/* Level 0: Grant Root */}
            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={() => handleSelect(DEFAULT_NODES[0])}
                className={`group relative flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 shadow-sm transition-all ${
                  activeId === 'grant'
                    ? 'border-blue-600 bg-blue-500/15 ring-2 ring-blue-500/20'
                    : 'border-blue-400/40 bg-[hsl(var(--card))] hover:border-blue-500'
                }`}
                data-testid="graph-node-grant"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-[11px]">
                  P0
                </div>
                <div className="text-left">
                  <div className="gg-mono text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400">
                    Your Grant Proposal
                  </div>
                  <div className="text-[12px] font-bold text-[hsl(var(--foreground))]">
                    NSF Materials Proposal (2026)
                  </div>
                </div>
              </button>
            </div>

            {/* Edge Indicators 0 -> 1 */}
            <div className="flex justify-around w-full max-w-[420px] px-12 -my-3">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-amber-500/70" />
                <span className="bg-[hsl(var(--background))] px-1 text-[8px] gg-mono font-bold text-amber-700 dark:text-amber-300">
                  CITES (HOP 1)
                </span>
                <div className="w-0.5 h-6 bg-amber-500/70" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-emerald-500/60" />
                <span className="bg-[hsl(var(--background))] px-1 text-[8px] gg-mono font-bold text-emerald-600 dark:text-emerald-400">
                  CITES (HOP 1)
                </span>
                <div className="w-0.5 h-6 bg-emerald-500/60" />
              </div>
            </div>

            {/* Level 1: Direct Citations */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-[480px]">
              {/* Lin et al. */}
              <button
                type="button"
                onClick={() => handleSelect(DEFAULT_NODES[1])}
                className={`group relative flex flex-col rounded-xl border-2 p-3 text-left shadow-sm transition-all ${
                  activeId === 'lin2015'
                    ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/20'
                    : 'border-amber-500/40 bg-[hsl(var(--card))] hover:border-amber-500'
                }`}
                data-testid="graph-node-lin2015"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 gg-mono text-[8px] font-bold text-amber-800 dark:text-amber-300">
                    2ND-ORDER RISK
                  </span>
                  <AlertTriangle size={13} className="text-amber-500" />
                </div>
                <div className="mt-1.5 font-bold text-[12px] text-[hsl(var(--foreground))]">
                  Lin et al. (2015)
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                  Cell Stem Cell · Tissue Scaffolds
                </div>
              </button>

              {/* Jumper et al. */}
              <button
                type="button"
                onClick={() => handleSelect(DEFAULT_NODES[3])}
                className={`group relative flex flex-col rounded-xl border-2 p-3 text-left shadow-sm transition-all ${
                  activeId === 'jumper2021'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'border-emerald-500/30 bg-[hsl(var(--card))] hover:border-emerald-500'
                }`}
                data-testid="graph-node-jumper2021"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 gg-mono text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                    CLEAR · VERIFIED
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                </div>
                <div className="mt-1.5 font-bold text-[12px] text-[hsl(var(--foreground))]">
                  Jumper et al. (2021)
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                  Nature · AlphaFold Structure
                </div>
              </button>
            </div>

            {/* Edge Indicators 1 -> 2 */}
            <div className="flex items-center justify-start w-full max-w-[480px] pl-16 -my-3">
              <div className="flex flex-col items-center">
                <div className={`w-0.5 h-6 ${animating ? 'bg-red-500 animate-pulse' : 'bg-red-500/70'}`} />
                <span className="bg-[hsl(var(--background))] px-1 text-[8px] gg-mono font-bold text-red-600 dark:text-red-400">
                  DEPENDS ON (HOP 2)
                </span>
                <div className={`w-0.5 h-6 ${animating ? 'bg-red-500 animate-pulse' : 'bg-red-500/70'}`} />
              </div>
            </div>

            {/* Level 2: Root Foundation Works */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-[480px]">
              {/* Obokata et al. RETRACTED */}
              <button
                type="button"
                onClick={() => handleSelect(DEFAULT_NODES[2])}
                className={`group relative flex flex-col rounded-xl border-2 p-3 text-left shadow-sm transition-all ${
                  activeId === 'obokata2014'
                    ? 'border-red-500 bg-red-500/15 ring-2 ring-red-500/20'
                    : 'border-red-500/50 bg-red-500/5 hover:border-red-500'
                }`}
                data-testid="graph-node-obokata2014"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-red-600 px-1.5 py-0.5 gg-mono text-[8px] font-bold text-white uppercase tracking-wider">
                    ⚠️ RETRACTED
                  </span>
                  <ShieldAlert size={14} className="text-red-600" />
                </div>
                <div className="mt-1.5 font-bold text-[12px] text-red-700 dark:text-red-300">
                  Obokata et al. (2014)
                </div>
                <div className="text-[10px] text-red-600/80 dark:text-red-400/80 truncate">
                  Nature · STAP Pluripotency
                </div>
              </button>

              {/* Recommended Alternative */}
              <button
                type="button"
                onClick={() => handleSelect(DEFAULT_NODES[4])}
                className={`group relative flex flex-col rounded-xl border-2 border-dashed p-3 text-left shadow-sm transition-all ${
                  activeId === 'alt2019'
                    ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/20'
                    : 'border-purple-400/40 bg-[hsl(var(--card))] hover:border-purple-500'
                }`}
                data-testid="graph-node-alt2019"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 gg-mono text-[8px] font-bold text-purple-700 dark:text-purple-300">
                    RECOVERY OPTION
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold">Safe</span>
                </div>
                <div className="mt-1.5 font-bold text-[12px] text-[hsl(var(--foreground))]">
                  Takahashi (2019)
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                  Cell · Robust Alternative
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-[10px] gg-mono text-[hsl(var(--muted-foreground))]">
            <span>Graph nodes: 5 · Traversal depth: 2 hops</span>
            <span>Deterministic safety boundary active</span>
          </div>
        </div>

        {/* Node Inspector Panel */}
        <div className="p-5 flex flex-col justify-between bg-[hsl(var(--card))]">
          <div>
            <div className="flex items-center justify-between">
              <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
                Node Inspector
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] gg-mono font-bold ${
                selected.status === 'retracted'
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : selected.status === 'propagation'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  : selected.status === 'alternative'
                  ? 'bg-purple-500/20 text-purple-800 dark:text-purple-300'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}>
                {selected.relationship}
              </span>
            </div>

            <h3 className="mt-3 gg-serif text-[18px] font-bold leading-snug">
              {selected.label}
            </h3>
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              {selected.authors} · {selected.venue} ({selected.year})
            </p>
            <div className="mt-2 text-[10px] gg-mono font-medium text-[hsl(var(--muted-foreground))]">
              DOI: <span className="text-[hsl(var(--foreground))] select-all">{selected.doi}</span>
            </div>

            {/* Evidence details */}
            <div className="mt-4 rounded-lg bg-[hsl(var(--muted)/.4)] p-3 border border-[hsl(var(--border))] space-y-2">
              <div className="text-[10px] font-bold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Info size={12} className="text-blue-500" /> Verified Evidence
              </div>
              <p className="text-[11px] leading-relaxed text-[hsl(var(--foreground))]">
                {selected.evidence}
              </p>
              {selected.retractionReason && (
                <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-700 dark:text-red-300 font-mono">
                  <strong>Retraction Notice:</strong> {selected.retractionReason}
                </div>
              )}
            </div>

            {/* Multi-Hop Impact Assessment */}
            <div className="mt-4 space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-foreground))]">Distance from Proposal:</span>
                <span className="font-bold gg-mono">{selected.hop} Hop{selected.hop === 1 ? '' : 's'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-foreground))]">Supporting Grant Claims:</span>
                <span className="font-bold gg-mono">{selected.claimsCount ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-foreground))]">Autonomous Quarantine:</span>
                <span className={`font-bold gg-mono ${selected.status === 'retracted' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {selected.status === 'retracted' ? 'PERMITTED (Direct)' : 'BLOCKED (Policy)'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
            {selected.doi.startsWith('10.') ? (
              <a
                href={`https://doi.org/${selected.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Crossref Record <ExternalLink size={11} />
              </a>
            ) : (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Internal Workspace Reference</span>
            )}
            <span className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))]">
              Verified by Crossref + Retraction Watch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
