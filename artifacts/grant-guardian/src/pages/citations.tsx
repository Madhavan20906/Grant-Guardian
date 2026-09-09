import { useMemo, useState } from 'react';
import { ExternalLink, Filter, Search, ShieldAlert, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useListCitations, getListCitationsQueryKey, getListActivityQueryKey, getGetGuardianOverviewQueryKey, type Citation } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { CitationRow, Drawer, EmptyBlock, ErrorBlock, RiskPill, SectionHeading, StatusPill, LoadingBlock, Button } from '@/components/guardian-ui';
import { EvidenceTimeline, type EvidenceMetadata } from '@/components/evidence-timeline';

export default function Citations() {
  const query = useListCitations();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [judgmentSubmitting, setJudgmentSubmitting] = useState<number | null>(null);
  const [judgmentNotes, setJudgmentNotes] = useState('');
  const [judgmentSuccess, setJudgmentSuccess] = useState<string | null>(null);

  const rawCitations = Array.isArray(query.data) ? query.data : [];
  const citations = useMemo(() => rawCitations.filter((citation: Citation) => {
    const matchesSearch = `${citation.title} ${citation.authors} ${citation.venue} ${citation.doi}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || citation.status === status);
  }), [rawCitations, search, status]);

  // Citations that require human judgment (propagation risks pending review)
  const pendingEscalations = useMemo(() => {
    return rawCitations.filter((c: any) => c.status === 'propagation' || (c.risk === 'medium' && c.judgment !== 'relevant' && c.judgment !== 'not_relevant'));
  }, [rawCitations]);

  const selectedCitation = rawCitations.find((citation: Citation) => citation.id === selected);

  const handleJudgment = async (id: number, judgment: 'relevant' | 'not_relevant' | 'deferred') => {
    setJudgmentSubmitting(id);
    setJudgmentSuccess(null);
    try {
      const response = await fetch(`/api/guardian/citations/${id}/judgment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgment, notes: judgmentNotes }),
      });
      if (response.ok) {
        setJudgmentSuccess(`Decision stored: Marked as ${judgment.replace('_', ' ')}.`);
        setJudgmentNotes('');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
        ]);
      }
    } catch {
      // Graceful error state
    } finally {
      setJudgmentSubmitting(null);
    }
  };

  return (
    <div className="gg-stagger space-y-6">
      <SectionHeading
        eyebrow="Citation integrity & Human Supervision"
        title="Citation health & Decision Inbox"
        description="A live register of the sources your work leans on. Guardian watches the literature in the background and surfaces ambiguous propagation calls for your judgment."
        action={<div className="flex items-center gap-2 rounded-md bg-[hsl(var(--accent)/.2)] px-3 py-2 text-[10px] font-bold text-[hsl(var(--accent-foreground))]"><span className="size-1.5 rounded-full bg-current animate-pulse" />Autonomous Watch Active</div>}
      />

      {/* Human Decision Inbox Banner (Priority 4) */}
      {pendingEscalations.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm" data-testid="section-human-decision-inbox">
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <AlertTriangle size={16} />
              </span>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight text-amber-900 dark:text-amber-200">
                  HUMAN DECISION INBOX · {pendingEscalations.length} Item(s) Awaiting PI Review
                </h3>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                  Guardian detected 2nd-order retracted foundation work. Guardian will not make the scientific judgment.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 gg-mono text-[9px] font-bold text-amber-800 dark:text-amber-200">
              Escalated Policy
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {pendingEscalations.map((c: any) => (
              <div key={c.id} className="rounded-lg border border-amber-500/20 bg-[hsl(var(--card))] p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className="gg-mono text-[9px] uppercase tracking-wider text-amber-600 font-bold">Propagation Risk</span>
                    <h4 className="text-[13px] font-bold">{c.title}</h4>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{c.authors} · {c.venue} ({c.year}) · DOI: {c.doi}</p>
                  </div>
                  <Button variant="secondary" onClick={() => setSelected(c.id)} testId={`btn-inspect-inbox-${c.id}`}>
                    Inspect Trace
                  </Button>
                </div>

                <div className="mt-3 rounded-md bg-[hsl(var(--muted)/.4)] p-3 text-[11px] leading-relaxed">
                  <span className="font-bold text-[hsl(var(--foreground))]">Why we're escalating: </span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {c.detail || 'This paper references a confirmed retracted study. Guardian cannot determine whether your scientific claim actually relies on the invalidated premise.'}
                  </span>
                  <div className="mt-1 gg-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Confidence: High evidence / uncertain scientific impact
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant="danger"
                    onClick={() => handleJudgment(c.id, 'relevant')}
                    disabled={judgmentSubmitting === c.id}
                    testId={`btn-mark-relevant-${c.id}`}
                  >
                    <XCircle size={13} className="mr-1.5" /> Mark Relevant (Quarantine)
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleJudgment(c.id, 'not_relevant')}
                    disabled={judgmentSubmitting === c.id}
                    testId={`btn-mark-not-relevant-${c.id}`}
                  >
                    <CheckCircle size={13} className="mr-1.5" /> Mark Not Relevant (Safe)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleJudgment(c.id, 'deferred')}
                    disabled={judgmentSubmitting === c.id}
                    testId={`btn-defer-${c.id}`}
                  >
                    <Clock size={13} className="mr-1.5" /> Defer Judgment
                  </Button>
                  {judgmentSubmitting === c.id && <span className="text-[10px] text-[hsl(var(--muted-foreground))] animate-pulse">Recording PI decision...</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {judgmentSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
          ✓ {judgmentSuccess}
        </div>
      )}

      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : query.isLoading ? <LoadingBlock lines={8} /> : (
        <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid="section-citation-register">
          <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold"><span className="gg-mono text-[18px]">{query.data?.length ?? 0}</span> sources in register</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block"><Search size={14} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author, DOI" className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3 text-[11px] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] sm:w-56" data-testid="input-search-citations" /></label>
              <label className="relative block"><Filter size={13} className="pointer-events-none absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full appearance-none rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-8 text-[11px] outline-none focus:border-[hsl(var(--ring))] sm:w-40" data-testid="select-citation-status"><option value="all">All signals</option><option value="clear">Clear</option><option value="propagation">Propagation risk</option><option value="corrected">Corrected</option><option value="retracted">Retracted</option></select></label>
            </div>
          </div>
          <div className="hidden grid-cols-[minmax(260px,1fr)_190px_100px] gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] sm:grid"><span>Source</span><span>Signal</span><span>Risk</span></div>
          {citations.length ? citations.map((citation: Citation) => <CitationRow key={citation.id} citation={citation} onSelect={() => setSelected(citation.id)} />) : <EmptyBlock title="No sources match" detail="Try a broader search or return to all signals." action={<Button variant="secondary" onClick={() => { setSearch(''); setStatus('all'); }} testId="button-clear-citation-filters">Clear filters</Button>} />}
        </section>
      )}

      {selectedCitation && (
        <Drawer title="Source inspection & Provenance" onClose={() => setSelected(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusPill value={selectedCitation.status} />
              <div className="mt-4 gg-serif text-[26px] leading-[1.08] font-bold">{selectedCitation.title}</div>
              <p className="mt-3 text-[12px] text-[hsl(var(--muted-foreground))]">{selectedCitation.authors} · {selectedCitation.venue} ({selectedCitation.year})</p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))]">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[hsl(var(--muted)/.65)] p-3">
              <div className="gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Risk level</div>
              <div className="mt-2"><RiskPill risk={selectedCitation.risk} /></div>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)/.65)] p-3">
              <div className="gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">DOI Identifier</div>
              <div className="mt-2 text-[11px] font-bold truncate">{selectedCitation.doi}</div>
            </div>
          </div>

          {/* Decision Inbox Actions inside Drawer */}
          {(selectedCitation.status === 'propagation' || selectedCitation.risk === 'medium') && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 font-bold text-[12px] text-amber-900 dark:text-amber-200">
                <AlertTriangle size={14} /> PI Human Judgment Required
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                Guardian does not decide whether this finding invalidates your work. Choose how this citation relates to your hypothesis:
              </p>
              <textarea
                value={judgmentNotes}
                onChange={(e) => setJudgmentNotes(e.target.value)}
                placeholder="Optional researcher notes / scientific rationale..."
                className="mt-3 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-2 text-[11px] outline-none"
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  onClick={() => handleJudgment(selectedCitation.id, 'relevant')}
                  disabled={judgmentSubmitting === selectedCitation.id}
                  testId="drawer-btn-mark-relevant"
                >
                  Mark Relevant (Quarantine)
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleJudgment(selectedCitation.id, 'not_relevant')}
                  disabled={judgmentSubmitting === selectedCitation.id}
                  testId="drawer-btn-mark-not-relevant"
                >
                  Mark Not Relevant (Safe)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleJudgment(selectedCitation.id, 'deferred')}
                  disabled={judgmentSubmitting === selectedCitation.id}
                  testId="drawer-btn-defer"
                >
                  Defer
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Guardian's Assessment</div>
            <p className="mt-2 text-[12px] leading-relaxed font-medium">{selectedCitation.detail || 'No direct issues detected. Continuous monitoring active.'}</p>
          </div>
          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <div className="mb-3 gg-mono text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Evidence Sequence</div>
            <EvidenceTimeline metadata={(selectedCitation as Citation & { metadata?: EvidenceMetadata }).metadata} doi={selectedCitation.doi} />
          </div>
          <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
            <a href={`https://doi.org/${selectedCitation.doi}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--accent-foreground))] hover:underline" data-testid="link-open-doi">Open DOI on Crossref <ExternalLink size={13} /></a>
          </div>
        </Drawer>
      )}
    </div>
  );
}