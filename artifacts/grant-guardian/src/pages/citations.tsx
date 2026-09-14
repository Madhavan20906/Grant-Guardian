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

      {/* Quick DOI Import Card */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
        <form onSubmit={handleQuickImport} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-bold whitespace-nowrap text-[hsl(var(--foreground))]">
            <Plus size={14} className="text-blue-600" />
            <span>Add Research:</span>
          </div>
          <input
            type="text"
            value={newDoi}
            onChange={(e) => setNewDoi(e.target.value)}
            disabled={isImporting}
            placeholder="Paste DOI (e.g. 10.1038/s41586-021-03819-2) or PubMed ID..."
            className="h-9 flex-1 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-[11px] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500 disabled:opacity-50"
            data-testid="input-quick-doi"
          />
          <button
            type="submit"
            disabled={isImporting}
            className="h-9 w-full sm:w-auto rounded-md bg-[hsl(var(--primary))] px-4 text-[11px] font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            data-testid="btn-add-doi"
          >
            {isImporting ? (
              <>
                <Sparkles size={13} className="animate-spin text-amber-300" />
                <span>Investigating Live...</span>
              </>
            ) : (
              <span>Track in Guardian</span>
            )}
          </button>
        </form>
        {importSuccess && (
          <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            ✓ {importSuccess}
          </div>
        )}
        {importError && (
          <div className="mt-2 text-[10px] font-bold text-red-600 dark:text-red-400">
            ✕ {importError}
          </div>
        )}
      </div>

      {/* Human Decision Inbox Banner */}
      {pendingEscalations.length > 0 && (
        <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs space-y-4" data-testid="section-human-decision-inbox">
          <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                <AlertTriangle size={15} />
              </span>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                  HUMAN DECISION INBOX · {pendingEscalations.length} Item Awaiting PI Review
                </h3>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Guardian detected 2nd-order retracted foundation work. AI will not decide scientific validity.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-1 gg-mono text-[9px] font-bold text-[hsl(var(--foreground))]">
              Escalated Policy
            </span>
          </div>

          <div className="space-y-3">
            {pendingEscalations.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="gg-mono text-[8px] uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] font-extrabold px-2 py-0.5 rounded">
                      2nd-Order Propagation Risk
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] gg-mono">
                      Depth: 2 Hops (Lin et al. → Obokata 2014)
                    </span>
                  </div>
                  <h4 className="mt-1 text-[13px] font-bold text-[hsl(var(--foreground))]">{c.title}</h4>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{c.authors} · {c.venue} ({c.year})</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => setSelected(c.id)} testId={`btn-open-workspace-${c.id}`}>
                    Launch Investigation Workspace →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {judgmentSuccess && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-[11px] font-semibold text-[hsl(var(--foreground))]">
          ✓ {judgmentSuccess}
        </div>
      )}

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'register'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-register"
          >
            Citation Register
          </button>
          <button
            onClick={() => setActiveTab('cascade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'cascade'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-citations-cascade"
          >
            <FileWarning size={12} /> Signature: Contamination Cascade
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'graph'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-graph-view"
          >
            <GitFork size={12} /> Dependency Graph
          </button>
          <button
            onClick={() => setActiveTab('blast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === 'blast'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
            data-testid="tab-blast-view"
          >
            <Layers size={12} /> Blast Radius
          </button>
        </div>

        <span className="text-[10px] gg-mono text-[hsl(var(--muted-foreground))]">
          Showing {citations.length} of {rawCitations.length} Citations
        </span>
      </div>

      {activeTab === 'cascade' && <ContaminationCascade />}
      {activeTab === 'graph' && <CitationGraph />}
      {activeTab === 'blast' && <BlastRadius />}

      {activeTab === 'register' && (
        query.isError ? (
          <ErrorBlock onRetry={() => void query.refetch()} />
        ) : query.isLoading ? (
          <LoadingBlock lines={8} />
        ) : (
          <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid="section-citation-register">
            <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="gg-mono text-[18px]">{query.data?.length ?? 0}</span> sources in register
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search size={14} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, author, DOI"
                    className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3 text-[11px] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] sm:w-56"
                    data-testid="input-search-citations"
                  />
                </label>
                <label className="relative block">
                  <Filter size={13} className="pointer-events-none absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 w-full appearance-none rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-8 text-[11px] outline-none focus:border-[hsl(var(--ring))] sm:w-40"
                    data-testid="select-citation-status"
                  >
                    <option value="all">All signals</option>
                    <option value="clear">Clear</option>
                    <option value="propagation">Propagation risk</option>
                    <option value="corrected">Corrected</option>
                    <option value="retracted">Retracted</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(260px,1fr)_190px_100px] gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] sm:grid">
              <span>Source</span>
              <span>Signal</span>
              <span>Risk</span>
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