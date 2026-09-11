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
  X,
  XCircle,
} from 'lucide-react';
import type { Activity, Citation, Deadline } from '@workspace/api-client-react';
import { usePersona } from '@/context/persona-context';
import { useTheme } from '@/context/theme-context';

export const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ');

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx('flex items-center gap-3', compact && 'gap-2')} data-testid="brand-grant-guardian">
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--primary))] shadow-[3px_3px_0_hsl(var(--accent)/.2)]">
        <ShieldCheck size={20} strokeWidth={2.4} />
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[hsl(var(--destructive))]" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-[-.04em] text-[hsl(var(--sidebar-foreground))]">Grant</div>
          <div className="gg-mono mt-1 text-[9px] font-medium uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.52)]">Guardian</div>
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
  const { activePersona, personas, selectPersona } = usePersona();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/10 px-3 py-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all"
        data-testid="button-persona-switcher"
        title="Switch active research persona"
      >
        <span className="flex size-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-extrabold text-white">
          {activePersona.initials}
        </span>
        <span className="hidden sm:inline font-bold">{activePersona.title}</span>
        <span className="hidden xl:inline text-[10px] opacity-75 font-normal">· {activePersona.lab.split('&')[0]}</span>
        <ChevronDown size={13} className={cx('transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-[hsl(var(--border))] mb-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                <span>Research Personas</span>
                <span className="rounded bg-purple-500/20 px-1 text-purple-400">Multi-Tenant</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                Select persona or pass <code className="text-purple-400">?user=slug</code>
              </p>
            </div>
            <div className="space-y-1">
              {personas.map((p) => {
                const selected = p.slug === activePersona.slug;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => {
                      selectPersona(p.slug);
                      setOpen(false);
                    }}
                    className={cx(
                      'w-full flex items-start gap-2.5 rounded-lg p-2 text-left transition-colors',
                      selected
                        ? 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30'
                        : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                    )}
                    data-testid={`option-persona-${p.slug}`}
                  >
                    <div
                      className={cx(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5',
                        selected
                          ? 'bg-purple-600 text-white'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                      )}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[11px] font-bold leading-tight">
                        <span>{p.title}</span>
                        {selected && <Check size={13} className="text-purple-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                        {p.lab}
                      </div>
                      <div className="text-[9px] text-[hsl(var(--muted-foreground)/.7)] truncate italic">
                        {p.focus}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
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
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-[248px] -translate-x-full flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 transition-transform md:translate-x-0', open && 'translate-x-0')} data-testid="sidebar-navigation">
        <div className="px-2"><LogoMark /></div>
        <div className="gg-mono mt-12 px-3 text-[9px] font-medium uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.36)]">Research operations</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose} className={cx('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-colors', active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/.62)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
                {label === 'Citation health' && <span className="ml-auto rounded-full bg-[hsl(var(--destructive)/.16)] px-1.5 py-0.5 gg-mono text-[9px] text-[hsl(var(--destructive))]">3</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-5 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.65)] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--sidebar-foreground))]"><span className="size-1.5 animate-[gg-pulse_2s_ease-in-out_infinite] rounded-full bg-[hsl(var(--sidebar-primary))]" />Guardian is watching</div>
            <p className="mt-2 text-[10px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.5)]">Last sweep completed <span className="text-[hsl(var(--sidebar-foreground)/.8)]">12 min ago</span>.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-[hsl(var(--sidebar-border))] px-2 pt-4">
            <div className="flex size-8 items-center justify-center rounded-full bg-purple-600 text-[11px] font-bold text-white">
              {activePersona.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold text-[hsl(var(--sidebar-foreground))]">
                {activePersona.name}
              </div>
              <div className="gg-mono mt-0.5 truncate text-[9px] text-[hsl(var(--sidebar-foreground)/.42)]">
                {activePersona.role} · {activePersona.lab.split('&')[0]}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle compact />
              <Link href="/settings" className="text-[hsl(var(--sidebar-foreground)/.45)] hover:text-[hsl(var(--sidebar-foreground))]" data-testid="link-profile-settings"><Settings2 size={15} /></Link>
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
    <header className="flex h-[72px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur md:px-9" data-testid="topbar">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] md:hidden" aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button>
        <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))] sm:flex"><span className="gg-mono">Workspace</span><ChevronRight size={12} /><span className="font-bold text-[hsl(var(--foreground))]">{current.label}</span></div>
        <div className="text-[13px] font-bold sm:hidden">{current.label}</div>
      </div>
      <div className="flex items-center gap-3">
        <PersonaSwitcher />
        <ThemeToggle />
        <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-[10px] text-[hsl(var(--muted-foreground))] lg:flex"><span className="size-1.5 rounded-full bg-[hsl(var(--accent-foreground))]" />All systems nominal</div>
        <button type="button" onClick={() => setLocation('/activity')} className="relative rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" aria-label="Open notifications" data-testid="button-open-notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[hsl(var(--destructive))]" /></button>
        <div className="flex size-8 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white md:hidden">
          {activePersona.initials}
        </div>
      </div>
    </header>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((current) => !current);
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="md:pl-[248px]"><TopBar onMenu={toggleSidebar} /><main className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9">{children}</main></div></div>;
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

export function DeadlineRow({ deadline, onDraft }: { deadline: Deadline; onDraft: () => void }) {
  return <div className="border-b border-[hsl(var(--border)/.7)] px-4 py-3.5 last:border-0" data-testid={`row-deadline-${deadline.id}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="gg-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">{deadline.type}</span><StatusPill value={deadline.status} kind="deadline" /></div><div className="mt-1.5 text-[12px] font-bold">{deadline.title}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Owner: {deadline.owner} · Due {deadline.dueDate}</div></div><div className="shrink-0 text-right"><div className={cx('gg-mono text-[13px] font-medium', deadline.daysLeft <= 7 ? 'text-[hsl(var(--destructive))]' : deadline.daysLeft <= 21 ? 'text-[hsl(25_62%_35%)]' : 'text-[hsl(var(--foreground))]')}>{deadline.daysLeft}d</div><div className="mt-1 text-[9px] text-[hsl(var(--muted-foreground))]">remaining</div></div></div><div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--accent-foreground))] transition-all" style={{ width: `${Math.min(100, deadline.progress ?? 0)}%` }} /></div><span className="gg-mono w-8 text-right text-[9px] text-[hsl(var(--muted-foreground))]">{deadline.progress ?? 0}%</span>{deadline.status !== 'on_track' && <button type="button" onClick={onDraft} className="text-[10px] font-bold text-[hsl(var(--accent-foreground))] hover:underline" data-testid={`button-draft-${deadline.id}`}>Draft report</button>}</div></div>;
}

export function ScanButton({ isPending, onClick }: { isPending: boolean; onClick: () => void }) {
  return <Button onClick={onClick} disabled={isPending} testId="button-run-scan">{isPending ? <><RefreshCw size={14} className="animate-spin" />Scanning desk</> : <><Play size={13} fill="currentColor" />Run scan</>}</Button>;
}

export function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-[hsl(var(--primary)/.25)]" role="dialog" aria-modal="true" data-testid="drawer-detail"><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close detail" data-testid="button-close-drawer" /><section className="relative h-full w-full max-w-[480px] overflow-y-auto border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"><div className="mb-8 flex items-center justify-between"><div className="gg-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{title}</div><button type="button" onClick={onClose} className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" aria-label="Close detail panel" data-testid="button-close-detail"><X size={17} /></button></div>{children}</section></div>;
}