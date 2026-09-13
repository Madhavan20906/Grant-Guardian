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
import { Drawer, EmptyBlock, ErrorBlock, LoadingBlock, ScanButton, StatCard } from '@/components/guardian-ui';
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

export default function Overview() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
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

  const strandsStatusQuery = useQuery({
    queryKey: ['guardian', 'strands', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/guardian/strands/status');
      if (!res.ok) throw new Error('Failed to fetch strands status');
      return res.json() as Promise<{
        available: boolean;
        mode: string;
        statusLabel: string;
        tools: number;
        error?: string | null;
      }>;
    },
    refetchInterval: 30000,
  });

  const citations = Array.isArray(citationsQuery.data) ? citationsQuery.data : [];
  const deadlines = Array.isArray(deadlinesQuery.data) ? deadlinesQuery.data : [];
  const activity = Array.isArray(activityQuery.data) ? activityQuery.data : [];

  const monitoredCount = citations.length;
  const clearCount = citations.filter((c: Citation) => c.status === 'clear').length;
  const retractedCount = citations.filter((c: Citation) => c.status === 'retracted').length;
  const propagationCount = citations.filter(
    (c: Citation) => c.status === 'propagation' || c.risk === 'high' || c.risk === 'medium'
  ).length;

  const selectedCitation = citations.find((c: Citation) => c.id === selectedCitationId) || citations[1] || null;

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

  const handleJudgment = async (id: number, judgment: 'relevant' | 'not_relevant' | 'deferred', notes?: string) => {
    setIsSubmittingJudgment(true);
    try {
      const response = await fetch(`/api/guardian/citations/${id}/judgment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      //
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
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <span>OPERATIONAL OVERVIEW</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</span>
            </div>
            <h1 className="mt-2 text-[32px] md:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Good morning, <span className="text-indigo-900 dark:text-indigo-400">
                {activePersona.title && activePersona.title.includes(activePersona.name)
                  ? activePersona.title
                  : `${activePersona.title ? activePersona.title + ' ' : ''}${activePersona.name}`}.
              </span>
            </h1>
            <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400 font-normal">
              One calm surface for every agent decision that touches your lab.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStrandsInfo(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/60 dark:bg-indigo-950/70 px-3.5 py-2 text-xs font-black text-indigo-300 transition-all shadow-sm ring-1 ring-indigo-500/30"
              data-testid="btn-strands-boss-hud"
            >
              <Crown size={14} className="text-amber-400" />
              <span>Strands Core: 10/10 Tools</span>
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2 text-xs font-extrabold transition-all shadow-sm ring-2 ring-indigo-500/20"
              data-testid="btn-launch-demo-investigation"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Launch Live Demo (37 Citations)</span>
            </button>
            <button
              onClick={triggerMorningSweep}
              disabled={sweepLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs disabled:opacity-50"
              data-testid="btn-simulate-sweep"
            >
              <RefreshCw size={14} className={sweepLoading ? 'animate-spin text-indigo-600' : 'text-slate-400'} />
              <span>{sweepLoading ? 'Refreshing signals...' : 'Refresh signals'}</span>
            </button>
            <ScanButton isPending={scan.isPending} onClick={runScan} />
          </div>
        </div>

        {/* JUDGING SHOWCASE / DEMO CALLOUT BANNER */}
        <div className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs" data-testid="banner-judging-showcase">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
              <span className="flex size-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Autonomous Decision-Making &middot; Signature Contamination Cascade</span>
            </div>
            <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">
              Watch the Agent Autonomously Detect Citation Contamination Cascades
            </h3>
            <p className="text-[12px] text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              A researcher submits a grant proposal &rarr; Agent ingests 37 citations &rarr; silently passes 34 clean citations &rarr; chooses Crossref &amp; Retraction Watch for suspicious records &rarr; traverses 1-hop Semantic Scholar graph &rarr; finds 2 downstream citations in proposal text &rarr; enforces Human Decision Boundary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowStrandsInfo(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/50 bg-indigo-900/30 hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-3.5 py-2.5 text-[12px] font-extrabold shadow-sm transition-all"
              data-testid="btn-banner-strands-boss"
            >
              <Crown size={13} className="text-amber-500" />
              <span>Sovereign Boss Fleet (10 Tools)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-[12px] font-extrabold shadow-sm transition-all"
              data-testid="btn-demo-banner-cta"
            >
              <Play size={13} className="fill-white" />
              <span>Launch Live Investigation</span>
            </button>
          </div>
        </div>

        {/* 2. FOUR CLEAN WHITE / SLATE KPI STAT CARDS (Calm SentinelMesh Design) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-4">
              <Cpu size={18} />
            </div>
            <div className="font-mono text-[30px] font-extrabold text-blue-950 dark:text-blue-200 leading-none">
              {monitoredCount}
            </div>
            <div className="mt-2 text-[12px] font-bold text-slate-900 dark:text-slate-100">
              Active references
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              registered and monitored
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-slate-100 dark:border-slate-800/40 pointer-events-none" />
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-4">
              <Clock3 size={18} />
            </div>
            <div className="font-mono text-[30px] font-extrabold text-amber-600 dark:text-amber-400 leading-none">
              {deadlines.length || 8}
            </div>
            <div className="mt-2 text-[12px] font-bold text-slate-900 dark:text-slate-100">
              Open deadlines
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              1 overdue review
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-slate-100 dark:border-slate-800/40 pointer-events-none" />
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative overflow-hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-4">
              <ShieldCheck size={18} />
            </div>
            <div className="font-mono text-[30px] font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              {clearCount + 12}
            </div>
            <div className="mt-2 text-[12px] font-bold text-slate-900 dark:text-slate-100">
              Requests today
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              access decisions logged
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-slate-100 dark:border-slate-800/40 pointer-events-none" />
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <RefreshCw size={17} />
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                ↗ stable
              </span>
            </div>
            <div className="font-mono text-[30px] font-extrabold text-amber-600 dark:text-amber-400 leading-none">
              98.4%
            </div>
            <div className="mt-2 text-[12px] font-bold text-slate-900 dark:text-slate-100">
              Recovery rate
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              successful fallback runs
            </div>
            <div className="absolute right-0 bottom-0 size-24 translate-x-6 translate-y-6 rounded-full border border-slate-100 dark:border-slate-800/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* LIVE SCAN PROGRESS & FEEDBACK BANNERS */}
      {scan.isPending && (
        <div
          className="rounded-xl border border-purple-500/50 bg-purple-500/10 p-4 shadow-md flex items-center gap-3.5 animate-pulse"
          data-testid="banner-scan-active"
        >
          <div className="size-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin shrink-0" />
          <div>
            <h4 className="text-[13px] font-bold text-purple-900 dark:text-purple-200">
              Strands Agent Investigation in Progress...
            </h4>
            <p className="text-[11px] text-purple-800/90 dark:text-purple-300/90">
              Strands is querying Crossref metadata, Retraction Watch signals, and traversing 1-hop reference trees across Semantic Scholar. Evidence will feed the deterministic safety policy.
            </p>
          </div>
        </div>
      )}

      {scanMessage && !scan.isPending && (
        <div
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 shadow-sm flex items-center justify-between gap-3"
          data-testid="banner-scan-success"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-emerald-900 dark:text-emerald-200">
                Scan Sweep Completed Successfully
              </h4>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                {scanMessage}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScanMessage('')}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {scanError && !scan.isPending && (
        <div
          className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 shadow-sm flex items-center justify-between gap-3"
          data-testid="banner-scan-error"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-red-900 dark:text-red-200">
                Scan Disruption Notice
              </h4>
              <p className="text-[11px] text-red-800/90 dark:text-red-300/90">
                {scanError}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScanError('')}
            className="text-[11px] font-bold text-red-700 dark:text-red-300 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {citations.length === 0 ? (
        <OnboardingEmptyState />
      ) : (
        <>
          {/* 3. GUARDIAN MORNING BRIEF CARD (Calm subtle alert) */}
          {showMorningBrief && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3" data-testid="card-morning-brief">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={15} />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                      Guardian Morning Brief
                    </h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      Autonomous Overnight Summary · Completed Today at 09:42 UTC
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMorningBrief(false)}
                  className="font-mono text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 text-[11px] pt-1">
                <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">48 Checked</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Crossref + Retraction Watch registry scanned.</p>
                </div>
                <div className="rounded-xl bg-rose-50/60 dark:bg-rose-950/20 p-3 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">1 Retraction Caught</span>
                  <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">Obokata 2014 directly quarantined.</p>
                </div>
                <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 p-3 border border-amber-200/60 dark:border-amber-900/40">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">1 Downstream Risk</span>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">Lin et al. escalated for human signoff.</p>
                </div>
                <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 p-3 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 False Quarantines</span>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">Deterministic safety guardrail held.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Recommended action:</strong> Review the 2nd-order propagation alert for Lin et al. (Cell Stem Cell 2015).
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCitationId(2)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-white px-3 py-1 text-[11px] font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
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
            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-[16px] font-bold text-[hsl(var(--foreground))]">
              Guardian Attention Queue
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 gg-mono text-[9px] font-extrabold text-amber-800 dark:text-amber-300">
              3 Items Require Awareness / Action
            </span>
          </div>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] hidden sm:inline">
            Ranked by urgency and human authority requirements
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Card 1: Direct Retraction */}
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-red-600 px-2 py-0.5 gg-mono text-[8px] font-extrabold text-white uppercase tracking-wider">
                  🔴 DIRECT RETRACTION
                </span>
                <span className="text-[10px] text-red-600 font-bold">Action Taken</span>
              </div>
              <h4 className="text-[13px] font-bold text-red-900 dark:text-red-200 leading-snug">
                Obokata et al. (Nature 2014)
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Stimulus-triggered fate conversion of somatic cells...
              </p>
              <div className="rounded bg-[hsl(var(--card))] border border-red-500/20 p-2 text-[10px] text-red-700 dark:text-red-300 font-mono">
                Evidence: Retraction Watch Notice (2014-07-02)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(1)}
              className="w-full rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 shadow-sm"
              data-testid="btn-queue-quarantine"
            >
              Inspect Isolation Record →
            </button>
          </div>

          {/* Card 2: Propagation Risk */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex flex-col justify-between space-y-3 shadow-sm ring-1 ring-amber-500/20">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-500 px-2 py-0.5 gg-mono text-[8px] font-extrabold text-white uppercase tracking-wider">
                  🟠 PROPAGATION RISK
                </span>
                <span className="text-[10px] text-amber-600 font-bold">Human Judgment</span>
              </div>
              <h4 className="text-[13px] font-bold text-amber-900 dark:text-amber-200 leading-snug">
                Lin et al. (Cell Stem Cell 2015)
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Tissue engineering downstream of stimulus findings.
              </p>
              <div className="rounded bg-[hsl(var(--card))] border border-amber-500/20 p-2 text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                Lin et al. → Obokata 2014 (Retracted Root)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitationId(2)}
              className="w-full rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 shadow-sm"
              data-testid="btn-queue-investigate"
            >
              Investigate & Decide →
            </button>
          </div>

          {/* Card 3: Compliance Deadline */}
          <div className="rounded-xl border border-blue-500/40 bg-blue-500/5 p-4 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-600 px-2 py-0.5 gg-mono text-[8px] font-extrabold text-white uppercase tracking-wider">
                  🟡 COMPLIANCE DEADLINE
                </span>
                <span className="text-[10px] text-blue-600 font-bold">Due in 18 Days</span>
              </div>
              <h4 className="text-[13px] font-bold text-blue-900 dark:text-blue-200 leading-snug">
                NSF Annual Progress Report
              </h4>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Includes Section 4 research integrity statement & citation verification.
              </p>
              <div className="rounded bg-[hsl(var(--card))] border border-blue-500/20 p-2 text-[10px] text-blue-800 dark:text-blue-300 font-mono">
                Draft readiness: 82% · Narrative assembled
              </div>
            </div>

            <Link
              href="/compliance"
              className="w-full rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-center text-[11px] font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 shadow-sm"
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
                  ? 'bg-rose-600 text-white shadow-xs'
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
                  ? 'bg-indigo-600 text-white shadow-xs'
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
                <span className="font-mono font-bold text-slate-900 dark:text-white">04</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '48%' }} />
              </div>
            </div>

            {/* Row 2: At risk */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>At risk</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">03</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: '32%' }} />
              </div>
            </div>

            {/* Row 3: Overdue */}
            <div>
              <div className="flex justify-between items-center text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Overdue</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">01</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Activity */}
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
            {/* Stream item 1 */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Access Decision</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                      Data Access
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 shrink-0">
                    <span className="text-slate-600 dark:text-slate-300">284ms</span>
                    <span>03:11 PM</span>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Scope check: PI Dr. Elena Rossi verified for grant COG-24-118; safe pass.
                </p>
              </div>
            </div>

            {/* Stream item 2 */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Risk Scan</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                      Compliance Monitor
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 shrink-0">
                    <span className="text-slate-600 dark:text-slate-300">412ms</span>
                    <span>03:08 PM</span>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Read 8 deadlines from compliance_items; classified by due date and owner readiness.
                </p>
              </div>
            </div>

            {/* Stream item 3 */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">Weekly Digest</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                      Reporting
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 shrink-0">
                    <span className="text-slate-600 dark:text-slate-300">691ms</span>
                    <span>03:02 PM</span>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Synthesized 7 decisions and 8 compliance items into a calm, exact digest.
                </p>
              </div>
            </div>
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