import { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, GitFork, HelpCircle, Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export interface AffectedItem {
  id: string;
  name: string;
  type: 'grant' | 'paper' | 'claim';
  status: 'review_required' | 'independent' | 'unaffected';
  detail: string;
  rationale: string;
}

export function BlastRadius() {
  const { user } = useAuth();
  const [showCounterfactual, setShowCounterfactual] = useState(false);

  const affectedItems: AffectedItem[] = [
    {
      id: 'prop-nsf',
      name: `${user.proposalName} (Section 3.2)`,
      type: 'grant',
      status: 'review_required',
      detail: 'Direct citation of Lin et al. (2015)',
      rationale: 'Hypothesis in Aim 2 relies on protocol cited from intermediate reference. Human scientific read required.',
    },
    {
      id: 'paper-x',
      name: 'Martinez et al., Biomaterials 2018',
      type: 'paper',
      status: 'review_required',
      detail: 'Intermediate citation in lab reference register',
      rationale: 'Replicates cell viability metrics derived from original stimulus-triggered findings.',
    },
    {
      id: 'paper-y',
      name: 'Chen & Vance, J. Cell Biol 2020',
      type: 'paper',
      status: 'independent',
      detail: 'Methodologically independent lineage',
      rationale: 'Uses independent mechanical stiffness assay; pluripotency mechanism is tangential.',
    },
    {
      id: 'paper-z',
      name: 'AlphaFold Benchmark (Jumper 2021)',
      type: 'paper',
      status: 'unaffected',
      detail: 'Unrelated computational structural biology',
      rationale: 'Completely orthogonal dataset and computational methodology.',
    },
  ];

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-5" data-testid="container-blast-radius">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-red-500/20 text-red-700 dark:text-red-300">
              <ShieldAlert size={14} />
            </span>
            <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
              Research Impact Radius (Retraction Ripple)
            </h3>
            <span className="rounded bg-red-500/15 px-2 py-0.5 text-[9px] gg-mono font-extrabold text-red-700 dark:text-red-300">
              Root: Obokata et al. (Nature 2014)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
            Mapping downstream consequences across your proposal and the monitored scientific literature.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCounterfactual(!showCounterfactual)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            showCounterfactual
              ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300'
              : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
          data-testid="button-toggle-counterfactual"
        >
          <Layers size={13} />
          {showCounterfactual ? 'Hide Counterfactual' : 'Counterfactual: What If?'}
        </button>
      </div>

      {/* Ripple Stats Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
          <div className="gg-mono text-[20px] font-extrabold text-red-600 dark:text-red-400">1</div>
          <div className="text-[10px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
            Root Retraction
          </div>
          <div className="text-[9px] text-[hsl(var(--muted-foreground))]">Obokata 2014</div>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <div className="gg-mono text-[20px] font-extrabold text-amber-600 dark:text-amber-400">3</div>
          <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            Direct Citations
          </div>
          <div className="text-[9px] text-[hsl(var(--muted-foreground))]">Immediate downstream</div>
        </div>

        <div className="rounded-lg bg-[hsl(var(--muted)/.6)] border border-[hsl(var(--border))] p-3 text-center">
          <div className="gg-mono text-[20px] font-extrabold text-[hsl(var(--foreground))]">7</div>
          <div className="text-[10px] font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
            Downstream Papers
          </div>
          <div className="text-[9px] text-[hsl(var(--muted-foreground))]">2nd-order ripple</div>
        </div>

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <div className="gg-mono text-[20px] font-extrabold text-blue-600 dark:text-blue-400">1</div>
          <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
            Grant Proposal
          </div>
          <div className="text-[9px] text-[hsl(var(--muted-foreground))]">Awaiting PI Review</div>
        </div>
      </div>

      {/* Counterfactual Scenario Simulation */}
      {showCounterfactual && (
        <div className="rounded-xl border border-purple-500/40 bg-purple-500/5 p-4 space-y-3" data-testid="box-counterfactual">
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-500/20 px-2 py-0.5 gg-mono text-[9px] font-extrabold text-purple-700 dark:text-purple-300">
              COUNTERFACTUAL INVESTIGATION
            </span>
            <span className="text-[12px] font-bold text-[hsl(var(--foreground))]">
              "What if Obokata et al. & Lin et al. are removed from proposal?"
            </span>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Guardian simulated removing the retracted dependency chain without making scientific truth declarations:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-[11px]">
            <div className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-3">
              <span className="font-bold text-amber-600 dark:text-amber-400">1 Grant Claim Affected</span>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                Claim #2 ("Low-pH stimulus activation") loses primary cited protocol.
              </p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-3">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">2 Citations Remain Safe</span>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                Jumper et al. (2021) and Chen et al. (2020) retain 100% evidentiary integrity.
              </p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-3">
              <span className="font-bold text-purple-600 dark:text-purple-400">1 Recovery Alternative Found</span>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                Takahashi & Yamanaka (2019) replaces pluripotency premise with zero retraction signals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Downstream Affected Breakdown */}
      <div className="space-y-2">
        <div className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
          Potentially Affected Research Artifacts
        </div>
        <div className="space-y-2">
          {affectedItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[hsl(var(--foreground))]">{item.name}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">· {item.detail}</span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-snug">
                  {item.rationale}
                </p>
              </div>

              <div className="shrink-0">
                {item.status === 'review_required' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                    <AlertTriangle size={10} /> ⚠️ Review Required
                  </span>
                ) : item.status === 'independent' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300">
                    <CheckCircle2 size={10} /> ✓ Independent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={10} /> ✓ Unaffected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
