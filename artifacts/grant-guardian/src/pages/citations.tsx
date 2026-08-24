import { useMemo, useState } from 'react';
import { ExternalLink, Filter, Search, ShieldAlert } from 'lucide-react';
import { useListCitations, type Citation } from '@workspace/api-client-react';
import { CitationRow, Drawer, EmptyBlock, ErrorBlock, RiskPill, SectionHeading, StatusPill, LoadingBlock, Button } from '@/components/guardian-ui';
import { EvidenceTimeline, type EvidenceMetadata } from '@/components/evidence-timeline';

export default function Citations() {
  const query = useListCitations();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);
  const citations = useMemo(() => (query.data ?? []).filter((citation: Citation) => {
    const matchesSearch = `${citation.title} ${citation.authors} ${citation.venue} ${citation.doi}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || citation.status === status);
  }), [query.data, search, status]);
  const selectedCitation = (query.data ?? []).find((citation: Citation) => citation.id === selected);

  return (
    <div className="gg-stagger">
      <SectionHeading eyebrow="Citation integrity" title="Citation health" description="A live register of the sources your work leans on. Guardian watches the literature so you can stay focused on the argument." action={<div className="flex items-center gap-2 rounded-md bg-[hsl(var(--accent)/.2)] px-3 py-2 text-[10px] font-bold text-[hsl(var(--accent-foreground))]"><span className="size-1.5 rounded-full bg-current" />Watching continuously</div>} />
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
        <Drawer title="Source inspection" onClose={() => setSelected(null)}>
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