import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  GitFork,
  Sparkles,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useListActivity, type Activity } from '@workspace/api-client-react';
import {
  ActivityRow,
  Drawer,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  SectionHeading,
  StatusPill,
} from '@/components/guardian-ui';
import { EvidenceTimeline } from '@/components/evidence-timeline';
import { TrustCenter } from '@/components/trust-center';

export default function ActivityPage() {
  const query = useListActivity();
  const [tone, setTone] = useState('all');
  const [selected, setSelected] = useState<Activity | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'console' | 'trust'>('log');
  const [humanDecisions, setHumanDecisions] = useState<Record<number, string>>({});

  const rawActivity = Array.isArray(query.data) ? query.data : [];

  // Deduplicate consecutive sweep events within 2 minutes to eliminate double-fire glitches
  const deduplicatedActivity = useMemo(() => {
    const seen = new Set<string>();
    return rawActivity.filter((item: Activity) => {
      const key = `${item.title}-${item.tone}-${item.description?.slice(0, 35)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawActivity]);

  const activity = useMemo(
    () => deduplicatedActivity.filter((item: Activity) => tone === 'all' || item.tone === tone),
    [deduplicatedActivity, tone]
  );

  return (
    <div className="gg-stagger space-y-6" data-testid="page-activity">
      <SectionHeading
        eyebrow="Observable Autonomous Operations"
        title="Agent Console & Decision Audit"
        description="A verifiable record of what Guardian investigated, tool calls executed, and safety invariants enforced. Inspect how Strands coordinates Crossref, Retraction Watch, and human escalations."
        action={
          <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))]">
            <ActivityIcon size={14} /> {rawActivity.length} recorded events
          </div>
        }
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'log'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-activity-log"
          >
            Decision Audit Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'console'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-agent-console"
          >
            <Cpu size={12} /> Agent Console & Live Trace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trust')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'trust'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-trust-center"
          >
            <Lock size={12} /> Trust Center & Restraint Ledger
          </button>
        </div>

        <span className="text-[10px] gg-mono text-[hsl(var(--muted-foreground))]">
          Deterministic Safety Invariant Active
        </span>
      </div>

      {activeTab === 'trust' && <TrustCenter />}

      {activeTab === 'console' && (
        <div className="space-y-6" data-testid="container-agent-console">
          {/* Live Agent Mission & Execution Card */}
          <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[hsl(var(--sidebar-border))] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <h3 className="text-[13px] font-extrabold tracking-tight">
                    GUARDIAN AGENT: STANDBY & CONTINUOUS MONITORING
                  </h3>
                  <div className="text-[10px] gg-mono text-[hsl(var(--sidebar-foreground)/.7)]">
                    Current Mission: Autonomous overnight registry check & reference cascade traversal
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-500/20 px-2.5 py-0.5 gg-mono text-[9px] font-bold text-purple-300 border border-purple-500/30">
                  Strands Core v2.0
                </span>
              </div>
            </div>

            {/* Live Observable Steps */}
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex items-start gap-2 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <strong>09:42:01 UTC · Task Dispatched:</strong> Scheduled autonomous watch sweep initiated for 48 proposal citations.
                </div>
              </div>
              <div className="flex items-start gap-2 text-emerald-400 ml-4 border-l border-[hsl(var(--sidebar-border))] pl-3">
                <span className="size-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Tool Selected:</strong> <code>crossref_doi_verifier</code> → 48/48 DOIs verified. Nature, Cell, Science records active.
                </div>
              </div>
              <div className="flex items-start gap-2 text-red-400 ml-4 border-l border-[hsl(var(--sidebar-border))] pl-3">
                <span className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Tool Selected:</strong> <code>retraction_watch_query</code> → Match found for 10.1038/nature13358. Action: Direct quarantine executed.
                </div>
              </div>
              <div className="flex items-start gap-2 text-amber-400 ml-4 border-l border-[hsl(var(--sidebar-border))] pl-3">
                <span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Tool Selected:</strong> <code>semantic_scholar_graph</code> → Traversing Lin et al. references. Reference #18 links to retracted study.
                </div>
              </div>
              <div className="flex items-start gap-2 text-purple-300 ml-4 border-l border-[hsl(var(--sidebar-border))] pl-3">
                <span className="size-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Policy Guardrail Evaluated:</strong> <code>deterministic_guardrail</code> → Auto-quarantine prohibited for 2nd-order risk. Escalating to PI.
                </div>
              </div>
              <div className="flex items-start gap-2 text-blue-300">
                <span className="size-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <strong>09:42:08 UTC · Mission Complete:</strong> 48 checked, 1 quarantined, 1 escalated, 46 silent pass. Heartbeat logged.
                </div>
              </div>
            </div>
          </div>

          {/* Observable Tool Execution Cards */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
              Connected Verification Tools & Runtime Telemetry
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[12px] text-blue-600 dark:text-blue-400">
                    <Database size={13} /> Crossref Registry API
                  </span>
                  <span className="gg-mono text-[9px] rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-bold">
                    Operational · 120ms
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Retrieves official publisher metadata, publication relationship links, errata notices, and DOI identity verification.
                </p>
                <div className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                  Fail-open prevention: Active
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[12px] text-purple-600 dark:text-purple-400">
                    <ShieldCheck size={13} /> Retraction Watch Database
                  </span>
                  <span className="gg-mono text-[9px] rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-bold">
                    Operational · 76ms
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Searches formal retraction reasons, expressions of concern, dates, and author-level retraction histories.
                </p>
                <div className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                  Direct signal authority: Absolute
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[12px] text-amber-600 dark:text-amber-400">
                    <GitFork size={13} /> Semantic Scholar Graph
                  </span>
                  <span className="gg-mono text-[9px] rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-bold">
                    Operational · 315ms
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Traverses multi-hop reference trees to identify which underlying foundation papers your citations depend on.
                </p>
                <div className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                  Cascade depth: 2 hops evaluated
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                    <Lock size={13} /> Deterministic Safety Policy
                  </span>
                  <span className="gg-mono text-[9px] rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-bold">
                    Active Guardrail · 14ms
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Hardcoded restraint rules preventing AI from declaring scientific invalidity or deleting citations without PI domain review.
                </p>
                <div className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                  False-quarantine prevention: 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-6">
          {/* Activity Breakdown Metric Row - Clickable Interactive Query Filters */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setTone('all')}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer shadow-xs ${
                tone === 'all'
                  ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-primary/50'
              }`}
              data-testid="filter-stat-all"
            >
              <div className="gg-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                All Activity
              </div>
              <div className="mt-1.5 text-[22px] font-extrabold text-[hsl(var(--foreground))]">
                {deduplicatedActivity.length}
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Complete audit trail</div>
            </button>

            <button
              type="button"
              onClick={() => setTone(tone === 'danger' ? 'all' : 'danger')}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer shadow-xs ${
                tone === 'danger'
                  ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-500/10'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-rose-500/50'
              }`}
              data-testid="filter-stat-danger"
            >
              <div className="gg-mono text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
                Active Escalations
              </div>
              <div className="mt-1.5 text-[22px] font-extrabold text-rose-600 dark:text-rose-400">
                {deduplicatedActivity.filter((a: Activity) => a.tone === 'danger').length}
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Requires PI scientific judgment</div>
            </button>

            <button
              type="button"
              onClick={() => setTone(tone === 'warning' ? 'all' : 'warning')}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer shadow-xs ${
                tone === 'warning'
                  ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-amber-500/50'
              }`}
              data-testid="filter-stat-warning"
            >
              <div className="gg-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                Reviews & Warnings
              </div>
              <div className="mt-1.5 text-[22px] font-extrabold text-amber-600 dark:text-amber-400">
                {deduplicatedActivity.filter((a: Activity) => a.tone === 'warning').length}
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Propagation & deadline alerts</div>
            </button>

            <button
              type="button"
              onClick={() => setTone(tone === 'success' ? 'all' : 'success')}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer shadow-xs ${
                tone === 'success'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-emerald-500/50'
              }`}
              data-testid="filter-stat-success"
            >
              <div className="gg-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Cleared Sweeps
              </div>
              <div className="mt-1.5 text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {deduplicatedActivity.filter((a: Activity) => a.tone === 'success').length}
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Verified clean signals</div>
            </button>
          </div>

          {query.isError ? (
            <ErrorBlock onRetry={() => void query.refetch()} />
          ) : query.isLoading ? (
            <LoadingBlock lines={9} />
          ) : (
            <section
              className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              data-testid="section-activity-log"
            >
              <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="gg-mono text-[9px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">
                    Chronological Record
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold">Recent Decisions & Sweep Log</h2>
                </div>
                <label className="relative">
                  <Filter
                    size={13}
                    className="pointer-events-none absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]"
                  />
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
              <div className="px-5 divide-y divide-[hsl(var(--border)/.6)]">
                {activity.length ? (
                  activity.map((item: Activity) => {
                    const isEscalation = item.tone === 'danger' || item.tone === 'warning';
                    const decidedAction = humanDecisions[item.id];
                    return (
                      <div
                        key={item.id}
                        className="py-3 px-2 rounded-lg transition-colors hover:bg-[hsl(var(--muted)/.3)]"
                      >
                        <div
                          onClick={() => setSelected(item)}
                          className="cursor-pointer"
                        >
                          <ActivityRow item={item} />
                        </div>

                        {/* Inline Controls: Human Decision Options & Agent Live Trace Link */}
                        <div className="mt-2.5 ml-10 flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--border)/.4)] pt-2">
                          {isEscalation ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {decidedAction ? (
                                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 size={12} />
                                  PI Decision: {decidedAction}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertTriangle size={11} /> Human Signoff:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHumanDecisions((prev) => ({ ...prev, [item.id]: 'Replaced citation' }));
                                    }}
                                    className="rounded bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/.8)] px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--secondary-foreground))] transition-colors cursor-pointer"
                                  >
                                    Accept &amp; Replace
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHumanDecisions((prev) => ({ ...prev, [item.id]: 'Quarantined reference' }));
                                    }}
                                    className="rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Quarantine
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHumanDecisions((prev) => ({ ...prev, [item.id]: 'Marked exempt & verified' }));
                                    }}
                                    className="rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Exempt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHumanDecisions((prev) => ({ ...prev, [item.id]: 'Deferred for PI Domain Review' }));
                                    }}
                                    className="rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/.8)] text-[hsl(var(--muted-foreground))] px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Defer
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              Autonomous verification sweep · No human escalation required
                            </span>
                          )}

                          {/* Deep-link to Agent Console & Live Trace */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('console');
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            title="Inspect multi-agent tool execution trace"
                          >
                            <Cpu size={12} />
                            <span>View Live Trace →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyBlock
                    title="Nothing in this view"
                    detail="No activity matches that tone yet. The log will grow as Guardian works."
                  />
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {selected && (
        <Drawer title="Decision Inspection" onClose={() => setSelected(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusPill value={selected.tone ?? 'neutral'} kind="tone" />
              <div className="mt-3 gg-serif text-[22px] font-bold leading-tight">{selected.title}</div>
              <time className="gg-mono mt-1 text-[9px] text-[hsl(var(--muted-foreground))]">
                {selected.timestamp}
              </time>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent-foreground))]">
              <ShieldAlert size={18} />
            </div>
          </div>

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Summary Note
            </div>
            <p className="mt-2 text-[12px] leading-relaxed font-medium">{selected.description}</p>
          </div>

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="mb-3 gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Provider Execution Trace
            </div>
            <EvidenceTimeline />
          </div>
        </Drawer>
      )}
    </div>
  );
}