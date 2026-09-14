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
} from '@/lib/api';

export default function Overview() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
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

  const rawCitations = Array.isArray(citationsQuery.data) ? citationsQuery.data : [];
  const citations = useMemo(() => {
    const local = getLocalJudgments();
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
  }, [rawCitations]);

  const rawDeadlines = Array.isArray(deadlinesQuery.data) ? deadlinesQuery.data : [];
  const deadlines = useMemo(() => {
    return rawDeadlines.map((d: Deadline) => {
      if ((d.progress ?? 0) >= 100 || (d.status as string) === 'clear' || isDeadlineSubmittedLocal(d.id)) {
        return { ...d, status: 'clear' as const, progress: 100 };
      }
      return d;
    });
  }, [rawDeadlines]);

  const serverActivity = Array.isArray(activityQuery.data) ? activityQuery.data : [];
  const activity = useMemo(() => {
    const combined = [...getLocalActivities(), ...serverActivity];
    const seen = new Set<string>();
    return combined.filter((item: Activity) => {
      const key = `${item.title}-${item.tone}-${item.description?.slice(0, 35)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [serverActivity]);

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

    // 1. Persist locally immediately
    saveLocalJudgment(id, judgment, notes);

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
    });

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
    <div className="gg-stagger space-y-7" data-testid="page-overview">
      {/* 1. TOP RESEARCH INTEGRITY COMMAND CENTER HEADER */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
              <span>OPERATIONAL OVERVIEW</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</span>
            </div>
            <h1 className="mt-2 text-[32px] md:text-[40px] font-extrabold tracking-tight text-[hsl(var(--foreground))] leading-tight">
              Good morning, <span>{formatDisplayName(user)}.</span>
            </h1>
            <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))] font-normal">
              One calm surface for every agent decision that touches your lab.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStrandsInfo(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer"
              data-testid="btn-strands-boss-hud"
            >
              <Layers size={14} className="text-[hsl(var(--muted-foreground))]" />
              <span>Strands Core: 10 Tools</span>
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
              data-testid="btn-launch-demo-investigation"
            >
              <Sparkles size={14} className="text-[hsl(var(--primary-foreground))]" />
              <span>Launch Live Demo (37 Citations)</span>
            </button>
            <button
              onClick={triggerMorningSweep}
              disabled={sweepLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              data-testid="btn-simulate-sweep"
            >
              <RefreshCw size={14} className={sweepLoading ? 'animate-spin text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'} />
              <span>{sweepLoading ? 'Refreshing signals...' : 'Refresh signals'}</span>
            </button>
            <ScanButton isPending={scan.isPending} onClick={runScan} />
          </div>
        </div>

        {/* JUDGING SHOWCASE / DEMO CALLOUT BANNER */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs" data-testid="banner-judging-showcase">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              <span className="size-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
              <span>Autonomous Decision Pipeline · Contamination Cascade</span>
            </div>
            <h3 className="text-[16px] font-bold text-[hsl(var(--foreground))]">
              Watch the Agent Autonomously Detect Citation Contamination Cascades
            </h3>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] max-w-2xl font-normal leading-relaxed">
              A researcher submits a grant proposal &rarr; Agent ingests 37 citations &rarr; silently passes 34 clean citations &rarr; chooses Crossref &amp; Retraction Watch for suspicious records &rarr; traverses 1-hop Semantic Scholar graph &rarr; finds 2 downstream citations in proposal text &rarr; enforces Human Decision Boundary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowStrandsInfo(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/.8)] text-[hsl(var(--foreground))] px-3.5 py-2.5 text-[12px] font-semibold transition-colors cursor-pointer"
              data-testid="btn-banner-strands-boss"
            >
              <Layers size={13} className="text-[hsl(var(--muted-foreground))]" />
              <span>Strands Core (10 Tools)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2.5 text-[12px] font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              data-testid="btn-demo-banner-cta"
            >
              <Play size={13} className="fill-current" />
              <span>Launch Live Investigation</span>
            </button>
          </div>
        </div>

        {/* 2. FOUR CLEAN BACKGROUND-BLENDED KPI STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] mb-4 border border-[hsl(var(--border))]">
              <Cpu size={17} />
            </div>
            <div className="font-mono text-[30px] font-bold text-[hsl(var(--foreground))] leading-none">
              {monitoredCount}
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[hsl(var(--foreground))]">
              Active references
            </div>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              {monitoredCount === 0 ? 'no citations registered' : 'registered and monitored'}
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-[hsl(var(--border))]/40 pointer-events-none" />
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] mb-4 border border-[hsl(var(--border))]">
              <Clock3 size={17} />
            </div>
            <div className="font-mono text-[30px] font-bold text-[hsl(var(--foreground))] leading-none">
              {deadlines.length}
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[hsl(var(--foreground))]">
              Open deadlines
            </div>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              {deadlines.length === 0
                ? 'no active deadlines'
                : overdueCount > 0
                ? `${overdueCount} overdue review${overdueCount > 1 ? 's' : ''}`
                : 'all deadlines on track'}
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-[hsl(var(--border))]/40 pointer-events-none" />
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] mb-4 border border-[hsl(var(--border))]">
              <ShieldCheck size={17} />
            </div>
            <div className="font-mono text-[30px] font-bold text-[hsl(var(--foreground))] leading-none">
              {requestsTodayCount}
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[hsl(var(--foreground))]">
              Requests today
            </div>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              {requestsTodayCount === 0
                ? 'no decisions logged'
                : `${requestsTodayCount} access decision${requestsTodayCount > 1 ? 's' : ''} logged`}
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-[hsl(var(--border))]/40 pointer-events-none" />
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                <RefreshCw size={16} />
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md border border-[hsl(var(--border))]">
                {retractedCount > 0 ? 'review needed' : 'stable'}
              </span>
            </div>
            <div className="font-mono text-[30px] font-bold text-[hsl(var(--foreground))] leading-none">
              {recoveryRate}%
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[hsl(var(--foreground))]">
              Recovery rate
            </div>
            <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
              {monitoredCount === 0
                ? 'no risks detected'
                : retractedCount === 0
                ? 'all citations verified clean'
                : `${retractedCount} flagged / quarantined`}
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-[hsl(var(--border))]/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* LIVE SCAN PROGRESS & FEEDBACK BANNERS */}
      {scan.isPending && (
        <div
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xs flex items-center gap-3.5"
          data-testid="banner-scan-active"
        >
          <div className="size-4 rounded-full border-2 border-[hsl(var(--muted-foreground))] border-t-transparent animate-spin shrink-0" />
          <div>
            <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
              Strands Agent Investigation in Progress...
            </h4>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Strands is querying Crossref metadata, Retraction Watch signals, and traversing 1-hop reference trees across Semantic Scholar. Evidence will feed the deterministic safety policy.
            </p>
          </div>
        </div>
      )}

      {scanMessage && !scan.isPending && (
        <div
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xs flex items-center justify-between gap-3"
          data-testid="banner-scan-success"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-[hsl(var(--muted-foreground))] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
                Scan Sweep Completed Successfully
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {scanMessage}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScanMessage('')}
            className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {scanError && !scan.isPending && (
        <div
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xs flex items-center justify-between gap-3"
          data-testid="banner-scan-error"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-[hsl(var(--muted-foreground))] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
                Scan Disruption Notice
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {scanError}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScanError('')}
            className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {citations.length === 0 ? (
        <OnboardingEmptyState />
      ) : (
        <>
          {/* 3. GUARDIAN MORNING BRIEF CARD (Blends with background) */}
          {showMorningBrief && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs space-y-3" data-testid="card-morning-brief">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
                      Guardian Morning Brief
                    </h3>
                    <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                      Autonomous Overnight Summary · Completed Today at 09:42 UTC
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMorningBrief(false)}
                  className="font-mono text-[10px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 text-[11px] pt-1">
                <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 border border-[hsl(var(--border))]">
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">48 Checked</span>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Crossref + Retraction Watch registry scanned.</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 border border-[hsl(var(--border))]">
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">1 Retraction Caught</span>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Obokata 2014 directly quarantined.</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 border border-[hsl(var(--border))]">
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">1 Downstream Risk</span>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Lin et al. escalated for human signoff.</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 border border-[hsl(var(--border))]">
                  <span className="font-mono font-bold text-[hsl(var(--foreground))]">0 False Quarantines</span>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Deterministic safety guardrail held.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--border))] text-[11px]">
                <span className="text-[hsl(var(--muted-foreground))]">
                  <strong className="text-[hsl(var(--foreground))]">Recommended action:</strong> Review the 2nd-order propagation alert for Lin et al. (Cell Stem Cell 2015).
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCitationId(2)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-[11px] font-bold hover:opacity-90 transition-opacity"
                >
                  Open Investigation <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}

      {/* 4. DOMINANT GUARDIAN ATTENTION QUEUE */}
      <section className="space-y-3" data-testid="section-attention-queue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
            <h2 className="text-[16px] font-bold text-[hsl(var(--foreground))]">
              Guardian Attention Queue
            </h2>
            <span className="rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-0.5 gg-mono text-[9px] font-bold text-[hsl(var(--foreground))]">
              3 Items Require Awareness / Action
            </span>
          </div>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] hidden sm:inline">
            Ranked by urgency and human authority requirements
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Card 1: Direct Retraction */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 gg-mono text-[8px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  DIRECT RETRACTION
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-semibold">Action Taken</span>
              </div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))] leading-snug">
                Obokata et al. (Nature 2014)
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Stimulus-triggered fate conversion of somatic cells...
              </p>
              <div className="rounded bg-[hsl(var(--muted)/.4)] border border-[hsl(var(--border))] p-2 text-[10px] text-[hsl(var(--foreground))] font-mono">
                Evidence: Retraction Watch Notice (2014-07-02)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(1)}
              className="w-full rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-[11px] font-bold hover:opacity-90 shadow-2xs transition-opacity cursor-pointer"
              data-testid="btn-queue-quarantine"
            >
              Inspect Isolation Record →
            </button>
          </div>

          {/* Card 2: Propagation Risk */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 gg-mono text-[8px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  PROPAGATION RISK
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-semibold">Human Judgment</span>
              </div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))] leading-snug">
                Lin et al. (Cell Stem Cell 2015)
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Tissue engineering downstream of stimulus findings.
              </p>
              <div className="rounded bg-[hsl(var(--muted)/.4)] border border-[hsl(var(--border))] p-2 text-[10px] text-[hsl(var(--foreground))] font-mono">
                Lin et al. → Obokata 2014 (Retracted Root)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(2)}
              className="w-full rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-[11px] font-bold hover:opacity-90 shadow-2xs transition-opacity cursor-pointer"
              data-testid="btn-queue-investigate"
            >
              Investigate &amp; Decide →
            </button>
          </div>

          {/* Card 3: Compliance Deadline */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 gg-mono text-[8px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  COMPLIANCE DEADLINE
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-semibold">Due in 18 Days</span>
              </div>
              <h4 className="text-[13px] font-bold text-[hsl(var(--foreground))] leading-snug">
                NSF Annual Progress Report
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Includes Section 4 research integrity statement &amp; citation verification.
              </p>
              <div className="rounded bg-[hsl(var(--muted)/.4)] border border-[hsl(var(--border))] p-2 text-[10px] text-[hsl(var(--foreground))] font-mono">
                Draft readiness: 82% · Narrative assembled
              </div>
            </div>

            <Link
              href="/compliance"
              className="w-full rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-2 text-center text-[11px] font-bold hover:opacity-90 shadow-2xs transition-opacity block"
              data-testid="btn-queue-draft"
            >
              Review Compliance Draft →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE EXPLORATION SWITCHER (Attention / Graph / Claims / Blast Radius) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveViewTab('attention')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'attention'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-attention"
            >
              Attention & Integrity
            </button>
            <button
              onClick={() => setActiveViewTab('cascade')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'cascade'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-contamination-cascade"
            >
              <FileWarning size={12} /> Signature: Contamination Cascade
            </button>
            <button
              onClick={() => setActiveViewTab('why')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'why'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-why-decision"
            >
              <Fingerprint size={12} /> "Why this decision?" Panel
            </button>
            <button
              onClick={() => setActiveViewTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'graph'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-dependency-graph"
            >
              <GitFork size={12} /> Dependency Graph
            </button>
            <button
              onClick={() => setActiveViewTab('blast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'blast'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-blast-radius"
            >
              <ShieldAlert size={12} /> Blast Radius
            </button>
            <button
              onClick={() => setActiveViewTab('claims')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'claims'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-claim-map"
            >
              <FileText size={12} /> Grant Claim Map
            </button>
          </div>

          <span className="text-[10px] gg-mono text-[hsl(var(--muted-foreground))]">
            Workspace: {activePersona.title} ({activePersona.lab})
          </span>
        </div>

        {activeViewTab === 'cascade' && <ContaminationCascade />}
        {activeViewTab === 'why' && (
          <WhyThisDecisionPanel
            doi="10.1016/j.stem.2015.01.002"
            paperTitle="Downstream applications of stimulus-triggered pluripotency in tissue engineering"
            status="propagation"
          />
        )}
        {activeViewTab === 'graph' && <CitationGraph />}
        {activeViewTab === 'blast' && <BlastRadius />}
        {activeViewTab === 'claims' && <ClaimMonitor />}
      </div>

      {/* 6. RISK POSTURE & LIVE ACTIVITY DUAL PANELS (SentinelMesh Calm Theme) */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Risk Posture */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-slate-400 dark:text-slate-500">
                RISK POSTURE
              </div>
              <h3 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                A readable risk picture
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Current deadlines, weighted by consequence.
              </p>
            </div>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>View registry</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {/* Row 1: On track */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>On track</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {String(onTrackCount).padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-500" style={{ width: `${onTrackPct}%` }} />
              </div>
            </div>

            {/* Row 2: At risk */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>At risk</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {String(dueSoonCount).padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 dark:bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${dueSoonPct}%` }} />
              </div>
            </div>

            {/* Row 3: Overdue */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Overdue</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {String(overdueCount).padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500" style={{ width: `${overduePct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Activity - dynamically populated from real activity records */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-slate-400 dark:text-slate-500">
                LIVE ACTIVITY
              </div>
              <h3 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                What is happening now
              </h3>
            </div>
            <Link
              href="/activity"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Full stream</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3.5 pt-1">
            {activity.length > 0 ? (
              activity.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="size-1.5 rounded-full bg-slate-600 dark:bg-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {item.title}
                        </span>
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                          {item.kind || 'sweep'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {formatActivityTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Awaiting upcoming autonomous scan or PI signoff...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. WHAT CHANGED SINCE YESTERDAY & AUTONOMOUS WATCH CARD */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
          <div className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
            Delta Tracker
          </div>
          <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
            What Changed Since Yesterday?
          </h3>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5">
              <span className="font-bold text-red-600 dark:text-red-400">+1 Retraction</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Isolated from active proposals</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5">
              <span className="font-bold text-amber-600 dark:text-amber-400">+1 Propagation Cascade</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Escalated for human judgment</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">-1 Pending Decision</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Institutional memory stored</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2.5">
              <span className="font-bold text-blue-600 dark:text-blue-400">+1 Draft Assembled</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Ready for PI narrative review</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
          <div className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--muted-foreground))]">
            Quiet by Default Philosophy
          </div>
          <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
            The Agent That Doesn't Annoy
          </h3>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Grant Guardian only alerts when your direct intervention is required. Routine checks across all 46 clean citations completed silently with zero banner fatigue.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              46 citations nominal · Zero noise generated
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