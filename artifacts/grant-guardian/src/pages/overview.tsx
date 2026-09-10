import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileWarning, ScanLine, ShieldCheck, Cpu, Database, Network, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import {
  getGetGuardianOverviewQueryKey,
  getListActivityQueryKey,
  getListCitationsQueryKey,
  getListDeadlinesQueryKey,
  useGetGuardianOverview,
  useListActivity,
  useListCitations,
  useListDeadlines,
  useRunGuardianScan,
  type Citation,
  type Deadline,
  type Activity,
} from '@workspace/api-client-react';
import { ActivityRow, CitationRow, DeadlineRow, EmptyBlock, ErrorBlock, LoadingBlock, ScanButton, SectionHeading, StatCard } from '@/components/guardian-ui';

export default function Overview() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const overviewQuery = useGetGuardianOverview();
  const citationsQuery = useListCitations();
  const deadlinesQuery = useListDeadlines();
  const activityQuery = useListActivity();
  const scan = useRunGuardianScan();
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ silent: boolean; summary: string } | null>(null);

  const watchStatusQuery = useQuery({
    queryKey: ['guardian', 'watch', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/guardian/watch/status');
      if (!res.ok) throw new Error('Failed to fetch watch status');
      return res.json() as Promise<{
        enabled: boolean;
        lastSweepAt: string | null;
        nextSweepAt: string | null;
        totalSweeps: number;
        silentSweeps: number;
        citationsChecked: number;
        retractionsCaught: number;
        propagationsEscalated: number;
        draftsAssembled: number;
      }>;
    },
    refetchInterval: 15000,
  });

  const citations = Array.isArray(citationsQuery.data) ? citationsQuery.data : [];
  const deadlines = Array.isArray(deadlinesQuery.data) ? deadlinesQuery.data : [];
  const activity = Array.isArray(activityQuery.data) ? activityQuery.data : [];
  const urgentCitations = useMemo(() => citations.filter((c: Citation) => c.risk !== 'low').slice(0, 4), [citations]);
  const urgentDeadlines = useMemo(() => deadlines.filter((d: Deadline) => d.status !== 'on_track').slice(0, 3), [deadlines]);

  const triggerMorningSweep = async () => {
    setSweepLoading(true);
    setSweepResult(null);
    try {
      const res = await fetch('/api/guardian/watch/sweep', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSweepResult(data);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ['guardian', 'watch', 'status'] }),
        ]);
      }
    } catch {
      //
    } finally {
      setSweepLoading(false);
    }
  };

  const runScan = () => {
    setScanMessage('');
    setScanError('');
    scan.mutate(undefined, {
      onSuccess: (result: { message: string }) => {
        setScanMessage(result.message);
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
      },
      onError: () => setScanError('The scan could not complete. Guardian will keep watching and you can try again.'),
    });
  };
  const retryAll = () => {
    void Promise.all([overviewQuery.refetch(), citationsQuery.refetch(), deadlinesQuery.refetch(), activityQuery.refetch()]);
  };

  return (
    <div className="gg-stagger space-y-7">
      <SectionHeading
        eyebrow="PI Desk Status Board · Active Supervision"
        title="Good morning, Elena."
        description="Guardian is actively monitoring your research workspace. 2 critical items require your judgment before submission."
        action={<ScanButton isPending={scan.isPending} onClick={runScan} />}
      />

      {/* Live Provider System Status Board Banner — Strands as Centerpiece */}
      <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-4 text-[hsl(var(--sidebar-foreground))] shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Cpu size={18} />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div>
              <div className="text-[12px] font-extrabold tracking-tight flex items-center gap-2">
                <span>STRANDS AGENT ORCHESTRATOR ACTIVE</span>
                <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[9px] font-mono text-purple-200">v2.0.0</span>
              </div>
              <div className="gg-mono text-[9px] text-[hsl(var(--sidebar-foreground)/.6)]">
                Autonomous Multi-Hop Graph Traversal · Crossref & Retraction Watch Tools
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sidebar-accent))] px-3 py-1 gg-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
              <Database size={11} /> Crossref: Connected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sidebar-accent))] px-3 py-1 gg-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={11} /> Retraction Watch: Failsafe Ready
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sidebar-accent))] px-3 py-1 gg-mono text-[9px] font-bold text-purple-300 border border-purple-500/30">
              <Network size={11} /> Strands SDK: Active (6 Tools)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sidebar-accent))] px-3 py-1 gg-mono text-[9px] font-bold text-amber-300 border border-amber-500/20">
              <Cpu size={11} /> AWS Bedrock: Policy Fallback
            </span>
          </div>
        </div>

        {/* Strands Centerpiece Architecture Pipeline Flow */}
        <div className="mt-3.5 pt-3 border-t border-[hsl(var(--sidebar-border))] hidden sm:flex items-center justify-between text-[10px] gg-mono text-[hsl(var(--sidebar-foreground)/.75)]">
          <span className="flex items-center gap-1 text-purple-300 font-bold">
            GRANT GUARDIAN
          </span>
          <span>→</span>
          <span className="flex items-center gap-1 text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
            Strands Agent
          </span>
          <span>→</span>
          <span className="text-[hsl(var(--sidebar-foreground))] font-semibold">
            Tools: Crossref · Retraction Watch · Semantic Scholar
          </span>
          <span>→</span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            🛡️ Deterministic Guardrail
          </span>
          <span>→</span>
          <span className="text-amber-300 font-bold">
            [ Quarantine | PI Decision Inbox ]
          </span>
        </div>
      </div>

      {/* Autonomous Watch Mode Bar (Priority 3 & 8) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] px-4 py-3 text-[11px]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <span className="font-extrabold text-[hsl(var(--foreground))]">AUTONOMOUS WATCH MODE: ACTIVE</span>
            <span className="ml-2 text-[hsl(var(--muted-foreground))]">
              {watchStatusQuery.data?.totalSweeps === 0
                ? '· No sweep has run yet (Autonomous sweep scheduled in background).'
                : `· ${watchStatusQuery.data?.totalSweeps ?? 1} sweep(s) completed · ${watchStatusQuery.data?.citationsChecked ?? 0} citations checked · Routine checks run silently.`}
            </span>
          </div>
        </div>
        <button
          onClick={triggerMorningSweep}
          disabled={sweepLoading}
          className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-[10px] font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
          data-testid="button-trigger-sweep"
        >
          <Clock3 size={12} />
          {sweepLoading ? 'Running Sweep...' : 'Simulate Morning Sweep'}
        </button>
      </div>

      {sweepResult && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border p-3.5 text-[11px] ${
            sweepResult.silent
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
          }`}
          data-testid="status-sweep-result"
        >
          <div className="flex items-center gap-2 font-semibold">
            {sweepResult.silent ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
            <span>{sweepResult.summary}</span>
          </div>
          <Link href="/activity" className="gg-mono text-[10px] font-bold underline underline-offset-2 hover:opacity-80">
            View Notifications →
          </Link>
        </div>
      )}

      {/* Human Decision Inbox Banner if pending judgments exist (Priority 4) */}
      {(overviewQuery.data?.pendingJudgments ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-[11px] shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className="text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                HUMAN DECISION INBOX · {overviewQuery.data?.pendingJudgments} Ambiguous Propagation Risk(s)
              </span>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                Guardian does not decide whether retracted premises invalidate your claim. Principal Investigator judgment required.
              </p>
            </div>
          </div>
          <Link
            href="/citations"
            className="rounded-md bg-amber-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-700 shadow-sm shrink-0"
          >
            Open Decision Inbox →
          </Link>
        </div>
      )}

      {scanMessage && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-sm" data-testid="status-scan-result">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <Link href="/activity" className="gg-mono text-[10px] font-bold underline underline-offset-2 hover:opacity-80">
            View Decision Trace Log →
          </Link>
        </div>
      )}

      {scanError && (
        <div className="rounded-xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] px-5 py-3.5 text-[11px] text-[hsl(var(--destructive))]" data-testid="status-scan-error">
          {scanError}
        </div>
      )}

      {overviewQuery.isError || citationsQuery.isError || deadlinesQuery.isError || activityQuery.isError ? (
        <ErrorBlock onRetry={retryAll} />
      ) : overviewQuery.isLoading || citationsQuery.isLoading || deadlinesQuery.isLoading || activityQuery.isLoading ? (
        <LoadingBlock lines={5} />
      ) : (
        <>
          {/* Researcher Executive Status Board Stat Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Guardian summary">
            <StatCard
              label="Citations Watched"
              value={overviewQuery.data?.citationsTracked ?? 0}
              detail="Active reference register"
              icon={ScanLine}
              sparklineData={[3, 4, 4, 5, 5, 6]}
            />
            <StatCard
              label="Retractions Caught"
              value={overviewQuery.data?.issuesFound ?? 0}
              detail="Direct & propagation signals"
              tone={(overviewQuery.data?.issuesFound ?? 0) > 0 ? 'danger' : 'success'}
              icon={FileWarning}
              sparklineData={[0, 0, 1, 1, 2]}
            />
            <StatCard
              label="Compliance Deadlines"
              value={overviewQuery.data?.deadlinesTracked ?? 0}
              detail="IRB renewal & NSF progress"
              icon={Clock3}
              sparklineData={[4, 4, 3, 3, 3]}
            />
            <StatCard
              label="Escalated Judgments"
              value={overviewQuery.data?.pendingJudgments ?? 0}
              detail="Requires researcher claim read"
              tone={(overviewQuery.data?.pendingJudgments ?? 0) > 0 ? 'warning' : 'success'}
              icon={CheckCircle2}
              sparklineData={[0, 1, 1, 1]}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid="section-priority-signals">
              <div className="flex items-start justify-between border-b border-[hsl(var(--border))] px-5 py-4">
                <div>
                  <div className="gg-mono text-[9px] font-bold uppercase tracking-[.17em] text-[hsl(var(--destructive))]">
                    Priority Integrity Signals
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold">Action Required by PI</h2>
                </div>
                <Link href="/citations" className="flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-view-citations">
                  Citation register <ArrowRight size={13} />
                </Link>
              </div>
              {urgentCitations.length ? (
                urgentCitations.map((citation: Citation) => <CitationRow key={citation.id} citation={citation} onSelect={() => setLocation('/citations')} />)
              ) : (
                <EmptyBlock title="No citation signals" detail="Guardian will surface any retractions or 2nd-order risks here." />
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid="section-deadline-pulse">
              <div className="flex items-start justify-between border-b border-[hsl(var(--border))] px-5 py-4">
                <div>
                  <div className="gg-mono text-[9px] font-bold uppercase tracking-[.17em] text-[hsl(25_62%_35%)]">
                    Compliance Runway
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold">Upcoming Milestones</h2>
                </div>
                <Link href="/compliance" className="flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-view-compliance">
                  Open desk <ArrowRight size={13} />
                </Link>
              </div>
              {urgentDeadlines.length ? (
                urgentDeadlines.map((deadline: Deadline) => <DeadlineRow key={deadline.id} deadline={deadline} onDraft={() => setLocation('/compliance')} />)
              ) : (
                <EmptyBlock title="Clear runway" detail="No compliance reports require immediate draft preparation." />
              )}
            </section>
          </div>

          <section className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
            <div className="gg-grid rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] shadow-md" data-testid="card-last-scan">
              <div className="flex items-center justify-between">
                <div className="gg-mono text-[9px] font-bold uppercase tracking-[.17em] text-[hsl(var(--sidebar-foreground)/.5)]">
                  Guardian Agent Policy
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[hsl(var(--sidebar-primary))]">
                  <span className="size-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" /> Active Failsafe
                </span>
              </div>
              <div className="mt-6 gg-serif text-[26px] leading-tight font-extrabold">
                Conservative Agent.<br />
                <em className="text-[hsl(var(--sidebar-primary))]">Escalates, Never Fabricates.</em>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.65)]">
                Direct retraction evidence is quarantined immediately. Second-order propagation risks are escalated because claim impact requires researcher domain judgment.
              </p>
              <div className="mt-6 border-t border-[hsl(var(--sidebar-border))] pt-3 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">
                Last scan completed <span className="float-right font-bold text-[hsl(var(--sidebar-foreground)/.85)]">{overviewQuery.data?.lastScan ?? '—'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm" data-testid="section-recent-activity">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="gg-mono text-[9px] font-bold uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">
                    Autonomous Decision Audit
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold">Recent Agent Activity</h2>
                </div>
                <Link href="/activity" className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-view-activity">
                  Full log →
                </Link>
              </div>
              {activity.length ? (
                activity.slice(0, 3).map((item: Activity) => <ActivityRow key={item.id} item={item} />)
              ) : (
                <EmptyBlock title="No decisions recorded" detail="Guardian's first sweep will appear here." />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}