import { useState } from 'react';
import { FileText, Sparkles, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListActivityQueryKey, getListDeadlinesQueryKey, useDraftComplianceReport, useListDeadlines, type Deadline } from '@workspace/api-client-react';
import { Button, DeadlineRow, Drawer, EmptyBlock, ErrorBlock, LoadingBlock, SectionHeading, StatusPill } from '@/components/guardian-ui';

export default function Compliance() {
  const queryClient = useQueryClient();
  const query = useListDeadlines();
  const draftMutation = useDraftComplianceReport();
  const [draft, setDraft] = useState<{ id: number; deadlineId: number; title: string; status: string; body: string } | null>(null);
  const [draftError, setDraftError] = useState('');
  const deadlines = Array.isArray(query.data) ? query.data : [];
  const attention = deadlines.filter((deadline: Deadline) => deadline.status === 'attention').length;
  const draftReport = (id: number) => {
    setDraftError('');
    draftMutation.mutate({ id }, {
      onSuccess: (result: { id: number; deadlineId: number; title: string; status: string; body: string }) => {
        setDraft(result);
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
      },
      onError: () => setDraftError('The report could not be drafted. Try again in a moment.'),
    });
  };
  return (
    <div className="gg-stagger">
      <SectionHeading
        eyebrow="Compliance desk"
        title="Keep the paperwork moving."
        description="Guardian tracks the dates that can quietly derail a grant. When a deadline needs shape, it can make the first draft for you."
        action={
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))]">
            <span className="size-2 rounded-full bg-[hsl(var(--accent-foreground))]" />
            {attention ? `${attention} deadline${attention === 1 ? '' : 's'} need attention` : 'All deadlines on track'}
          </div>
        }
      />

      {/* Compliance Metrics Overview - Reconciled 4-Card Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xs">
          <div className="gg-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Total Tracked
          </div>
          <div className="mt-2 text-[24px] font-extrabold">{deadlines.length}</div>
          <div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Active grant deadlines</div>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs">
          <div className="gg-mono text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
            Needs Attention
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-rose-600 dark:text-rose-400">
            {deadlines.filter((d: Deadline) => d.status === 'attention').length}
          </div>
          <div className="mt-1 text-[10px] text-rose-700/80 dark:text-rose-300/80">&lt;14d runway &amp; &lt;80% prep</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
          <div className="gg-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
            Due Soon
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-amber-600 dark:text-amber-400">
            {deadlines.filter((d: Deadline) => d.status === 'due_soon').length}
          </div>
          <div className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-300/80">11–21 days preparation window</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <div className="gg-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            On Track / Clear
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {deadlines.filter((d: Deadline) => d.status === 'on_track' || (d.status as string) === 'submitted').length}
          </div>
          <div className="mt-1 text-[10px] text-emerald-700/80 dark:text-emerald-300/80">Adequate milestone runway</div>
        </div>
      </div>

      {draftError && (
        <div
          className="mb-5 flex items-center justify-between rounded-lg border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] px-4 py-3 text-[11px] text-[hsl(var(--destructive))]"
          data-testid="status-draft-error"
        >
          {draftError}
          <button
            type="button"
            onClick={() => setDraftError('')}
            aria-label="Dismiss error"
            data-testid="button-dismiss-draft-error"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isError ? (
        <ErrorBlock onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <LoadingBlock lines={7} />
      ) : deadlines.length === 0 ? (
        <EmptyBlock
          title="No deadlines in view"
          detail="When compliance dates are connected, Guardian will keep their distance and timeline here."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <section
            className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            data-testid="section-deadline-register"
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
              <div>
                <div className="gg-mono text-[9px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">
                  Active register
                </div>
                <h2 className="mt-1 text-[15px] font-bold">{deadlines.length} tracked dates</h2>
              </div>
              <div className="gg-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">
                Sorted by urgency
              </div>
            </div>
            {deadlines
              .slice()
              .sort((a: Deadline, b: Deadline) => a.daysLeft - b.daysLeft)
              .map((deadline: Deadline) => (
                <DeadlineRow
                  key={deadline.id}
                  deadline={deadline}
                  onDraft={() => draftReport(deadline.id)}
                />
              ))}
          </section>
          <aside
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"
            data-testid="card-compliance-note"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              <FileText size={17} />
            </div>
            <div className="mt-6 gg-serif text-[26px] leading-[1.02]">
              A good first draft
              <br />
              <em>buys back a day.</em>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[hsl(var(--primary-foreground)/.58)]">
              Select “Draft report” on an upcoming deadline. Guardian will use the deadline context to prepare a
              reviewable starting point — never a submission.
            </p>
            <div className="mt-8 border-t border-[hsl(var(--primary-foreground)/.15)] pt-4 text-[10px] text-[hsl(var(--primary-foreground)/.54)]">
              <div className="flex justify-between">
                <span>Drafts remain private</span>
                <StatusPill value="clear" />
              </div>
            </div>
          </aside>
        </div>
      )}
      {draftMutation.isPending && (
        <div
          className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-[11px] font-bold shadow-lg"
          data-testid="status-drafting"
        >
          <Sparkles size={15} className="text-[hsl(var(--accent-foreground))]" />
          Assembling a reviewable draft…
        </div>
      )}
      {draft && (
        <Drawer title="Compliance draft · private" onClose={() => setDraft(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusPill value={draft.status} />
              <h2 className="mt-4 gg-serif text-[26px] leading-[1.05]">{draft.title}</h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.25)] text-[hsl(var(--accent-foreground))]">
              <FileText size={19} />
            </div>
          </div>

          {/* Deterministic Context Inputs Feeding the AI Drafter */}
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                Deterministic Context Inputs Feeding Strands Drafter
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800 dark:text-amber-200">
                Constitutional Article IV Enforced
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Target Deadline ID:</span>
                <strong className="font-mono">#{draft.deadlineId}</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Preparation Readiness:</span>
                <strong className="font-mono text-amber-600">Audit artifacts collected</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Safe Policy:</span>
                <strong className="text-emerald-600">Zero Autonomous Submissions</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">PI Authority:</span>
                <strong className="text-purple-600">Manual Signoff Required</strong>
              </div>
            </div>
          </div>

          <div
            className="mt-6 whitespace-pre-wrap border-t border-[hsl(var(--border))] pt-6 text-[12px] leading-[1.7]"
            data-testid="text-draft-body"
          >
            {draft.body}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Review before sharing externally. Guardian never auto-submits.
            </span>
            <Button variant="secondary" onClick={() => setDraft(null)} testId="button-close-draft">
              Done
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}