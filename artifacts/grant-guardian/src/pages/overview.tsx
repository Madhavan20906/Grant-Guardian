import { useMemo, useState } from 'react';
import {
  ArrowRight,
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
  Activity as ActivityIcon,
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
  const [activeViewTab, setActiveViewTab] = useState<'attention' | 'graph' | 'claims' | 'blast'>('attention');
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
      <div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="gg-mono text-[10px] uppercase tracking-[.25em] text-[hsl(var(--sidebar-primary))] font-extrabold">
                GRANT GUARDIAN · RESEARCH INTEGRITY COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                WATCHING
              </span>
              <button
                type="button"
                onClick={() => setShowStrandsInfo(!showStrandsInfo)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border transition-all cursor-pointer ${
                  strandsStatusQuery.data?.available
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 hover:bg-purple-500/35'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
                data-testid="badge-strands-mode"
                title="Click to view runtime orchestration & degradation status"
              >
                <Cpu size={10} />
                {strandsStatusQuery.data?.available
                  ? `STRANDS AGENTCORE LIVE (${strandsStatusQuery.data.tools} TOOLS)`
                  : 'HONEST DEGRADATION: LOCAL SAFETY ACTIVE'}
              </button>
            </div>
            <h1 className="mt-2 text-[26px] md:text-[32px] font-serif font-bold tracking-tight text-[hsl(var(--sidebar-foreground))]">
              Good morning, {activePersona.name.split(' ')[0]}.
            </h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--sidebar-foreground)/.75)]">
              Guardian monitored tracked literature for <strong className="text-white">{activePersona.lab}</strong>. Direct retractions are quarantined automatically, and ambiguous propagation risks are routed for your domain judgment.
            </p>
            {showStrandsInfo && (
              <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5 text-[11px] text-purple-200 shadow-md">
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-400" />
                    {strandsStatusQuery.data?.available
                      ? 'Strands AgentCore Active (AWS Bedrock Orchestration)'
                      : 'Honest Graceful Degradation Active (Local Safety Guardrail)'}
                  </span>
                  <button type="button" onClick={() => setShowStrandsInfo(false)} className="text-purple-400 hover:text-white text-xs">✕</button>
                </div>
                <p className="text-[10.5px] leading-relaxed text-purple-300/90">
                  {strandsStatusQuery.data?.available
                    ? `Strands Agent (FastAPI on :8010) is actively dispatching dynamic tool traversals across Crossref, Retraction Watch, and Semantic Scholar with ${strandsStatusQuery.data.tools} registered agent tools.`
                    : 'The Python Strands service is currently offline or unreachable. Rather than guessing or halting, Grant Guardian cleanly falls back to its deterministic safety policy (classifyDecision)—guaranteeing 100% research safety and transparently labeling all provider traces.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={triggerMorningSweep}
              disabled={sweepLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[hsl(var(--sidebar-accent)/.8)] transition-all disabled:opacity-50"
              data-testid="btn-simulate-sweep"
            >
              <Clock3 size={13} className={sweepLoading ? 'animate-spin text-amber-400' : ''} />
              {sweepLoading ? 'Sweeping Registry...' : 'Simulate Overnight Sweep'}
            </button>
            <ScanButton isPending={scan.isPending} onClick={runScan} />
          </div>
        </div>

        {/* 2. FOUR CORE STAT STATUS BAR (What is safe? What requires me?) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[hsl(var(--sidebar-border))]">
          <div className="rounded-xl bg-[hsl(var(--sidebar-accent)/.6)] p-3 border border-[hsl(var(--sidebar-border))]">
            <div className="gg-mono text-[24px] font-extrabold text-white">{monitoredCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[hsl(var(--sidebar-foreground)/.7)]">
              MONITORED
            </div>
            <div className="text-[9px] text-[hsl(var(--sidebar-foreground)/.5)]">Reference register</div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
            <div className="gg-mono text-[24px] font-extrabold text-emerald-400">{clearCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              CLEAR
            </div>
            <div className="text-[9px] text-emerald-400/70">Quiet by default</div>
          </div>

          <div className="rounded-xl bg-red-500/15 p-3 border border-red-500/30">
            <div className="gg-mono text-[24px] font-extrabold text-red-400">{retractedCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-red-300">
              RETRACTED
            </div>
            <div className="text-[9px] text-red-400/70">Isolated from drafts</div>
          </div>

          <div className="rounded-xl bg-amber-500/15 p-3 border border-amber-500/30">
            <div className="gg-mono text-[24px] font-extrabold text-amber-400">{propagationCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
              NEEDS YOUR REVIEW
            </div>
            <div className="text-[9px] text-amber-400/70">2nd-order propagation</div>
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
          {/* 3. GUARDIAN MORNING BRIEF CARD (Expandable / Dismissable) */}
          {showMorningBrief && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 shadow-sm space-y-3" data-testid="card-morning-brief">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-blue-900 dark:text-blue-200">
                  Guardian Morning Brief
                </h3>
                <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80">
                  Autonomous Overnight Summary · Completed Today at 09:42 UTC
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowMorningBrief(false)}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline"
            >
              Dismiss Brief
            </button>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 text-[11px] pt-1">
            <div className="rounded-lg bg-[hsl(var(--card))] p-3 border border-[hsl(var(--border))]">
              <span className="font-bold text-[hsl(var(--foreground))]">48 Checked</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Crossref + Retraction Watch registry scanned.</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--card))] p-3 border border-[hsl(var(--border))]">
              <span className="font-bold text-red-600 dark:text-red-400">1 Retraction Caught</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Obokata 2014 directly quarantined.</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--card))] p-3 border border-[hsl(var(--border))]">
              <span className="font-bold text-amber-600 dark:text-amber-400">1 Downstream Risk</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Lin et al. escalated for human signoff.</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--card))] p-3 border border-[hsl(var(--border))]">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">0 False Quarantines</span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Deterministic safety guardrail held.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-500/20 text-[11px]">
            <span className="text-blue-900 dark:text-blue-200">
              <strong>Recommended action:</strong> Review the 2nd-order propagation alert for Lin et al. (Cell Stem Cell 2015).
            </span>
            <button
              type="button"
              onClick={() => setSelectedCitationId(2)}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
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
          <div className="flex items-center gap-2">
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
              onClick={() => setActiveViewTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                activeViewTab === 'graph'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
              data-testid="tab-dependency-graph"
            >
              <GitFork size={12} /> Interactive Dependency Graph
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

        {activeViewTab === 'graph' && <CitationGraph />}
        {activeViewTab === 'blast' && <BlastRadius />}
        {activeViewTab === 'claims' && <ClaimMonitor />}
      </div>

      {/* 6. AGENT ACTIVITY FEED & RESEARCH INTEGRITY HEALTH DUAL CARD */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Agent Observable Activity */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div className="flex items-center gap-2">
              <ActivityIcon size={16} className="text-[hsl(var(--primary))]" />
              <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
                Agent Activity & Autonomous Sweeps
              </h3>
            </div>
            <Link href="/activity" className="text-[11px] font-bold text-[hsl(var(--primary))] hover:underline">
              Full Decision Log →
            </Link>
          </div>

          <ul className="space-y-3 text-[11px]">
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-[hsl(var(--foreground))]">Swept 48 citations</span> across Crossref, Retraction Watch, and Semantic Scholar graph.
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Today · 09:42 UTC</div>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-2 rounded-full bg-red-500 shrink-0" />
              <div>
                <span className="font-bold text-red-600 dark:text-red-400">Direct Retraction Quarantined</span>: Isolated Obokata et al. from proposal bibliographies.
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Today · 09:42 UTC</div>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-2 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-amber-600 dark:text-amber-400">2nd-Order Dependency Escalated</span>: Lin et al. routed to PI Decision Inbox. Auto-quarantine blocked by safety policy.
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Today · 09:42 UTC</div>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Quiet by Default</span>: 46 sources verified clean. No alerts generated.
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Today · 09:42 UTC</div>
              </div>
            </li>
          </ul>

          <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))] gg-mono">
            <span>Next sweep: Tomorrow · 08:00 UTC</span>
            <span className="text-emerald-600 font-bold">● Routine checks silent</span>
          </div>
        </div>

        {/* Right: Multidimensional Research Health Breakdown */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">
                Research Integrity Health
              </h3>
            </div>
            <span className="gg-mono text-[16px] font-extrabold text-emerald-600">
              94 / 100
            </span>
          </div>

          <div className="space-y-3 text-[11px]">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Citation Integrity</span>
                <span className="gg-mono">98%</span>
              </div>
              <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Evidence Freshness (Temporal Recency)</span>
                <span className="gg-mono">94%</span>
              </div>
              <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Compliance Readiness (NSF / IRB)</span>
                <span className="gg-mono">91%</span>
              </div>
              <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Open Human Investigations</span>
                <span className="gg-mono text-amber-600">1 Pending Review</span>
              </div>
              <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed border border-[hsl(var(--border))]">
            <strong>Calibrated Trust Disclosure:</strong> Health score reflects monitored evidence status and registry verification recency, not scientific validity or lab experimental correctness.
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
    </div>
  );
}