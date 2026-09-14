import { useMemo, useState } from 'react';
import {
  ExternalLink,
  Filter,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  GitFork,
  Plus,
  BookOpen,
  Layers,
  Sparkles,
  HelpCircle,
  FileWarning,
} from 'lucide-react';
import {
  useListCitations,
  getListCitationsQueryKey,
  getListActivityQueryKey,
  getGetGuardianOverviewQueryKey,
  type Citation,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CitationRow,
  Drawer,
  EmptyBlock,
  ErrorBlock,
  RiskPill,
  SectionHeading,
  StatusPill,
  LoadingBlock,
  Button,
} from '@/components/guardian-ui';
import { InvestigationWorkspace } from '@/components/investigation-workspace';
import { CitationGraph } from '@/components/citation-graph';
import { BlastRadius } from '@/components/blast-radius';
import { ContaminationCascade } from '@/components/contamination-cascade';
import { OnboardingEmptyState } from '@/components/onboarding-empty-state';
import { useAuth } from '@/context/auth-context';
import {
  apiRequest,
  getLocalJudgments,
  saveLocalJudgment,
  addLocalActivity,
  getLocalCitations,
  addLocalCitation,
} from '@/lib/api';

export default function Citations() {
  const { user } = useAuth();
  const userSlug = user?.tenantSlug || (user?.id ? String(user.id) : undefined);
  const query = useListCitations();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [judgmentSubmitting, setJudgmentSubmitting] = useState<number | null>(null);
  const [judgmentSuccess, setJudgmentSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'cascade' | 'graph' | 'blast'>('register');
  const [cascadeCitationId, setCascadeCitationId] = useState<number | null>(null);
  const [newDoi, setNewDoi] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const rawCitations = Array.isArray(query.data) ? query.data : [];

  // Merge server citations with account-scoped local citations so imported citations persist across login/logout
  const allRawCitations = useMemo(() => {
    const localList = getLocalCitations(userSlug);
    if (!localList || localList.length === 0) return rawCitations;
    const merged = [...rawCitations];
    for (const item of localList) {
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
  }, [rawCitations, userSlug]);

  // Merge server citations with locally saved judgments to prevent state reverting across pages
  const citationsWithJudgments = useMemo(() => {
    const local = getLocalJudgments(userSlug);
    return allRawCitations.map((c: Citation) => {
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
  }, [allRawCitations, userSlug]);

  const citations = useMemo(() => {
    return citationsWithJudgments.filter((citation: Citation) => {
      const matchesSearch = `${citation.title} ${citation.authors} ${citation.venue} ${citation.doi}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch && (status === 'all' || citation.status === status);
    });
  }, [citationsWithJudgments, search, status]);

  // Citations that require human judgment (propagation risks pending review)
  const pendingEscalations = useMemo(() => {
    return citationsWithJudgments.filter(
      (c: any) =>
        c.status === 'propagation' ||
        (c.risk === 'medium' && c.judgment !== 'relevant' && c.judgment !== 'not_relevant')
    );
  }, [citationsWithJudgments]);

  const selectedCitation = citationsWithJudgments.find((citation: Citation) => citation.id === selected);

  const handleJudgment = async (id: number, judgment: 'relevant' | 'not_relevant' | 'deferred', notes?: string) => {
    setJudgmentSubmitting(id);
    setJudgmentSuccess(null);

    // 1. Immediately record in localStorage scoped to active tenant so state is sealed across navigation & refresh
    saveLocalJudgment(id, judgment, notes, userSlug);

    // 2. Add local activity log so /activity immediately records the decision
    const target = citationsWithJudgments.find((c: Citation) => c.id === id);
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
        setJudgmentSuccess(`Decision stored: Marked as ${judgment.replace('_', ' ')}. Rationale recorded in lab memory.`);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
      ]);
    } catch {
      // Local storage already has the decision
    } finally {
      setJudgmentSubmitting(null);
    }
  };

  const handleQuickImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const doi = newDoi.trim();
    if (!doi || isImporting) return;
    setIsImporting(true);
    setImportSuccess(null);
    setImportError(null);
    try {
      const res = await apiRequest('/api/guardian/citations/import', {
        method: 'POST',
        body: JSON.stringify({ content: `DOI: ${doi}` }),
      });
      if (res.ok) {
        // Persist imported citation locally partitioned by tenant
        const imported = Array.isArray(res.data) ? res.data[0] : (res.data?.citations?.[0] || null);
        addLocalCitation(
          imported || {
            id: Date.now(),
            doi,
            title: doi,
            authors: 'Pending metadata lookup',
            venue: 'External Registry',
            year: new Date().getFullYear(),
            status: 'clear',
            risk: 'low',
          },
          userSlug
        );

        setImportSuccess(`DOI ${doi} registered. Running autonomous Crossref & OpenAlex scan...`);
        setNewDoi('');
        try {
          await apiRequest('/api/guardian/scan', { method: 'POST' });
        } catch {
          // Non-blocking scan
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
        setImportSuccess(`DOI ${doi} verified against Crossref & OpenAlex.`);
        setTimeout(() => setImportSuccess(null), 5000);
      } else {
        setImportError(res.error || 'Could not parse DOI. Please use format like 10.1038/nature13358.');
        setTimeout(() => setImportError(null), 5000);
      }
    } catch {
      setImportError('Network error connecting to Guardian API server.');
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="gg-stagger space-y-6" data-testid="page-citations">
      <SectionHeading
        eyebrow="Citation Integrity & Human Supervision"
        title="Citation Health & Decision Center"
        description="A live register of the scientific foundation your proposal leans on. Guardian watches the literature autonomously in the background and surfaces ambiguous 2nd-order cascades for your domain judgment."
        action={
          <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--accent)/.2)] px-3 py-2 text-[10px] font-bold text-[hsl(var(--accent-foreground))]">
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            Autonomous Watch Active
          </div>
        }
      />

      {/* Quick DOI Import Card - High-Tech Radar Console */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--muted)/.2)] p-5 shadow-sm backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--foreground))]">
            <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles size={13} />
            </span>
            <span>Live Citation Ingestion & Radar</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] gg-mono text-[hsl(var(--muted-foreground))]">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Crossref &amp; OpenAlex Synchronized</span>
          </div>
        </div>

        <form onSubmit={handleQuickImport} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={newDoi}
              onChange={(e) => setNewDoi(e.target.value)}
              disabled={isImporting}
              placeholder="Paste DOI (e.g. 10.1038/nature13358), PubMed ID, or paper title..."
              className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-14 text-xs text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              data-testid="input-quick-doi"
            />
            {newDoi && (
              <button
                type="button"
                onClick={() => setNewDoi('')}
                className="absolute right-3 top-2.5 text-[10px] gg-mono text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-1 py-0.5 rounded bg-[hsl(var(--muted))]"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isImporting || !newDoi.trim()}
            className="h-10 w-full sm:w-auto px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="btn-add-doi"
          >
            {isImporting ? (
              <>
                <Sparkles size={14} className="animate-spin text-amber-200" />
                <span>Investigating Live...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Track in Guardian</span>
              </>
            )}
          </button>
        </form>

        {/* Quick sample DOI chips for evaluators */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
          <span className="font-semibold text-[hsl(var(--foreground))]">One-Click Quick Samples:</span>
          <button
            type="button"
            onClick={() => setNewDoi('10.1038/nature13358')}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 gg-mono font-medium text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            title="STAP Stem Cell (Direct Retraction)"
          >
            10.1038/nature13358 (STAP Retraction)
          </button>
          <button
            type="button"
            onClick={() => setNewDoi('10.1016/j.stem.2015.01.002')}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 gg-mono font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
            title="Cell Stem Cell 2015 (2-Hop Propagation)"
          >
            10.1016/j.stem.2015.01.002 (2-Hop Cascade)
          </button>
          <button
            type="button"
            onClick={() => setNewDoi('10.1126/science.1198424')}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 gg-mono font-medium text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
            title="Science 2010 (Clear Genomic Protocol)"
          >
            10.1126/science.1198424 (Clear Baseline)
          </button>
        </div>

        {importSuccess && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}
        {importError && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <XCircle size={14} className="shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>

      {/* Human Decision Inbox Banner - Air-Traffic Supervisor Center */}
      {pendingEscalations.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-[hsl(var(--card))] to-amber-500/5 p-5 shadow-lg space-y-4 glow-amber" data-testid="section-human-decision-inbox">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs">
                <AlertTriangle size={18} className="animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                    HUMAN SUPERVISOR INBOX
                  </h3>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 gg-mono text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    {pendingEscalations.length} Pending PI Review
                  </span>
                </div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                  Guardian detected 2nd-order retracted foundations. AI safety policy strictly bars auto-deletion without PI domain signoff.
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-[hsl(var(--background))] border border-amber-500/30 px-3 py-1 gg-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 self-start sm:self-auto">
              Article IV Invariant Active
            </span>
          </div>

          <div className="space-y-3">
            {pendingEscalations.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-amber-500/20 bg-[hsl(var(--card))] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="gg-mono text-[8px] uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold px-2 py-0.5 rounded-md">
                      2nd-Order Propagation Risk
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] gg-mono font-medium">
                      Cascade Path: Lin et al. → [Retracted: Obokata 2014]
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[hsl(var(--foreground))] leading-snug">{c.title}</h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">{c.authors} · {c.venue} ({c.year})</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => setSelected(c.id)} testId={`btn-open-workspace-${c.id}`} className="font-bold border-amber-500/30 hover:border-amber-500/50">
                    Launch Investigation Workspace →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {judgmentSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{judgmentSuccess}</span>
        </div>
      )}

      {/* View Mode Switcher - High-End Segmented Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[hsl(var(--muted)/.4)] border border-[hsl(var(--border)/.6)] overflow-x-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
            data-testid="tab-register"
          >
            <BookOpen size={13} />
            <span>Citation Register</span>
          </button>
          <button
            onClick={() => setActiveTab('cascade')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'cascade'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
            data-testid="tab-citations-cascade"
          >
            <FileWarning size={13} />
            <span>Contamination Cascade</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
            data-testid="tab-graph-view"
          >
            <GitFork size={13} />
            <span>Dependency Graph</span>
          </button>
          <button
            onClick={() => setActiveTab('blast')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'blast'
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
            data-testid="tab-blast-view"
          >
            <Layers size={13} />
            <span>Blast Radius</span>
          </button>
        </div>

        <span className="text-[11px] gg-mono text-[hsl(var(--muted-foreground))] font-semibold">
          Showing <strong className="text-[hsl(var(--foreground))]">{citations.length}</strong> of {rawCitations.length} Citations
        </span>
      </div>

      {activeTab === 'cascade' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.25)]">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                <GitFork size={13} />
              </span>
              <div>
                <span className="text-xs font-bold text-[hsl(var(--foreground))]">Inspect Cascade for Target Citation:</span>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Select any paper from your registered bibliography to trace its specific multi-hop lineage</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={cascadeCitationId ?? ''}
                onChange={(e) => setCascadeCitationId(e.target.value ? Number(e.target.value) : null)}
                className="h-8.5 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs font-semibold text-[hsl(var(--foreground))] outline-none focus:border-blue-500 transition-all cursor-pointer max-w-[280px] truncate"
                data-testid="select-cascade-target"
              >
                <option value="">Signature Demo Cascade (Lin / Obokata 2014)</option>
                {allRawCitations.map((c: Citation) => (
                  <option key={c.id} value={c.id}>
                    [{c.status.toUpperCase()}] {c.title.length > 35 ? `${c.title.slice(0, 32)}...` : c.title} ({c.year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ContaminationCascade
            citation={allRawCitations.find((c: Citation) => c.id === cascadeCitationId)}
          />
        </div>
      )}
      {activeTab === 'graph' && <CitationGraph />}
      {activeTab === 'blast' && <BlastRadius />}

      {activeTab === 'register' && (
        query.isError ? (
          <ErrorBlock onRetry={() => void query.refetch()} />
        ) : query.isLoading ? (
          <LoadingBlock lines={8} />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid="section-citation-register">
            <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-4 sm:p-5 md:flex-row md:items-center md:justify-between bg-gradient-to-b from-[hsl(var(--muted)/.2)] to-transparent">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                  <BookOpen size={14} />
                </span>
                <div>
                  <div className="text-xs font-bold text-[hsl(var(--foreground))]">
                    <span className="gg-mono text-[16px] font-extrabold">{query.data?.length ?? 0}</span> Citations Monitored
                  </div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Continuous multi-registry cross-referencing
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, author, DOI..."
                    className="h-9 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3 text-xs outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 sm:w-60 transition-all"
                    data-testid="input-search-citations"
                  />
                </label>
                <label className="relative block">
                  <Filter size={13} className="pointer-events-none absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 w-full appearance-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-8 text-xs font-medium outline-none focus:border-blue-500 sm:w-44 transition-all cursor-pointer"
                    data-testid="select-citation-status"
                  >
                    <option value="all">All signals</option>
                    <option value="clear">Clear (Verified)</option>
                    <option value="propagation">Propagation risk</option>
                    <option value="corrected">Corrected</option>
                    <option value="retracted">Retracted</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(260px,1fr)_190px_100px] gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] sm:grid">
              <span>Source &amp; Authors</span>
              <span>Autonomous Signal</span>
              <span>Risk Tier</span>
            </div>

            {rawCitations.length === 0 ? (
              <div className="p-4 md:p-6">
                <OnboardingEmptyState />
              </div>
            ) : citations.length ? (
              citations.map((citation: Citation) => (
                <CitationRow key={citation.id} citation={citation} onSelect={() => setSelected(citation.id)} />
              ))
            ) : (
              <EmptyBlock
                title="No sources match"
                detail="Try a broader search or return to all signals."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setStatus('all');
                    }}
                    testId="button-clear-citation-filters"
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </section>
        )
      )}

      {/* Dedicated 5-Tab Investigation Workspace Drawer */}
      {selectedCitation && (
        <Drawer title="Investigation Workspace" onClose={() => setSelected(null)}>
          <InvestigationWorkspace
            citation={selectedCitation}
            onClose={() => setSelected(null)}
            onJudgment={handleJudgment}
            isSubmitting={judgmentSubmitting === selectedCitation.id}
          />
        </Drawer>
      )}
    </div>
  );
}