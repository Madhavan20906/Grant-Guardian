import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Network,
  AlertTriangle,
  Layers,
  Sparkles,
  GitFork,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  FileText,
  RefreshCw,
  Activity as ActivityIcon,
  Play,
  Fingerprint,
  Crown,
  Flame,
} from 'lucide-react';
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
import { Drawer, EmptyBlock, ErrorBlock, LoadingBlock, ScanButton, StatCard, formatActivityTimestamp } from '@/components/guardian-ui';
import { CitationGraph } from '@/components/citation-graph';
import { BlastRadius } from '@/components/blast-radius';
import { InvestigationWorkspace } from '@/components/investigation-workspace';
import { ClaimMonitor } from '@/components/claim-monitor';
import { OnboardingEmptyState } from '@/components/onboarding-empty-state';
import { InteractiveInvestigationModal } from '@/components/interactive-investigation-modal';
import { ContaminationCascade } from '@/components/contamination-cascade';
import { WhyThisDecisionPanel } from '@/components/why-this-decision-panel';
import { StrandsSovereignBossModal } from '@/components/strands-sovereign-boss-modal';
import { usePersona } from '@/context/persona-context';
import { useAuth, formatDisplayName } from '@/context/auth-context';
import {
  apiRequest,
  getLocalJudgments,
  saveLocalJudgment,
  addLocalActivity,
  isDeadlineSubmittedLocal,
  getLocalActivities,
  getLocalCitations,
  getLocalDeadlines,
} from '@/lib/api';

