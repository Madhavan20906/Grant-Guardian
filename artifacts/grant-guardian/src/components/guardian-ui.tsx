import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity as ActivityIcon,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  FileText,
  Gauge,
  Menu,
  Play,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
  UserPlus,
  LogIn,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
  XCircle,
} from 'lucide-react';
import type { Activity, Citation, Deadline } from '@workspace/api-client-react';
import { useAuth } from '@/context/auth-context';
import { usePersona } from '@/context/persona-context';
import { useTheme } from '@/context/theme-context';

export const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ');

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx('flex items-center gap-3', compact && 'gap-2')} data-testid="brand-grant-guardian">
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xs">
        <ShieldCheck size={18} strokeWidth={2.2} />
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-emerald-400" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>GrantGuardian</span>
          </div>
          <div className="text-[9.5px] font-medium tracking-wide text-slate-400">Research lab governance</div>
        </div>
      )}
    </div>
  );
}

const navItems = [
  { href: '/', label: 'Overview', icon: Gauge },
  { href: '/citations', label: 'Citation health', icon: BookOpen },
  { href: '/compliance', label: 'Compliance desk', icon: ClipboardCheck },
  { href: '/activity', label: 'Decision log', icon: ActivityIcon },
  { href: '/settings', label: 'Workspace', icon: Settings2 },
];

