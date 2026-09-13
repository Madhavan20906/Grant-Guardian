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
import { useAuth, formatDisplayName } from '@/context/auth-context';
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
  const { user, isAuthenticated, selectPersona, openAuthModal } = useAuth();
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

  const handleLoadBenchmark = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/guardian/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'biomaterials' }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback({
          type: 'success',
          message: data.message || 'Successfully loaded 12 citations and 8 compliance deadlines into your workspace!',
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ['guardian', 'watch', 'status'] }),
        ]);
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to load benchmark citations into this workspace.',
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

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8 shadow-xs space-y-8" data-testid="onboarding-empty-state">
      {/* Header section */}
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1 text-[11px] font-bold text-[hsl(var(--foreground))]">
          <ShieldCheck size={13} className="text-[hsl(var(--muted-foreground))]" />
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
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--foreground))]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] border border-[hsl(var(--border))]">1</span>
            <span>Ingest Literature</span>
          </div>
          <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
            Track Proposal Citations
          </h3>
          <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Import BibTeX files or individual DOIs for papers cited in your specific aims, methodologies, and preliminary data sections.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--foreground))]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] border border-[hsl(var(--border))]">2</span>
            <span>Autonomous Watch</span>
          </div>
          <h3 className="text-[13px] font-bold text-[hsl(var(--foreground))]">
            Multi-Hop Graph Traversal
          </h3>
          <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Overnight sweeps verify Crossref metadata and traverse 1-hop reference trees to catch hidden retractions in foundational papers.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--foreground))]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] border border-[hsl(var(--border))]">3</span>
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

      {/* 1-Click Populate Proposal Benchmark Banner */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            <Sparkles size={12} />
            <span>INSTANT BENCHMARK INITIALIZATION</span>
          </div>
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
            Load Complete Biomaterials Benchmark (12 Citations & 8 Deadlines)
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xl">
            Populate your account with an authentic grant proposal bibliography containing 1 direct retraction (STAP protocol), 1 propagation risk (Lin et al.), and 10 clean citations for immediate testing.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadBenchmark}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 px-4 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
          data-testid="btn-load-benchmark-workspace"
        >
          <Sparkles size={13} />
          <span>{isSubmitting ? 'Loading Benchmark...' : 'Load 12 Citations into Workspace'}</span>
        </button>
      </div>

      {/* Quick Add DOI Form */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <BookOpen size={16} className="text-[hsl(var(--muted-foreground))]" />
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
            className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--border))] focus:outline-none"
            data-testid="input-onboarding-doi"
          />
          <button
            type="submit"
            disabled={isSubmitting || !quickDoi.trim()}
            className="rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
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
            className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)]"
          >
            10.1038/nature13358 (STAP Retraction)
          </button>
          <button
            type="button"
            onClick={() => loadSampleDoi('10.1016/j.stem.2015.01.002')}
            className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)]"
          >
            10.1016/j.stem.2015.01.002 (Lin 2nd-Order Risk)
          </button>
          <button
            type="button"
            onClick={() => loadSampleDoi('10.1038/s41586-021-03819-2')}
            className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[10px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)]"
          >
            10.1038/s41586-021-03819-2 (AlphaFold Clean)
          </button>
        </div>

        {feedback && (
          <div
            className="rounded-lg p-3 text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Or Explore with Seeded Lab Personas / Benchmarks */}
      <div className="pt-4 border-t border-[hsl(var(--border))] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {isAuthenticated ? 'Load Benchmark Datasets into Your Workspace' : 'Multi-Tenant Sandboxes & Custom Labs'}
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              {isAuthenticated
                ? `Populate ${formatDisplayName(user)}'s workspace with real multi-hop retracted citations and compliance milestones.`
                : 'Explore field-specific templates or register an isolated workspace for your own proposal.'}
            </p>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace: {formatDisplayName(user)}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all self-start sm:self-auto"
            >
              <UserPlus size={13} />
              Create Your Lab Account
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={async () => {
              if (isAuthenticated) {
                await handleLoadBenchmark();
              } else {
                selectPersona('elena');
              }
            }}
            disabled={isSubmitting}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">
                {isAuthenticated ? 'Biomaterials & Tissue Eng. (12 Citations)' : 'Dr. Elena Rossi'}
              </span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {isAuthenticated ? `Seed into ${user.name}'s Lab` : 'Biomaterials & Tissue Eng.'}
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-mono">1 Retraction • 1 Propagation</div>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (isAuthenticated) {
                setIsSubmitting(true);
                setFeedback(null);
                try {
                  const res = await fetch('/api/guardian/seed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ template: 'oncology' }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setFeedback({
                      type: 'success',
                      message: data.message || `Loaded benchmark dataset into ${formatDisplayName(user)}'s workspace!`,
                    });
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: getListCitationsQueryKey() }),
                      queryClient.invalidateQueries({ queryKey: getGetGuardianOverviewQueryKey() }),
                      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
                      queryClient.invalidateQueries({ queryKey: ['guardian', 'watch', 'status'] }),
                    ]);
                  }
                } catch {
                  setFeedback({ type: 'error', message: 'Failed to populate template.' });
                } finally {
                  setIsSubmitting(false);
                }
              } else {
                selectPersona('marcus');
              }
            }}
            disabled={isSubmitting}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">
                {isAuthenticated ? 'Computational Oncology Benchmark' : 'Dr. Marcus Chen'}
              </span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {isAuthenticated ? `Seed into ${user.name}'s Lab` : 'Computational Oncology'}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-mono">Duke Microarray Trial</div>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (isAuthenticated) {
                await handleLoadBenchmark();
              } else {
                selectPersona('sarah');
              }
            }}
            disabled={isSubmitting}
            className="text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 hover:border-blue-500 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[hsl(var(--foreground))] group-hover:text-blue-500">
                {isAuthenticated ? 'Translational Genomics Benchmark' : 'Dr. Sarah Jenkins'}
              </span>
              <ArrowRight size={12} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {isAuthenticated ? `Seed into ${user.name}'s Lab` : 'Translational Genomics'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono">NIH R21 Active Watch</div>
          </button>
        </div>
      </div>
    </div>
  );
}