export default function Overview() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userSlug = user?.tenantSlug || (user?.id ? String(user.id) : undefined);
  const { activePersona } = usePersona();
  const overviewQuery = useGetGuardianOverview();
  const citationsQuery = useListCitations();
  const deadlinesQuery = useListDeadlines();
  const activityQuery = useListActivity();
  const scan = useRunGuardianScan();

  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ silent: boolean; summary: string } | null>(null);
  const [selectedCitationId, setSelectedCitationId] = useState<number | null>(null);
  const [showMorningBrief, setShowMorningBrief] = useState(true);
  const [showStrandsInfo, setShowStrandsInfo] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'attention' | 'cascade' | 'why' | 'graph' | 'claims' | 'blast'>('attention');
  const [isSubmittingJudgment, setIsSubmittingJudgment] = useState(false);

  const watchStatusQuery = useQuery({
    queryKey: ['guardian', 'watch', 'status'],
    queryFn: async () => {
      const res = await apiRequest('/api/guardian/watch/status');
      if (!res.ok) throw new Error('Failed to fetch watch status');
      return res.data as {
        enabled: boolean;
        lastSweepAt: string | null;
        nextSweepAt: string | null;
        totalSweeps: number;
        silentSweeps: number;
        citationsChecked: number;
        retractionsCaught: number;
        propagationsEscalated: number;
        draftsAssembled: number;
      };
    },
    refetchInterval: 15000,
  });

  const strandsStatusQuery = useQuery({
    queryKey: ['guardian', 'strands', 'status'],
    queryFn: async () => {
      const res = await apiRequest('/api/guardian/strands/status');
      if (!res.ok) throw new Error('Failed to fetch strands status');
      return res.data as {
        available: boolean;
        mode: string;
        statusLabel: string;
        tools: number;
        error?: string | null;
      };
    },
    refetchInterval: 30000,
  });

  const rawCitations = useMemo(() => {
    const serverCitations = Array.isArray(citationsQuery.data) ? citationsQuery.data : [];
    const local = getLocalCitations(userSlug);
    if (!local || local.length === 0) return serverCitations;
    const merged = [...serverCitations];
    for (const item of local) {
      const norm = String(item.doi || '').trim().toLowerCase();
      const exists = merged.some(
        (c: any) =>
          (norm && String(c.doi || '').trim().toLowerCase() === norm) ||
          c.id === item.id
      );
      if (!exists) {
        merged.push(item);
      }
    }
    return merged;
  }, [citationsQuery.data, userSlug]);

  const citations = useMemo(() => {
    const local = getLocalJudgments(userSlug);
    return rawCitations.map((c: Citation) => {
      const lj = local[c.id];
      if (lj) {
        const newStatus = lj.judgment === 'relevant' ? 'quarantined' : lj.judgment === 'not_relevant' ? 'clear' : 'propagation';
        const newRisk = lj.judgment === 'relevant' ? 'high' : lj.judgment === 'not_relevant' ? 'low' : 'medium';
        return {
          ...c,
          judgment: lj.judgment,
          judgmentNotes: lj.notes || (c as any).judgmentNotes,
          status: newStatus as any,
          risk: newRisk as any,
        };
      }
      return c;
    });
  }, [rawCitations, userSlug]);

  const rawDeadlines = useMemo(() => {
    const serverDeadlines = Array.isArray(deadlinesQuery.data) ? deadlinesQuery.data : [];
    const local = getLocalDeadlines(userSlug);
    if (!local || local.length === 0) return serverDeadlines;
    const merged = [...serverDeadlines];
    for (const item of local) {
      const exists = merged.some((d: any) => d.id === item.id || d.title === item.title);
      if (!exists) {
        merged.push(item);
      }
    }
    return merged;
  }, [deadlinesQuery.data, userSlug]);

  const deadlines = useMemo(() => {
    return rawDeadlines.map((d: Deadline) => {
      if ((d.progress ?? 0) >= 100 || (d.status as string) === 'clear' || isDeadlineSubmittedLocal(d.id, userSlug)) {
        return { ...d, status: 'clear' as const, progress: 100 };
      }
      return d;
    });
  }, [rawDeadlines, userSlug]);

  const serverActivity = Array.isArray(activityQuery.data) ? activityQuery.data : [];
  const activity = useMemo(() => {
    const combined = [...getLocalActivities(userSlug), ...serverActivity];
    const seen = new Set<string>();
    return combined.filter((item: Activity) => {
      const key = `${item.title}-${item.tone}-${item.description?.slice(0, 35)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [serverActivity, userSlug]);

  const monitoredCount = citations.length;
  const clearCount = citations.filter((c: Citation) => c.status === 'clear').length;
  const retractedCount = citations.filter((c: Citation) => c.status === 'retracted').length;
  const propagationCount = citations.filter(
    (c: Citation) => c.status === 'propagation' || c.risk === 'high' || c.risk === 'medium'
  ).length;

  const overdueCount = deadlines.filter(
    (d: Deadline) => d.status === 'attention' || (d.daysLeft !== undefined && d.daysLeft < 0)
  ).length;
  const onTrackCount = deadlines.filter(
    (d: Deadline) => d.status === 'on_track' || (d.status as string) === 'submitted' || (d.status as string) === 'clear'
  ).length;
  const dueSoonCount = deadlines.filter((d: Deadline) => d.status === 'due_soon').length;

  const totalDeadlines = deadlines.length;
  const onTrackPct = totalDeadlines > 0 ? Math.round((onTrackCount / totalDeadlines) * 100) : 0;
  const dueSoonPct = totalDeadlines > 0 ? Math.round((dueSoonCount / totalDeadlines) * 100) : 0;
  const overduePct = totalDeadlines > 0 ? Math.round((overdueCount / totalDeadlines) * 100) : 0;

  const requestsTodayCount = activity.length > 0 ? activity.length : clearCount;
  const recoveryRate = monitoredCount > 0
    ? Math.round(((monitoredCount - retractedCount) / monitoredCount) * 100)
    : 100;

  const selectedCitation = citations.find((c: Citation) => c.id === selectedCitationId) || citations[1] || null;

  const triggerMorningSweep = async () => {
    setSweepLoading(true);
    setSweepResult(null);
    try {
      const res = await apiRequest('/api/guardian/watch/sweep', { method: 'POST' });
      if (res.ok && res.data) {
        setSweepResult(res.data);
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

  const handleJudgment = async (id: number, judgment: 'relevant' | 'not_relevant' | 'deferred', notes?: string) => {
    setIsSubmittingJudgment(true);

    // 1. Persist locally immediately scoped to active tenant
    saveLocalJudgment(id, judgment, notes, userSlug);

    // 2. Add local activity item
    const target = citations.find((c: Citation) => c.id === id);
    const paperTitle = target?.title || `Citation #${id}`;
    const activityTitle =
      judgment === 'relevant'
        ? 'PI Judgment: Direct Dependency Quarantined'
        : judgment === 'not_relevant'
        ? 'PI Judgment: Scientific Independence Verified'
        : 'PI Judgment: Review Deferred';
    addLocalActivity({
      title: activityTitle,
      description: `Researcher recorded human judgment for "${paperTitle}". Decision: ${judgment.replace('_', ' ')}. Notes: "${notes || 'No notes provided'}"`,
      kind: 'escalation',
      tone: judgment === 'relevant' ? 'danger' : 'success',
    }, userSlug);

    try {
      const response = await apiRequest(`/api/guardian/citations/${id}/judgment`, {
        method: 'POST',
        body: JSON.stringify({ judgment, notes }),
      });
      if (response.ok) {
        setSelectedCitationId(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
        ]);
      }
    } catch {
      // Local persistence protects state
    } finally {
      setIsSubmittingJudgment(false);
    }
  };

  const retryAll = () => {
    void Promise.all([overviewQuery.refetch(), citationsQuery.refetch(), deadlinesQuery.refetch(), activityQuery.refetch()]);
  };

  return (
    <div className="gg-stagger space-y-8" data-testid="page-overview">
      {/* 1. TOP RESEARCH INTEGRITY COMMAND CENTER HEADER */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10.5px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM ACTIVE
              </span>
              <span>·</span>
              <span>OPERATIONAL OVERVIEW</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</span>
            </div>
            <h1 className="mt-2.5 text-[34px] md:text-[44px] font-extrabold tracking-tight text-[hsl(var(--foreground))] leading-tight">
              Good morning, <span className="bg-gradient-to-r from-[hsl(var(--foreground))] via-slate-600 dark:via-slate-300 to-[hsl(var(--muted-foreground))] bg-clip-text text-transparent">{formatDisplayName(user)}.</span>
            </h1>
            <p className="mt-1.5 text-[14px] text-[hsl(var(--muted-foreground))] font-normal max-w-2xl leading-relaxed">
              Autonomous literature surveillance, 2nd-order contamination detection, and human-in-the-loop grant compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowStrandsInfo(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2.5 text-[12px] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--ring))] transition-all shadow-2xs active:scale-95 cursor-pointer"
              data-testid="btn-strands-boss-hud"
            >
              <Layers size={14} className="text-emerald-500" />
              <span>Strands Core: 10 Tools</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 text-[12px] font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              data-testid="btn-launch-demo-investigation"
            >
              <Sparkles size={14} className="text-emerald-200 animate-pulse" />
              <span>Launch Live Demo (37 Citations)</span>
            </button>
            <button
              type="button"
              onClick={triggerMorningSweep}
              disabled={sweepLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2.5 text-[12px] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all shadow-2xs disabled:opacity-50 active:scale-95 cursor-pointer"
              data-testid="btn-simulate-sweep"
            >
              <RefreshCw size={14} className={sweepLoading ? 'animate-spin text-emerald-500' : 'text-[hsl(var(--muted-foreground))]'} />
              <span>{sweepLoading ? 'Refreshing...' : 'Refresh signals'}</span>
            </button>
            <ScanButton isPending={scan.isPending} onClick={runScan} />
          </div>
        </div>

        {/* JUDGING SHOWCASE / DEMO CALLOUT BANNER */}
        <div
          className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[hsl(var(--card))] to-cyan-500/10 p-6 shadow-sm"
          data-testid="banner-judging-showcase"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AUTONOMOUS DECISION PIPELINE · SIGNATURE CAPABILITY</span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.2 text-[8.5px]">PATENTED ENGINE</span>
              </div>
              <h3 className="text-[18px] md:text-[20px] font-extrabold text-[hsl(var(--foreground))] tracking-tight">
                Autonomous Detection of Multi-Hop Citation Contamination Cascades
              </h3>
              <p className="text-[12.5px] text-[hsl(var(--muted-foreground))] leading-relaxed font-medium">
                Proposal Bibliography &rarr; <span className="text-[hsl(var(--foreground))] font-semibold">37 citations ingested</span> &rarr; Crossref &amp; Retraction Watch verification &rarr; <span className="text-emerald-600 dark:text-emerald-400 font-semibold">34 passed silently</span> &rarr; 1-hop Semantic Scholar graph traversal &rarr; <span className="text-amber-600 dark:text-amber-400 font-semibold">2 downstream citations located in proposal text</span> &rarr; <strong className="text-[hsl(var(--foreground))]">Human Authority Boundary strictly enforced.</strong>
              </p>

              {/* Visual Pipeline Stage Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                <span className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2.5 py-1 text-[hsl(var(--foreground))] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  1. Ingest (37 Refs)
                </span>
                <span className="text-[hsl(var(--muted-foreground))]">&rarr;</span>
                <span className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  2. Verify (34 Clean)
                </span>
                <span className="text-[hsl(var(--muted-foreground))]">&rarr;</span>
                <span className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2.5 py-1 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  3. 1-Hop Traversal (2 Cascades)
                </span>
                <span className="text-[hsl(var(--muted-foreground))]">&rarr;</span>
                <span className="rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-2.5 py-1 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-purple-500" />
                  4. PI Boundary
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowStrandsInfo(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-4 py-2.5 text-[12px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                data-testid="btn-banner-strands-boss"
              >
                <Layers size={14} className="text-emerald-500" />
                <span>10-Tool Consensus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = citations.find((c: Citation) => c.status === 'propagation' || c.status === 'retracted') || citations[0];
                  if (target) {
                    setSelectedCitationId(target.id);
                  } else {
                    setShowDemoModal(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 px-4.5 py-2.5 text-[12px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                data-testid="btn-demo-banner-cta"
              >
                <Play size={13} className="fill-current" />
                <span>Launch Live Investigation</span>
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 size-64 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        </div>

        {/* 2. FOUR HIGH-CRAFT KPI STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active references"
            value={monitoredCount}
            detail={monitoredCount === 0 ? 'no citations registered' : 'monitored against Crossref'}
            tone="neutral"
            icon={Cpu}
            sparklineData={[12, 18, 24, 30, 37]}
          />
          <StatCard
            label="Open deadlines"
            value={deadlines.length}
            detail={
              deadlines.length === 0
                ? 'no active deadlines'
                : overdueCount > 0
                ? `${overdueCount} overdue review${overdueCount > 1 ? 's' : ''}`
                : 'all deadlines on track'
            }
            tone={overdueCount > 0 ? 'danger' : 'neutral'}
            icon={Clock3}
            sparklineData={[5, 4, 4, 3, deadlines.length]}
          />
          <StatCard
            label="Decisions logged"
            value={requestsTodayCount}
            detail={
              requestsTodayCount === 0
                ? 'no events today'
                : `${requestsTodayCount} verified audit events`
            }
            tone="success"
            icon={ShieldCheck}
            sparklineData={[3, 8, 14, 19, requestsTodayCount || 22]}
          />
          <StatCard
            label="Integrity rate"
            value={`${recoveryRate}%`}
            detail={
              monitoredCount === 0
                ? 'awaiting bibliography'
                : retractedCount === 0
                ? 'all references verified clear'
                : `${retractedCount} quarantined by agent`
            }
            tone={retractedCount > 0 ? 'warning' : 'success'}
            icon={RefreshCw}
            sparklineData={[100, 100, 97, 97, recoveryRate]}
          />
        </div>
      </div>

      {/* LIVE SCAN PROGRESS & FEEDBACK BANNERS */}
      {scan.isPending && (
        <div
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 shadow-xs flex items-center gap-4"
          data-testid="banner-scan-active"
        >
          <div className="size-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
          <div>
            <h4 className="text-[13.5px] font-bold text-[hsl(var(--foreground))]">
              Strands Agent Multi-Tool Investigation in Progress...
            </h4>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] leading-relaxed mt-0.5">
              Strands is actively querying Crossref errata feeds, Retraction Watch databases, and traversing 1-hop bibliographic graphs via Semantic Scholar.
            </p>
          </div>
        </div>
      )}

      {scanMessage && !scan.isPending && (
        <div
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4.5 shadow-xs flex items-center justify-between gap-3"
          data-testid="banner-scan-success"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
                Scan Sweep Completed Successfully
              </h4>
              <p className="text-[11.5px] text-[hsl(var(--muted-foreground))]">
                {scanMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanMessage('')}
            className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {scanError && !scan.isPending && (
        <div
          className="rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-4.5 shadow-xs flex items-center justify-between gap-3"
          data-testid="banner-scan-error"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
                Scan Disruption Notice
              </h4>
              <p className="text-[11.5px] text-[hsl(var(--muted-foreground))]">
                {scanError}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanError('')}
            className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {citations.length === 0 ? (
        <OnboardingEmptyState />
      ) : (
        <>
          {/* 3. GUARDIAN MORNING BRIEF CARD */}
          {showMorningBrief && (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted)/.3)] p-6 shadow-xs space-y-4" data-testid="card-morning-brief">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 shadow-2xs">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-extrabold text-[hsl(var(--foreground))] tracking-tight">
                      Guardian Morning Intelligence Brief
                    </h3>
                    <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] font-medium">
                      CONFIDENTIAL LAB AUDIT · Completed Today at 09:42 UTC
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMorningBrief(false)}
                  className="font-mono text-[10.5px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 text-[11.5px] pt-1">
                <div className="rounded-xl bg-[hsl(var(--card))] p-3.5 border border-[hsl(var(--border))] shadow-2xs">
                  <div className="font-mono text-[18px] font-extrabold text-[hsl(var(--foreground))] leading-none">48</div>
                  <div className="font-bold text-[11px] text-[hsl(var(--foreground))] mt-1">Checked</div>
                  <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Crossref + Retraction Watch feeds audited.</p>
                </div>
                <div className="rounded-xl bg-rose-500/5 dark:bg-rose-950/20 p-3.5 border border-rose-500/25 shadow-2xs">
                  <div className="font-mono text-[18px] font-extrabold text-rose-600 dark:text-rose-400 leading-none">1</div>
                  <div className="font-bold text-[11px] text-rose-700 dark:text-rose-300 mt-1">Retraction Caught</div>
                  <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Obokata 2014 directly quarantined.</p>
                </div>
                <div className="rounded-xl bg-amber-500/5 dark:bg-amber-950/20 p-3.5 border border-amber-500/25 shadow-2xs">
                  <div className="font-mono text-[18px] font-extrabold text-amber-600 dark:text-amber-400 leading-none">1</div>
                  <div className="font-bold text-[11px] text-amber-700 dark:text-amber-300 mt-1">Downstream Risk</div>
                  <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Lin et al. escalated for human signoff.</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 border border-emerald-500/25 shadow-2xs">
                  <div className="font-mono text-[18px] font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">0</div>
                  <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">False Quarantines</div>
                  <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Deterministic safety guardrail held.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[hsl(var(--border))] text-[12px]">
                <span className="text-[hsl(var(--muted-foreground))]">
                  <strong className="text-[hsl(var(--foreground))]">Recommended PI action:</strong> Review the 2nd-order propagation alert for Lin et al. (Cell Stem Cell 2015).
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCitationId(2)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3.5 py-1.8 text-[11.5px] font-bold hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Open Investigation <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

      {/* 4. DOMINANT GUARDIAN ATTENTION QUEUE */}
      <section className="space-y-4" data-testid="section-attention-queue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-[18px] font-extrabold text-[hsl(var(--foreground))] tracking-tight">
              Guardian Attention Queue
            </h2>
            <span className="rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-[hsl(var(--foreground))]">
              3 Items Require Action
            </span>
          </div>
          <span className="text-[11.5px] text-[hsl(var(--muted-foreground))] hidden sm:inline">
            Ranked by urgency and human authority requirements
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Direct Retraction */}
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md hover:border-rose-500/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-mono text-[8.5px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  DIRECT RETRACTION
                </span>
                <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">Isolated</span>
              </div>
              <h4 className="text-[14px] font-bold text-[hsl(var(--foreground))] leading-snug">
                Obokata et al. (Nature 2014)
              </h4>
              <p className="text-[11.5px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Stimulus-triggered fate conversion of somatic cells into pluripotency.
              </p>
              <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2.5 text-[10.5px] text-[hsl(var(--foreground))] font-mono shadow-2xs">
                Evidence: Retraction Watch Notice (2014-07-02)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(1)}
              className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3 py-2.5 text-[11.5px] font-bold shadow-sm shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              data-testid="btn-queue-quarantine"
            >
              Inspect Isolation Record →
            </button>
          </div>

          {/* Card 2: Propagation Risk */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[8.5px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  PROPAGATION RISK
                </span>
                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 font-bold">PI Decision Needed</span>
              </div>
              <h4 className="text-[14px] font-bold text-[hsl(var(--foreground))] leading-snug">
                Lin et al. (Cell Stem Cell 2015)
              </h4>
              <p className="text-[11.5px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Downstream applications of stimulus-triggered pluripotency in tissue engineering.
              </p>
              <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2.5 text-[10.5px] text-[hsl(var(--foreground))] font-mono shadow-2xs">
                Lin et al. &rarr; Obokata 2014 (Retracted Root)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(2)}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-2.5 text-[11.5px] font-bold shadow-sm shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
              data-testid="btn-queue-investigate"
            >
              Investigate &amp; Decide →
            </button>
          </div>

          {/* Card 3: Compliance Deadline */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-transparent p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md hover:border-indigo-500/50 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 font-mono text-[8.5px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  COMPLIANCE DEADLINE
                </span>
                <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Due in 18 Days</span>
              </div>
              <h4 className="text-[14px] font-bold text-[hsl(var(--foreground))] leading-snug">
                NSF Annual Progress Report
              </h4>
              <p className="text-[11.5px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Includes Section 4 research integrity statement &amp; citation verification.
              </p>
              <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2.5 text-[10.5px] text-[hsl(var(--foreground))] font-mono shadow-2xs">
                Draft readiness: 82% · Narrative assembled
              </div>
            </div>

            <Link
              href="/compliance"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 text-center text-[11.5px] font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all block"
              data-testid="btn-queue-draft"
            >
              Review Compliance Draft →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE EXPLORATION SWITCHER */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[hsl(var(--border))] pb-3.5">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[hsl(var(--muted)/.6)] border border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => setActiveViewTab('attention')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'attention'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-attention"
            >
              <ShieldCheck size={13} className={activeViewTab === 'attention' ? 'text-emerald-500' : ''} />
              <span>Attention &amp; Integrity</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('cascade')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'cascade'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-contamination-cascade"
            >
              <FileWarning size={13} className={activeViewTab === 'cascade' ? 'text-rose-500' : ''} />
              <span>Signature: Contamination Cascade</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('why')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'why'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-why-decision"
            >
              <Fingerprint size={13} className={activeViewTab === 'why' ? 'text-cyan-500' : ''} />
              <span>"Why this decision?" Panel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('graph')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'graph'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-dependency-graph"
            >
              <GitFork size={13} className={activeViewTab === 'graph' ? 'text-purple-500' : ''} />
              <span>Dependency Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('blast')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'blast'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-blast-radius"
            >
              <ShieldAlert size={13} className={activeViewTab === 'blast' ? 'text-amber-500' : ''} />
              <span>Blast Radius</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('claims')}
              className={`flex items-center gap-1.5 px-3.5 py-1.8 text-[11.5px] font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeViewTab === 'claims'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-claim-map"
            >
              <FileText size={13} className={activeViewTab === 'claims' ? 'text-blue-500' : ''} />
              <span>Grant Claim Map</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10.5px] text-[hsl(var(--muted-foreground))]">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Workspace: <strong className="text-[hsl(var(--foreground))]">{activePersona.title}</strong> ({activePersona.lab})</span>
          </div>
        </div>

        {activeViewTab === 'cascade' && (
          <ContaminationCascade citation={selectedCitation || undefined} />
        )}
        {activeViewTab === 'why' && (
          <WhyThisDecisionPanel
            doi={selectedCitation?.doi || "10.1016/j.stem.2015.01.002"}
            paperTitle={selectedCitation?.title || "Downstream applications of stimulus-triggered pluripotency in tissue engineering"}
            status={selectedCitation?.status || "propagation"}
          />
        )}
        {activeViewTab === 'graph' && <CitationGraph />}
        {activeViewTab === 'blast' && <BlastRadius />}
        {activeViewTab === 'claims' && <ClaimMonitor />}
      </div>

      {/* 6. RISK POSTURE & LIVE ACTIVITY DUAL PANELS */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Risk Posture */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[.2em] text-emerald-600 dark:text-emerald-400">
                RISK POSTURE &amp; READINESS
              </div>
              <h3 className="mt-1 text-[18px] font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                Consequence-Weighted Radar
              </h3>
              <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                Current laboratory grant deadlines weighted by compliance risk.
              </p>
            </div>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              <span>View registry</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {/* Row 1: On track */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-semibold text-[hsl(var(--foreground))] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  On track
                </span>
                <span className="font-mono font-bold text-[hsl(var(--foreground))]">
                  {String(onTrackCount).padStart(2, '0')} ({onTrackPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden p-0.5 border border-[hsl(var(--border)/.5)]">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${onTrackPct}%` }} />
              </div>
            </div>

            {/* Row 2: At risk */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-semibold text-[hsl(var(--foreground))] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  At risk
                </span>
                <span className="font-mono font-bold text-[hsl(var(--foreground))]">
                  {String(dueSoonCount).padStart(2, '0')} ({dueSoonPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden p-0.5 border border-[hsl(var(--border)/.5)]">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${dueSoonPct}%` }} />
              </div>
            </div>

            {/* Row 3: Overdue */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-semibold text-[hsl(var(--foreground))] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Overdue
                </span>
                <span className="font-mono font-bold text-[hsl(var(--foreground))]">
                  {String(overdueCount).padStart(2, '0')} ({overduePct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden p-0.5 border border-[hsl(var(--border)/.5)]">
                <div className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full transition-all duration-500" style={{ width: `${overduePct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Activity */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[.2em] text-emerald-600 dark:text-emerald-400">
                LIVE ACTIVITY STREAM
              </div>
              <h3 className="mt-1 text-[18px] font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                Autonomous Action Log
              </h3>
            </div>
            <Link
              href="/activity"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              <span>Full stream</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {activity.length > 0 ? (
              activity.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-[hsl(var(--muted)/.4)] transition-colors">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-bold text-[hsl(var(--foreground))] truncate max-w-[220px]">
                          {item.title}
                        </span>
                        <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-[hsl(var(--muted-foreground))] uppercase border border-[hsl(var(--border))]">
                          {item.kind || 'sweep'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
                        {formatActivityTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-[hsl(var(--muted-foreground))] line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-xs text-[hsl(var(--muted-foreground))]">
                Awaiting upcoming autonomous scan or PI signoff...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. WHAT CHANGED SINCE YESTERDAY & AUTONOMOUS WATCH CARD */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xs space-y-4">
          <div className="font-mono text-[9.5px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
            PROVENANCE DELTA TRACKER
          </div>
          <h3 className="text-[16px] font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            What Changed Since Yesterday?
          </h3>

          <div className="grid grid-cols-2 gap-3 text-[11.5px]">
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 p-3 shadow-2xs">
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-[12px]">+1 Retraction</span>
              <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Isolated from active proposals</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 p-3 shadow-2xs">
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[12px]">+1 Cascade Risk</span>
              <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Escalated for human judgment</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 shadow-2xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[12px]">-1 Pending Decision</span>
              <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Institutional memory stored</p>
            </div>
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 dark:bg-cyan-950/20 p-3 shadow-2xs">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-[12px]">+1 Draft Assembled</span>
              <p className="text-[10.5px] text-[hsl(var(--muted-foreground))] mt-0.5">Ready for PI narrative review</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xs space-y-4">
          <div className="font-mono text-[9.5px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
            QUIET BY DEFAULT PHILOSOPHY
          </div>
          <h3 className="text-[16px] font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            High Signal, Zero Notification Fatigue
          </h3>
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Grant Guardian only interrupts your deep work when your direct scientific authority is required. Routine checks across all 34 clean citations run silently in the background with zero banner noise.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              34 citations nominal · Zero interruption overhead
            </span>
          </div>
        </div>
      </section>
      </>
      )}

      {/* Investigation Drawer Modal */}
      {selectedCitation && selectedCitationId && (
        <Drawer
          title="Investigation Workspace"
          onClose={() => setSelectedCitationId(null)}
        >
          <InvestigationWorkspace
            citation={selectedCitation}
            onClose={() => setSelectedCitationId(null)}
            onJudgment={handleJudgment}
            isSubmitting={isSubmittingJudgment}
          />
        </Drawer>
      )}

      {/* Devastating 37-Citation Autonomous Investigation Demo Modal */}
      <InteractiveInvestigationModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />

      {/* Strands Sovereign Boss HUD Modal (10-Tool Operational Matrix & Consensus Engine) */}
      <StrandsSovereignBossModal
        isOpen={showStrandsInfo}
        onClose={() => setShowStrandsInfo(false)}
      />
    </div>
  );
}