export function PersonaSwitcher() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    logout();
    setLocation('/auth');
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Profile summary badge */}
      <div className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs text-white shadow-xs">
        <span className="flex size-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 text-[10px] font-black">
          🛡️
        </span>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[11px] font-bold text-slate-100">
            {user.title && user.title.includes(user.name) ? user.title : `${user.title ? user.title + ' ' : ''}${user.name}`}
          </span>
          <span className="font-mono text-[9px] text-slate-400">{user.email}</span>
        </div>
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
          PI / LAB
        </span>
      </div>

      {/* Only Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors shadow-2xs cursor-pointer"
        data-testid="button-sign-out"
        title="Sign Out of Laboratory Account"
      >
        <LogOut size={13} className="shrink-0" />
        <span className="text-[11px]">Sign Out</span>
      </button>
    </div>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cx(
        'flex items-center justify-center rounded-full transition-all shadow-xs',
        compact
          ? 'size-7 p-1 text-[hsl(var(--sidebar-foreground))] border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] hover:bg-[hsl(var(--sidebar-accent)/.8)]'
          : 'gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[hsl(var(--foreground))] border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]'
      )}
      data-testid="button-theme-toggle"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={14} className="text-amber-400" />
          {!compact && <span className="hidden xl:inline text-[10px] text-[hsl(var(--muted-foreground))]">Light</span>}
        </>
      ) : (
        <>
          <Moon size={14} className="text-indigo-600 dark:text-indigo-400" />
          {!compact && <span className="hidden xl:inline text-[10px] text-[hsl(var(--muted-foreground))]">Dark</span>}
        </>
      )}
    </button>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const { activePersona } = usePersona();
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-[hsl(var(--primary)/.45)] md:hidden" data-testid="button-close-navigation" />}
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-[248px] -translate-x-full flex-col border-r border-slate-800/80 bg-[#0f172a] px-4 py-5 transition-transform md:translate-x-0', open && 'translate-x-0')} data-testid="sidebar-navigation">
        <div className="px-2"><LogoMark /></div>
        <div className="font-mono mt-9 px-3 text-[9px] font-semibold uppercase tracking-[.22em] text-slate-500">CONTROL ROOM</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose} className={cx('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-all', active ? 'bg-slate-800/90 text-amber-300 font-semibold shadow-xs border-l-2 border-amber-400 -ml-[2px] pl-[14px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={16} strokeWidth={active ? 2.2 : 1.7} className={active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'} />
                <span>{label}</span>
                {label === 'Citation health' && (
                  <span className="ml-auto rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400 border border-amber-500/20">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">FLEET STATUS</div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              All systems nominal
            </div>
            <div className="font-mono mt-1 text-[9.5px] text-slate-400">AWS Bedrock · us-east-1</div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-slate-800/80 px-1 pt-3.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200">
              {activePersona.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold text-slate-200">
                {activePersona.name}
              </div>
              <div className="font-mono truncate text-[9px] text-slate-400">
                {activePersona.role}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle compact />
              <Link href="/settings" className="text-slate-400 hover:text-slate-200 p-1" data-testid="link-profile-settings"><Settings2 size={14} /></Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const [location, setLocation] = useLocation();
  const { activePersona } = usePersona();
  const current = navItems.find((item) => item.href !== '/' && location.startsWith(item.href)) ?? navItems[0];
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-5 backdrop-blur md:px-9" data-testid="topbar">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button>
        <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[.16em] text-slate-400 sm:flex">
          <span className="font-mono font-medium text-slate-500">GRANTGUARDIAN</span>
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{current.label}</span>
        </div>
        <div className="text-[13px] font-bold sm:hidden">{current.label}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <PersonaSwitcher />
        <ThemeToggle />
        <button type="button" onClick={() => setLocation('/activity')} className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Open notifications" data-testid="button-open-notifications">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-500" />
        </button>
      </div>
    </header>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((current) => !current);
  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-[248px]">
        <TopBar onMenu={toggleSidebar} />
        <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9">{children}</main>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="gg-mono mb-2 text-[10px] font-medium uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">{eyebrow}</div><h1 className="gg-serif text-[clamp(2rem,4vw,3.2rem)] leading-[.95] tracking-[-.04em]">{title}</h1>{description && <p className="mt-3 max-w-[580px] text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', className, onClick, disabled, type = 'button', testId }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; className?: string; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; testId?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={cx('inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2.5 text-[11px] font-bold transition-all active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50', variant === 'primary' && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/.88)]', variant === 'secondary' && 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]', variant === 'ghost' && 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]', variant === 'danger' && 'border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.15)]', className)} data-testid={testId}>{children}</button>;
}

export function StatusPill({ value, kind = 'citation' }: { value: string; kind?: 'citation' | 'deadline' | 'tone' }) {
  const map: Record<string, { label: string; className: string }> = {
    clear: { label: 'Clear', className: 'bg-[hsl(var(--accent)/.25)] text-[hsl(155_35%_27%)]' },
    retracted: { label: 'Retracted', className: 'bg-[hsl(var(--destructive)/.13)] text-[hsl(var(--destructive))]' },
    corrected: { label: 'Corrected', className: 'bg-[hsl(35_76%_61%/.2)] text-[hsl(25_62%_35%)]' },
    propagation: { label: 'Propagation risk', className: 'bg-[hsl(186_36%_48%/.17)] text-[hsl(186_45%_30%)]' },
    on_track: { label: 'On track', className: 'bg-[hsl(var(--accent)/.25)] text-[hsl(155_35%_27%)]' },
    due_soon: { label: 'Due soon', className: 'bg-[hsl(35_76%_61%/.2)] text-[hsl(25_62%_35%)]' },
    attention: { label: 'Needs attention', className: 'bg-[hsl(var(--destructive)/.13)] text-[hsl(var(--destructive))]' },
    neutral: { label: 'Recorded', className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' },
    success: { label: 'Cleared', className: 'bg-[hsl(var(--accent)/.25)] text-[hsl(155_35%_27%)]' },
    warning: { label: 'Review', className: 'bg-[hsl(35_76%_61%/.2)] text-[hsl(25_62%_35%)]' },
    danger: { label: 'Escalated', className: 'bg-[hsl(var(--destructive)/.13)] text-[hsl(var(--destructive))]' },
  };
  const item = map[value] ?? { label: value.replaceAll('_', ' '), className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' };
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em]', item.className)} data-testid={`status-${kind}-${value}`}><span className="size-1.5 rounded-full bg-current" />{item.label}</span>;
}

export function RiskPill({ risk }: { risk: string }) {
  return <span className={cx('gg-mono text-[9px] uppercase tracking-[.1em]', risk === 'high' ? 'text-[hsl(var(--destructive))]' : risk === 'medium' ? 'text-[hsl(25_62%_35%)]' : 'text-[hsl(var(--muted-foreground))]')} data-testid={`status-risk-${risk}`}>{risk} risk</span>;
}

export function LoadingBlock({ lines = 4 }: { lines?: number }) {
  return <div className="animate-pulse space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid="state-loading">{Array.from({ length: lines }).map((_, i) => <div key={i} className={cx('h-3 rounded bg-[hsl(var(--muted))]', i % 3 === 0 ? 'w-2/5' : i % 3 === 1 ? 'w-full' : 'w-4/5')} />)}</div>;
}

export function ErrorBlock({ onRetry, message = 'Guardian could not retrieve this desk right now.' }: { onRetry: () => void; message?: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-5" data-testid="state-error"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 text-[hsl(var(--destructive))]" size={18} /><div><div className="text-[12px] font-bold">A quiet moment of uncertainty</div><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{message}</p></div></div><Button variant="secondary" onClick={onRetry} testId="button-retry">Retry</Button></div>;
}

export function EmptyBlock({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] p-6 text-center" data-testid="state-empty"><div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[hsl(var(--accent)/.25)] text-[hsl(var(--accent-foreground))]"><Sparkles size={17} /></div><h3 className="text-[13px] font-bold">{title}</h3><p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
  icon: Icon = CircleDot,
  sparklineData,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  icon?: typeof CircleDot;
  sparklineData?: number[];
}) {
  return (
    <div
      className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_hsl(var(--primary)/.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
      data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="flex items-start justify-between">
        <span className="gg-mono text-[9px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
        <Icon
          size={16}
          className={
            tone === 'danger'
              ? 'text-[hsl(var(--destructive))]'
              : tone === 'warning'
              ? 'text-[hsl(35_70%_43%)]'
              : tone === 'success'
              ? 'text-[hsl(155_35%_35%)]'
              : 'text-[hsl(var(--muted-foreground))]'
          }
        />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[28px] font-extrabold tracking-[-.06em] leading-none">{value}</div>
          <div className="mt-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">{detail}</div>
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-6 w-16 opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 64 24" className="h-full w-full overflow-visible">
              <path
                d={`M 0 ${24 - sparklineData[0] * 3} ${sparklineData
                  .slice(1)
                  .map((d, i) => `L ${(i + 1) * (64 / (sparklineData.length - 1))} ${Math.max(2, 22 - d * 3)}`)
                  .join(' ')}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={
                  tone === 'danger'
                    ? 'text-[hsl(var(--destructive))]'
                    : tone === 'warning'
                    ? 'text-[hsl(35_70%_43%)]'
                    : 'text-[hsl(var(--accent-foreground))]'
                }
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityRow({ item }: { item: Activity }) {
  const icons = { scan: RefreshCw, flagged: AlertTriangle, escalation: AlertCircle, draft: FileText, clear: CheckCircle2 };
  const Icon = icons[item.kind as keyof typeof icons] ?? ActivityIcon;
  return <div className="flex gap-3 border-b border-[hsl(var(--border)/.7)] py-3.5 last:border-0" data-testid={`row-activity-${item.id}`}><div className={cx('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', item.tone === 'danger' ? 'bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))]' : item.tone === 'warning' ? 'bg-[hsl(35_76%_61%/.18)] text-[hsl(25_62%_35%)]' : item.tone === 'success' ? 'bg-[hsl(var(--accent)/.25)] text-[hsl(155_35%_27%)]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]')}><Icon size={14} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><div className="text-[11px] font-bold">{item.title}</div><time className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))]">{item.timestamp}</time></div><p className="mt-1 text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">{item.description}</p></div></div>;
}

export function CitationRow({ citation, onSelect }: { citation: Citation; onSelect?: () => void }) {
  return <button type="button" onClick={onSelect} className="group flex w-full items-center gap-3 border-b border-[hsl(var(--border)/.7)] px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--muted)/.5)]" data-testid={`row-citation-${citation.id}`}><div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--secondary)/.55)] text-[hsl(var(--secondary-foreground))]"><BookOpen size={13} /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold group-hover:text-[hsl(var(--accent-foreground))]">{citation.title}</div><div className="mt-1 truncate text-[10px] text-[hsl(var(--muted-foreground))]">{citation.authors} · {citation.venue} · {citation.year}</div></div><div className="hidden w-28 shrink-0 sm:block"><StatusPill value={citation.status} /><RiskPill risk={citation.risk} /></div><ArrowUpRight className="shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" size={15} /></button>;
}

export function DeadlineRow({
  deadline,
  onDraft,
  onMarkSubmitted,
}: {
  deadline: Deadline;
  onDraft: () => void;
  onMarkSubmitted?: () => void;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isUrgentTrigger = deadline.daysLeft <= 14 && (deadline.progress ?? 0) < 80;

  return (
    <div
      className="border-b border-[hsl(var(--border)/.7)] p-4 sm:p-5 last:border-0 hover:bg-[hsl(var(--muted)/.25)] transition-colors"
      data-testid={`row-deadline-${deadline.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="gg-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] font-bold">
              {deadline.type}
            </span>
            <StatusPill value={isSubmitted ? 'clear' : deadline.status} kind="deadline" />
            {isUrgentTrigger && !isSubmitted && (
              <span className="rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--foreground))] flex items-center gap-1">
                ⚡ 14-Day Trigger Active (&lt;80% prep)
              </span>
            )}
            {isSubmitted && (
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ PI Signed &amp; Filed Externally
              </span>
            )}
          </div>
          <div className="mt-1.5 text-[14px] font-bold text-[hsl(var(--foreground))]">{deadline.title}</div>
          <div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
            Owner: {deadline.owner} · Due {deadline.dueDate}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
          <div className="text-right">
            <span className="gg-mono text-[15px] font-extrabold text-[hsl(var(--foreground))]">
              {deadline.daysLeft}d
            </span>
            <span className="ml-1 text-[10px] text-[hsl(var(--muted-foreground))] font-medium">remaining</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clean theme-blended Draft Report Button */}
            {!isSubmitted && (
              <button
                type="button"
                onClick={onDraft}
                className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold px-3 py-1.5 text-[11px] hover:opacity-90 shadow-2xs cursor-pointer transition-all shrink-0"
                data-testid={`button-draft-${deadline.id}`}
                title="Generate AI compliance draft using deadline & lab context"
              >
                <Sparkles size={13} />
                <span>Draft report</span>
              </button>
            )}

            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(true);
                  if (onMarkSubmitted) onMarkSubmitted();
                }}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] px-2.5 py-1.5 text-[10px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Mark this deadline officially submitted by PI to external agency portal"
              >
                Mark Submitted
              </button>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Filed</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar with Soft Colors Blending Into Background */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1">
            <span className="font-bold text-[hsl(var(--foreground))]">Preparation Readiness:</span> {deadline.progress ?? 0}%
            <span className="text-[9px] opacity-75">(audit artifacts &amp; narrative completeness, not time elapsed)</span>
          </span>
          <span className="gg-mono font-bold text-[hsl(var(--foreground))]">{isSubmitted ? 100 : (deadline.progress ?? 0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div
            className="h-full rounded-full transition-all bg-slate-700 dark:bg-slate-300"
            style={{ width: `${Math.min(100, isSubmitted ? 100 : (deadline.progress ?? 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ScanButton({ isPending, onClick }: { isPending: boolean; onClick: () => void }) {
  return <Button onClick={onClick} disabled={isPending} testId="button-run-scan">{isPending ? <><RefreshCw size={14} className="animate-spin" />Scanning desk</> : <><Play size={13} fill="currentColor" />Run scan</>}</Button>;
}

export function Drawer({
  title,
  children,
  onClose,
  initialCentered = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialCentered?: boolean;
}) {
  const [isCentered, setIsCentered] = useState(initialCentered);

  return (
    <div
      className={cx(
        'fixed inset-0 z-50 flex bg-slate-950/80 backdrop-blur-sm transition-all duration-300',
        isCentered ? 'items-center justify-center p-4 sm:p-6' : 'justify-end'
      )}
      role="dialog"
      aria-modal="true"
      data-testid="drawer-detail"
    >
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close detail"
        data-testid="button-close-drawer"
      />

      {/* Main Drawer/Modal Container */}
      <div
        className={cx(
          'relative flex h-full transition-all duration-300 z-10',
          isCentered
            ? 'w-full max-w-5xl max-h-[92vh] my-auto'
            : 'w-full max-w-[580px]'
        )}
      >
        {/* Left-Side Push Button - Placed outside the scroll container to ensure 100% visibility */}
        {!isCentered && (
          <div className="absolute -left-11 top-20 z-50">
            <button
              type="button"
              onClick={() => setIsCentered(true)}
              className="group flex flex-col items-center justify-center gap-2 rounded-l-xl border-y border-l border-amber-500 bg-slate-900 px-2.5 py-4 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-slate-800 hover:text-white cursor-pointer transition-all"
              title="Push to Center for expanded visibility"
              data-testid="button-push-to-center"
            >
              <ArrowLeft size={18} className="animate-pulse text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[9px] font-extrabold tracking-widest uppercase text-amber-300">
                Push Center
              </span>
            </button>
          </div>
        )}

        {/* When Centered: Right-Side Dock Button to smoothly return to side */}
        {isCentered && (
          <div className="absolute -right-11 top-20 z-50 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsCentered(false)}
              className="group flex flex-col items-center justify-center gap-2 rounded-r-xl border-y border-r border-amber-500 bg-slate-900 px-2.5 py-4 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-slate-800 hover:text-white cursor-pointer transition-all"
              title="Dock back to right sidebar"
              data-testid="button-dock-to-side"
            >
              <ArrowRight size={18} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[9px] font-extrabold tracking-widest uppercase text-amber-300">
                Dock Side
              </span>
            </button>
          </div>
        )}

        <section
          className={cx(
            'relative h-full w-full overflow-y-auto bg-[hsl(var(--card))] shadow-2xl transition-all duration-300 flex flex-col',
            isCentered
              ? 'rounded-2xl border border-slate-700 p-6 sm:p-8'
              : 'border-l border-[hsl(var(--border))] p-6'
          )}
        >
          {/* Header Bar with explicit Center/Dock button */}
          <div className="mb-5 flex items-center justify-between border-b border-[hsl(var(--border))] pb-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="gg-mono text-[11px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">
                {title}
              </div>
              <button
                type="button"
                onClick={() => setIsCentered(!isCentered)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors shadow-2xs cursor-pointer"
                title={isCentered ? 'Dock back to right sidebar' : 'Push AI investigation to center stage'}
                data-testid="button-toggle-center"
              >
                {isCentered ? (
                  <>
                    <ArrowRight size={13} className="text-amber-400" />
                    <span>Dock to Side</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft size={13} className="text-amber-400 animate-pulse" />
                    <span>Push to Center</span>
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              aria-label="Close detail panel"
              data-testid="button-close-detail"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex-1">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}