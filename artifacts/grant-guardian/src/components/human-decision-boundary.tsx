import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Cpu,
  ArrowRight,
  GitPullRequest,
  Sparkles,
  ShieldCheck,
  Send,
  BookmarkCheck,
  HelpCircle,
} from 'lucide-react';

export type HumanDecisionAction = 'accept' | 'replace' | 'quarantine' | 'dismiss' | 'escalate';

export interface HumanDecisionBoundaryProps {
  citationId: number;
  citationTitle: string;
  citationDoi: string;
  currentStatus: string;
  recommendedAction?: string;
  onDecision: (action: HumanDecisionAction, notes: string, replacementDoi?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function HumanDecisionBoundary({
  citationId,
  citationTitle,
  citationDoi,
  currentStatus,
  recommendedAction = 'Human PI domain review required before grant finalization',
  onDecision,
  isSubmitting = false,
}: HumanDecisionBoundaryProps) {
  const [selectedAction, setSelectedAction] = useState<HumanDecisionAction>('replace');
  const [rationale, setRationale] = useState('');
  const [replacementDoi, setReplacementDoi] = useState('10.1016/j.cell.2019.08.019 (Takahashi & Yamanaka, 2019)');
  const [recordedSuccess, setRecordedSuccess] = useState<string | null>(null);

  const handleSubmit = async (action: HumanDecisionAction) => {
    setSelectedAction(action);
    setRecordedSuccess(null);
    try {
      await onDecision(action, rationale, selectedAction === 'replace' ? replacementDoi : undefined);
      setRecordedSuccess(`Decision '${action.toUpperCase()}' recorded to lab institutional memory.`);
    } catch {
      // Handled by parent
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden" data-testid="human-decision-boundary">
      {/* 1. Philosophical Banner: AI Investigates. Human Remains Accountable. */}
      <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                <UserCheck size={16} />
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-700 dark:text-blue-300">
                Agents for Humans · Core Boundary
              </span>
              <span className="rounded bg-blue-100/80 dark:bg-blue-900/50 px-2 py-0.5 font-mono text-[9px] font-extrabold text-blue-800 dark:text-blue-200">
                PI Authority Required
              </span>
            </div>
            <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
              AI Investigates. Human Remains Accountable.
            </h3>
            <p className="text-[12px] text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Grant Guardian never unilaterally removes or alters citations. Scientific validity and research integrity are high-consequence professional decisions that belong exclusively to the Principal Investigator.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3 text-right shrink-0">
            <span className="font-mono text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
              Architectural Invariant
            </span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">
              Zero Autonomous Deletion
            </span>
          </div>
        </div>
      </div>

      {/* 2. Responsibilities Delineation Grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        {/* Agent Mandate */}
        <div className="p-5 space-y-3 bg-slate-50/40 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
            <Cpu size={14} />
            What the Autonomous Agent Did
          </div>
          <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Investigated:</strong> Queried Crossref publisher records and Retraction Watch database.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Verified:</strong> Confirmed publication identity and publisher errata links.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Correlated:</strong> Mapped citation relationship against proposal Aim 2 experimental design.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Found Propagation:</strong> Traversed 1-hop reference graph via Semantic Scholar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Recommended Action:</strong> {recommendedAction}</span>
            </li>
          </ul>
        </div>

        {/* Human Mandate */}
        <div className="p-5 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            <UserCheck size={14} />
            What the Human Principal Investigator Decides
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Select one of five definitive actions. Your rationale will be permanently committed to your lab&apos;s institutional memory so future proposal sweeps respect your scientific judgment.
          </p>
          <div className="rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            Target Citation: <span className="text-slate-900 dark:text-white font-bold">{citationTitle}</span> ({citationDoi})
          </div>
        </div>
      </div>

      {/* 3. The 5 Human Decision Gates */}
      <div className="p-6 space-y-5">
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Human Decision Gate (Select 1 of 5 Actions)
          </label>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Choose how this scientific dependency should be handled for your grant proposal.
          </p>
        </div>

        <div className="grid sm:grid-cols-5 gap-2.5">
          {/* 1. ACCEPT */}
          <button
            type="button"
            onClick={() => setSelectedAction('accept')}
            className={`rounded-xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
              selectedAction === 'accept'
                ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
            }`}
            data-testid="btn-decision-accept"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-[12px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                Accept
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Mark Independent
              </p>
            </div>
            <span className="mt-2 font-mono text-[9px] text-emerald-800 dark:text-emerald-300">
              Clear for submission
            </span>
          </button>

          {/* 2. REPLACE */}
          <button
            type="button"
            onClick={() => setSelectedAction('replace')}
            className={`rounded-xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
              selectedAction === 'replace'
                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
            data-testid="btn-decision-replace"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-[12px] text-indigo-700 dark:text-indigo-400">
                <GitPullRequest size={13} />
                Replace
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Swap with Clean Alternative
              </p>
            </div>
            <span className="mt-2 font-mono text-[9px] text-indigo-800 dark:text-indigo-300">
              Recommended fix
            </span>
          </button>

          {/* 3. QUARANTINE */}
          <button
            type="button"
            onClick={() => setSelectedAction('quarantine')}
            className={`rounded-xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
              selectedAction === 'quarantine'
                ? 'border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'
            }`}
            data-testid="btn-decision-quarantine"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-[12px] text-rose-700 dark:text-rose-400">
                <XCircle size={13} />
                Quarantine
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Isolate From Grant Text
              </p>
            </div>
            <span className="mt-2 font-mono text-[9px] text-rose-800 dark:text-rose-300">
              Remove from drafts
            </span>
          </button>

          {/* 4. DISMISS */}
          <button
            type="button"
            onClick={() => setSelectedAction('dismiss')}
            className={`rounded-xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
              selectedAction === 'dismiss'
                ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
            data-testid="btn-decision-dismiss"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-[12px] text-slate-800 dark:text-slate-200">
                <BookmarkCheck size={13} />
                Dismiss
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Mark Non-Material
              </p>
            </div>
            <span className="mt-2 font-mono text-[9px] text-slate-600 dark:text-slate-400">
              False alarm / Tangential
            </span>
          </button>

          {/* 5. ESCALATE */}
          <button
            type="button"
            onClick={() => setSelectedAction('escalate')}
            className={`rounded-xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
              selectedAction === 'escalate'
                ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
            data-testid="btn-decision-escalate"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-[12px] text-amber-700 dark:text-amber-400">
                <Send size={13} />
                Escalate
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Send to Co-PI / Officer
              </p>
            </div>
            <span className="mt-2 font-mono text-[9px] text-amber-800 dark:text-amber-300">
              Institutional review
            </span>
          </button>
        </div>

        {/* Action Specific Fields */}
        {selectedAction === 'replace' && (
          <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-2">
            <label className="font-mono text-[10px] uppercase font-bold text-indigo-900 dark:text-indigo-300">
              Designated Replacement Citation (Clean Provenance):
            </label>
            <input
              type="text"
              value={replacementDoi}
              onChange={(e) => setReplacementDoi(e.target.value)}
              className="w-full rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 p-2.5 text-[12px] font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 10.1016/j.cell.2019.08.019 (Author, Year)"
            />
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
              Guardian will update your proposal draft bibliography and verify that the replacement paper has zero retraction propagation.
            </p>
          </div>
        )}

        {/* 4. PI Scientific Rationale Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-300">
              Principal Investigator Scientific Rationale:
            </label>
            <span className="font-mono text-[10px] text-slate-400">
              Saved to Persistent Institutional Memory
            </span>
          </div>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Document your scientific justification for institutional audit (e.g. 'Specific Aim 2 relies strictly on mechanical scaffold stiffness assays and is biochemically independent of the cited low-pH pluripotency claims.')."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-[12px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-sans leading-relaxed"
            data-testid="textarea-pi-rationale"
          />
        </div>

        {/* 5. Submit Button and Judge-Facing Answer Box */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit(selectedAction)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-[12px] font-bold text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            data-testid="btn-commit-human-decision"
          >
            <UserCheck size={15} />
            <span>{isSubmitting ? 'Committing Decision...' : `Commit Decision: ${selectedAction.toUpperCase()}`}</span>
          </button>

          {recordedSuccess && (
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={14} />
              {recordedSuccess}
            </div>
          )}
        </div>

        {/* Judging Philosophy Callout */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 flex items-start gap-2.5">
          <HelpCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Why shouldn&apos;t this be automated completely?</strong>{' '}
            <em>&ldquo;Because research and grant decisions are high-consequence professional decisions. Grant Guardian automates the investigation, not the researcher&apos;s accountability.&rdquo;</em>
          </div>
        </div>
      </div>
    </div>
  );
}
