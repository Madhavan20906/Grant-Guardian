import { useMemo, useState } from 'react';
import { Activity as ActivityIcon, Filter, ShieldAlert } from 'lucide-react';
import { useListActivity, type Activity } from '@workspace/api-client-react';
import { ActivityRow, Drawer, EmptyBlock, ErrorBlock, LoadingBlock, SectionHeading, StatusPill } from '@/components/guardian-ui';
import { EvidenceTimeline } from '@/components/evidence-timeline';

export default function ActivityPage() {
  const query = useListActivity();
  const [tone, setTone] = useState('all');
  const [selected, setSelected] = useState<Activity | null>(null);
  const activity = useMemo(() => (query.data ?? []).filter((item: Activity) => tone === 'all' || item.tone === tone), [query.data, tone]);

  return (
    <div className="gg-stagger">
      <SectionHeading
        eyebrow="Audit trail"
        title="Decision log"
        description="A complete, human-readable record of what Guardian saw, decided, and left for you. Click any event to inspect its provider trace sequence."
        action={
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))]">
            <ActivityIcon size={14} /> {query.data?.length ?? 0} recorded events
          </div>
        }
      />
      {query.isError ? (
        <ErrorBlock onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <LoadingBlock lines={9} />
      ) : (
        <section className="max-w-[920px] overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid="section-activity-log">
          <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="gg-mono text-[9px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">
                Chronological record
              </div>
              <h2 className="mt-1 text-[15px] font-bold">Recent decisions</h2>
            </div>
            <label className="relative">
              <Filter size={13} className="pointer-events-none absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-8 appearance-none rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-8 pr-7 text-[10px] outline-none"
                data-testid="select-activity-tone"
              >
                <option value="all">All activity</option>
                <option value="danger">Escalations</option>
                <option value="warning">Needs review</option>
                <option value="success">Cleared</option>
                <option value="neutral">Routine</option>
              </select>
            </label>
          </div>
          <div className="px-5">
            {activity.length ? (
              activity.map((item: Activity) => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="cursor-pointer transition-colors hover:bg-[hsl(var(--muted)/.4)] rounded-lg px-2"
                >
                  <ActivityRow item={item} />
                </div>
              ))
            ) : (
              <EmptyBlock title="Nothing in this view" detail="No activity matches that tone yet. The log will grow as Guardian works." />
            )}
          </div>
        </section>
      )}

      {selected && (
        <Drawer title="Decision Inspection" onClose={() => setSelected(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusPill value={selected.tone ?? 'neutral'} kind="tone" />
              <div className="mt-3 gg-serif text-[22px] font-bold leading-tight">{selected.title}</div>
              <time className="gg-mono mt-1 text-[9px] text-[hsl(var(--muted-foreground))]">{selected.timestamp}</time>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent-foreground))]">
              <ShieldAlert size={18} />
            </div>
          </div>

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Summary Note</div>
            <p className="mt-2 text-[12px] leading-relaxed font-medium">{selected.description}</p>
          </div>

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="mb-3 gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Provider Execution Trace</div>
            <EvidenceTimeline />
          </div>
        </Drawer>
      )}
    </div>
  );
}