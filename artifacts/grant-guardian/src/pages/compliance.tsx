import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Sparkles, X, Download, FileDown, Printer, Copy, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListActivityQueryKey, getListDeadlinesQueryKey, useDraftComplianceReport, useListDeadlines, type Deadline } from '@workspace/api-client-react';
import { Button, DeadlineRow, Drawer, EmptyBlock, ErrorBlock, LoadingBlock, SectionHeading, StatusPill } from '@/components/guardian-ui';
import {
  apiRequest,
  getSubmittedDeadlineIds,
  markDeadlineSubmittedLocal,
  isDeadlineSubmittedLocal,
  addLocalActivity,
  getLocalDeadlines,
  addLocalDeadline,
} from '@/lib/api';
import { useAuth, formatDisplayName } from '@/context/auth-context';

export default function Compliance() {
  const queryClient = useQueryClient();
  const query = useListDeadlines();
  const { user } = useAuth();
  const userSlug = user?.tenantSlug || (user?.id ? String(user.id) : undefined);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(() => getSubmittedDeadlineIds(userSlug));

  useEffect(() => {
    setSubmittedIds(getSubmittedDeadlineIds(userSlug));
  }, [userSlug]);

  const draftMutation = useDraftComplianceReport();
  const [draft, setDraft] = useState<{ id: number; deadlineId: number; title: string; status: string; body: string } | null>(null);
  const [draftError, setDraftError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Deadline form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Regulatory filing');
  const [newDays, setNewDays] = useState('21');
  const [newProgress, setNewProgress] = useState('25');
  const [isAdding, setIsAdding] = useState(false);

  const rawDeadlines = Array.isArray(query.data) ? query.data : [];

  // Merge server deadlines with account-scoped local deadlines
  const allRawDeadlines = useMemo(() => {
    const local = getLocalDeadlines(userSlug);
    if (!local || local.length === 0) return rawDeadlines;
    const merged = [...rawDeadlines];
    for (const item of local) {
      const exists = merged.some((d: any) => d.id === item.id || d.title === item.title);
      if (!exists) {
        merged.push(item);
      }
    }
    return merged;
  }, [rawDeadlines, userSlug]);

  const deadlines = useMemo(() => {
    return allRawDeadlines.map((d: Deadline) => {
      const isSub =
        (d.progress ?? 0) >= 100 ||
        (d.status as string) === 'clear' ||
        (d.status as string) === 'submitted' ||
        submittedIds.has(d.id) ||
        isDeadlineSubmittedLocal(d.id, userSlug);
      if (isSub) {
        return {
          ...d,
          status: 'clear' as const,
          progress: 100,
        };
      }
      return d;
    });
  }, [allRawDeadlines, submittedIds, userSlug]);
  const attention = deadlines.filter((deadline: Deadline) => deadline.status === 'attention').length;

  const draftReport = (id: number) => {
    setDraftError('');
    draftMutation.mutate({ id }, {
      onSuccess: (result: { id: number; deadlineId: number; title: string; status: string; body: string }) => {
        setDraft(result);
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
      },
      onError: () => setDraftError('The report could not be drafted. Try again in a moment.'),
    });
  };

  const handleDownload = (format: 'md' | 'txt' = 'md') => {
    if (!draft) return;
    const cleanTitle = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${cleanTitle || 'compliance-report-draft'}.${format}`;
    const blob = new Blob([draft.body], {
      type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful fallback
    }
  };

  const handlePrintPdf = () => {
    if (!draft) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${draft.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
    h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    pre { background: #f8fafc; padding: 18px; border-radius: 8px; font-size: 13px; border: 1px solid #e2e8f0; white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
    @media print {
      body { padding: 0; }
      pre { border: none; background: transparent; padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${draft.title}</h1>
  <div class="meta">Deadline ID: #${draft.deadlineId} | Generated by Grant Guardian | Manual PI Signoff Enforced</div>
  <pre>${draft.body}</pre>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      const days = parseInt(newDays, 10) || 14;
      const dueDate = new Date(Date.now() + days * 86400000).toISOString();
      const res = await apiRequest('/api/guardian/deadlines', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          dueDate,
          progress: parseInt(newProgress, 10) || 10,
        }),
      });
      if (res.ok) {
        const createdRecord = res.data || {
          id: Date.now(),
          title: newTitle.trim(),
          type: newType,
          dueDate,
          progress: parseInt(newProgress, 10) || 10,
          owner: formatDisplayName(user),
          status: days <= 7 ? 'attention' : days <= 21 ? 'due_soon' : 'on_track',
        };
        addLocalDeadline(createdRecord, userSlug);
        addLocalActivity({
          title: `Compliance track registered: ${newTitle.trim()}`,
          description: `New ${newType} deadline added for PI ${formatDisplayName(user)}. Due in ${days} days.`,
          kind: 'scan',
          tone: 'neutral',
        }, userSlug);

        setNewTitle('');
        setShowAddModal(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
        ]);
      }
    } catch {
      // error handled gracefully
    } finally {
      setIsAdding(false);
    }
  };

  const handleMarkSubmitted = async (id: number) => {
    // 1. Immediately record in localStorage so state is persisted across pages & reloads scoped to user
    markDeadlineSubmittedLocal(id, userSlug);
    setSubmittedIds(new Set(getSubmittedDeadlineIds(userSlug)));

    // 2. Add local activity log so /activity immediately has this milestone
    const target = deadlines.find((d: Deadline) => d.id === id);
    const title = target?.title || 'Compliance milestone';
    const ownerName = formatDisplayName(user);
    addLocalActivity({
      title: `Compliance milestone filed externally: ${title}`,
      description: `Marked officially submitted by PI (${ownerName}) to external sponsor portal. Progress registered at 100%.`,
      kind: 'clear',
      tone: 'success',
    }, userSlug);

    // 3. Optimistically update React Query cache for instant zero-latency UI update
    queryClient.setQueryData(getListDeadlinesQueryKey(), (old: Deadline[] | undefined) => {
      if (!Array.isArray(old)) return old;
      return old.map((d) =>
        d.id === id ? { ...d, status: 'clear' as const, progress: 100 } : d
      );
    });

    // 4. Send persistent PATCH to server with active user credentials
    try {
      await apiRequest(`/api/guardian/deadlines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'on_track',
          progress: 100,
          submitted: true,
        }),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() }),
      ]);
    } catch {
      // LocalStorage and optimistic cache preserve state
    }
  };

  return (
    <div className="gg-stagger space-y-6">
      <SectionHeading
        eyebrow="Regulatory Risk & Sponsor Governance"
        title="Compliance Desk & Milestone Runway"
        description="Continuous oversight of regulatory gates, IRB renewals, NIH/NSF progress reports, and biosafety audits. When paperwork demands preparation, Guardian drafts the initial filing under strict PI supervision."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs text-[hsl(var(--foreground))] shadow-xs">
              <span className={`size-2 rounded-full ${attention ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="font-semibold">{attention ? `${attention} Milestone${attention === 1 ? '' : 's'} Require Attention` : 'All 100% On Track'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              data-testid="button-add-deadline"
            >
              <Plus size={14} />
              <span>Track New Deadline</span>
            </button>
          </div>
        }
      />

      {/* Compliance Metrics Overview - Executive KPI Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--muted)/.15)] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="gg-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-bold">
              Tracked Commitments
            </span>
            <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={12} />
            </span>
          </div>
          <div className="mt-2.5 text-[28px] font-extrabold text-[hsl(var(--foreground))] tabular-nums">{deadlines.length}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] font-medium">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>Active regulatory &amp; grant milestones</span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-b from-rose-500/5 via-[hsl(var(--card))] to-[hsl(var(--card))] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="gg-mono text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
              Immediate Attention
            </span>
            <span className="flex size-6 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Sparkles size={12} />
            </span>
          </div>
          <div className="mt-2.5 text-[28px] font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            {deadlines.filter((d: Deadline) => d.status === 'attention').length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] font-medium">
            <span className="size-1.5 rounded-full bg-rose-500" />
            <span>&lt;14d runway &amp; &lt;80% preparation</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-[hsl(var(--card))] to-[hsl(var(--card))] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="gg-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Upcoming Horizon
            </span>
            <span className="flex size-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <FileDown size={12} />
            </span>
          </div>
          <div className="mt-2.5 text-[28px] font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {deadlines.filter((d: Deadline) => d.status === 'due_soon').length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] font-medium">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>11–21 days preparation window</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 via-[hsl(var(--card))] to-[hsl(var(--card))] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="gg-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              Verified / Submitted
            </span>
            <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check size={12} />
            </span>
          </div>
          <div className="mt-2.5 text-[28px] font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {deadlines.filter((d: Deadline) => d.status === 'on_track' || (d.status as string) === 'submitted').length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Safe runway or officially filed</span>
          </div>
        </div>
      </div>

      {draftError && (
        <div
          className="mb-5 flex items-center justify-between rounded-lg border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] px-4 py-3 text-[11px] text-[hsl(var(--destructive))]"
          data-testid="status-draft-error"
        >
          {draftError}
          <button
            type="button"
            onClick={() => setDraftError('')}
            aria-label="Dismiss error"
            data-testid="button-dismiss-draft-error"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isError ? (
        <ErrorBlock onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <LoadingBlock lines={7} />
      ) : deadlines.length === 0 ? (
        <EmptyBlock
          title="No deadlines in view"
          detail="When compliance dates are connected, Guardian will keep their distance and timeline here."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <section
            className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            data-testid="section-deadline-register"
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
              <div>
                <div className="gg-mono text-[9px] uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">
                  Active register
                </div>
                <h2 className="mt-1 text-[15px] font-bold">{deadlines.length} tracked dates</h2>
              </div>
              <div className="gg-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">
                Sorted by urgency
              </div>
            </div>
            {deadlines
              .slice()
              .sort((a: Deadline, b: Deadline) => a.daysLeft - b.daysLeft)
              .map((deadline: Deadline) => (
                <DeadlineRow
                  key={deadline.id}
                  deadline={deadline}
                  onDraft={() => draftReport(deadline.id)}
                  onMarkSubmitted={() => handleMarkSubmitted(deadline.id)}
                />
              ))}
          </section>
          <aside
            className="h-fit rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-[hsl(var(--foreground))] shadow-xs space-y-4"
            data-testid="card-compliance-note"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
              <FileText size={17} />
            </div>
            <div className="gg-serif text-[24px] leading-[1.05]">
              A good first draft
              <br />
              <em>buys back a day.</em>
            </div>
            <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
              Select “Draft report” on an upcoming deadline. Guardian will use the deadline context to prepare a
              reviewable starting point — never an external submission.
            </p>
            <div className="border-t border-[hsl(var(--border))] pt-4 text-[10px] text-[hsl(var(--muted-foreground))]">
              <div className="flex justify-between items-center">
                <span>Drafts remain private</span>
                <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--muted-foreground))]">
                  LOCAL ONLY
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Add Deadline Modal - Executive Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Plus size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Register Compliance Horizon</h3>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Track institutional filings, sponsor disclosures, or renewal dates.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Milestone / Requirement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIH Conflict of Interest Disclosure, NSF RCR Certification, or IRB Modification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Quick Preset Agency Buttons */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                  Quick Agency Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'NIH Annual RPPR', type: 'Funding report', days: '30' },
                    { label: 'NSF Conflict of Interest', type: 'Ethics disclosure', days: '14' },
                    { label: 'Institutional IRB Renewal', type: 'IRB renewal', days: '21' },
                    { label: 'DOD Export Control Review', type: 'Export control', days: '45' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNewTitle(preset.label);
                        setNewType(preset.type);
                        setNewDays(preset.days);
                      }}
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] hover:bg-[hsl(var(--muted))] px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Category / Authority
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="IRB renewal">IRB renewal</option>
                    <option value="Funding report">Funding report</option>
                    <option value="Data management">Data management</option>
                    <option value="Biosafety audit">Biosafety audit</option>
                    <option value="Material transfer">Material transfer</option>
                    <option value="Ethics disclosure">Ethics disclosure</option>
                    <option value="Export control">Export control</option>
                    <option value="Regulatory filing">Regulatory filing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Days until filing window ({newDays}d)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-2 text-xs font-mono text-[hsl(var(--foreground))] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--foreground))]">
                    Preparation Readiness Gauge
                  </label>
                  <span className="gg-mono text-xs font-bold text-[hsl(var(--foreground))]">
                    {newProgress}% Complete
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(e.target.value)}
                  className="w-full accent-blue-600 h-2 bg-[hsl(var(--muted))] rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[hsl(var(--border))]">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? 'Registering...' : 'Confirm & Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {draftMutation.isPending && (
        <div
          className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-[11px] font-bold shadow-lg"
          data-testid="status-drafting"
        >
          <Sparkles size={15} className="text-slate-500 animate-spin" />
          Assembling a reviewable draft…
        </div>
      )}

      {draft && (
        <Drawer title="Compliance draft · private" onClose={() => setDraft(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusPill value={draft.status} />
              <h2 className="mt-4 gg-serif text-[26px] leading-[1.05]">{draft.title}</h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
              <FileText size={19} />
            </div>
          </div>

          {/* Export & Download Action Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-2.5">
            <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider pl-1 mr-1">
              Export Report:
            </span>
            <button
              type="button"
              onClick={() => handleDownload('md')}
              className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer"
              title="Download as Markdown file (.md)"
              data-testid="btn-download-md"
            >
              <Download size={13} className="text-emerald-500" />
              <span>Download .md</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer"
              title="Download as plain text file (.txt)"
              data-testid="btn-download-txt"
            >
              <FileDown size={13} className="text-blue-500" />
              <span>Download .txt</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer"
              title="Print formatted report or save as PDF"
              data-testid="btn-print-pdf"
            >
              <Printer size={13} className="text-amber-500" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer sm:ml-auto"
              title="Copy report text to clipboard"
              data-testid="btn-copy-report"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-[hsl(var(--muted-foreground))]" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          {/* Context Inputs Feeding the Drafter - subtle cards */}
          <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="gg-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--foreground))]">
                Deterministic Context Inputs
              </span>
              <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--muted-foreground))]">
                Article IV Enforced
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Target Deadline ID:</span>
                <strong className="font-mono">#{draft.deadlineId}</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Preparation Readiness:</span>
                <strong className="font-mono text-[hsl(var(--foreground))]">Audit artifacts collected</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">Safe Policy:</span>
                <strong className="text-[hsl(var(--foreground))]">Zero Autonomous Submissions</strong>
              </div>
              <div className="rounded bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-2">
                <span className="text-[hsl(var(--muted-foreground))] block">PI Authority:</span>
                <strong className="text-[hsl(var(--foreground))]">Manual Signoff Required</strong>
              </div>
            </div>
          </div>

          <div
            className="mt-6 whitespace-pre-wrap border-t border-[hsl(var(--border))] pt-6 text-[12px] leading-[1.7]"
            data-testid="text-draft-body"
          >
            {draft.body}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Review before sharing externally. Guardian never auto-submits.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload('md')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3.5 py-2 text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                data-testid="btn-download-footer"
              >
                <Download size={13} />
                <span>Download Report (.md)</span>
              </button>
              <Button variant="secondary" onClick={() => setDraft(null)} testId="button-close-draft">
                Done
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}