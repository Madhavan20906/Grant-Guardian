import { useState } from 'react';
import {
  ShieldCheck,
  Search,
  BookOpen,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Sparkles,
  Layers,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { usePersona } from '@/context/persona-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListCitationsQueryKey,
  getGetGuardianOverviewQueryKey,
  getListActivityQueryKey,
} from '@workspace/api-client-react';

interface OnboardingEmptyStateProps {
  onImportClick?: () => void;
}

export function OnboardingEmptyState({ onImportClick }: OnboardingEmptyStateProps) {
  const { selectPersona, openAuthModal } = useAuth();
  const queryClient = useQueryClient();
  const [quickDoi, setQuickDoi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddDoi = async (e: React.FormEvent) => {
    e.preventDefault();
    const doi = quickDoi.trim();
    if (!doi) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/guardian/citations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `DOI: ${doi}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback({
          type: 'success',
          message: `Successfully registered DOI ${doi}. Running autonomous integrity scan...`,
        });
        setQuickDoi('');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
        // Trigger a background scan
        fetch('/api/guardian/scan', { method: 'POST' }).then(() => {
          queryClient.invalidateQueries();
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Unable to parse this DOI. Please check the format (e.g., 10.1038/nature13358).',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error communicating with Guardian API server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleDoi = (sampleDoi: string) => {
    setQuickDoi(sampleDoi);
  };

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/.7)] p-6 md:p-8 shadow-sm space-y-8" data-testid="onboarding-empty-state">
      {/* Header section */}
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
          <ShieldCheck size={13} />
          <span>FIRST-TIME SETUP & ONBOARDING</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[hsl(var(--foreground))]">
          Welcome to Grant Guardian.
        </h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Your proposal’s scientific validity depends on the foundational literature it cites. Grant Guardian continuously watches your bibliography against publisher errata, Retraction Watch signals, and 2nd-order citation networks—alerting you only when genuine risks require your domain judgment.
        </p>
      </div>

      {/* 3-Step Architecture Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-blue-500/15 text-[10px]">1</span>
            <span>Ingest Literature</span>
          </div>
          <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
            Track Proposal Citations
          </h3>
          <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Import BibTeX files or individual DOIs for papers cited in your specific aims, methodologies, and preliminary data sections.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-purple-500/15 text-[10px]">2</span>
            <span>Autonomous Watch</span>
          </div>
          <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
            Multi-Hop Graph Traversal
          </h3>
          <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Overnight sweeps verify Crossref metadata and traverse 1-hop reference trees to catch hidden retractions in foundational papers.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px]">3</span>
            <span>Proof of Restraint</span>
          </div>
          <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
            Human Decision Inbox
          </h3>
          <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Guardian never auto-flags 2nd-order papers as retracted. Ambiguities are routed for your PI signoff. Compliance drafts are never auto-submitted.
          </p>
        </div>
      </div>

      {/* Quick Add DOI Form */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500" />
            Track Your First Citation
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Enter a DOI to register a paper and initiate an immediate live verification sweep:
          </p>
        </div>

        <form onSubmit={handleAddDoi} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={quickDoi}
            onChange={(e) => setQuickDoi(e.target.value)}
            placeholder="Paste a DOI (e.g. 10.1038/nature13358 or 10.1038/s41586-021-03819-2)..."
            className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500 focus:outline-none"
            data-testid="input-onboarding-doi"
          />
          <button
            type="submit"
            disabled={isSubmitting || !quickDoi.trim()}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shrink-0"
            data-testid="btn-onboarding-add-doi"
          >
            {isSubmitting ? 'Registering...' : 'Track & Scan'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span>Quick Benchmark Tests:</span>
          <button
            type="button"
            onClick={() => loadSampleDoi('10.1038/nature13358')}
            className="rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-red-600 dark:text-red-400 hover:border-red-500"
          >
            10.1038/nature13358 (STAP Retraction)
          </button>
          <button
            type="button"
            onClick={() => loadSampleDoi('10.1016/j.stem.2015.01.002')}
            className="rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-400 hover:border-amber-500"
          >
            10.1016/j.stem.2015.01.002 (Lin 2nd-Order Risk)
          </button>
          <button
            type="button"
            onClick={() => loadSampleDoi('10.1038/s41586-021-03819-2')}
            className="rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
          >
            10.1038/s41586-021-03819-2 (AlphaFold Clean)
          </button>
        </div>

        {feedback && (
          <div
            className={`rounded-lg p-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Or Explore with Seeded Lab Personas */}
      <div className="pt-4 border-t border-[hsl(var(--border))] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Multi-Tenant Sandboxes & Custom Labs
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Explore field-specific templates or register an isolated workspace for your own proposal.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all self-start sm:self-auto"
          >
            <UserPlus size={13} />
            Create Your Lab Account
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => selectPersona('elena')}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">Dr. Elena Rossi</span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">Biomaterials & Tissue Eng.</div>
            <div className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-mono">1 Retraction • 1 Propagation</div>
          </button>

          <button
            type="button"
            onClick={() => selectPersona('marcus')}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">Dr. Marcus Chen</span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">Computational Oncology</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-mono">Duke Microarray Trial</div>
          </button>

          <button
            type="button"
            onClick={() => selectPersona('sarah')}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">Dr. Sarah Jenkins</span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">Translational Genomics</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono">NIH R21 Active Watch</div>
          </button>
        </div>
      </div>
    </div>
  );
}
