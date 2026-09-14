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
import { useAuth, formatDisplayName } from '@/context/auth-context';
import { usePersona } from '@/context/persona-context';
import { useTheme } from '@/context/theme-context';
import { isDeadlineSubmittedLocal } from '@/lib/api';

export const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ');

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx('flex items-center gap-3 select-none', compact && 'gap-2')} data-testid="brand-grant-guardian">
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10 transition-transform group-hover:scale-105">
        <ShieldCheck size={19} strokeWidth={2.3} className="text-emerald-400" />
        <span className="absolute right-1 top-1 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">GrantGuardian</span>
            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 font-mono text-[8px] font-bold text-emerald-400 uppercase tracking-widest">PRO</span>
          </div>
          <div className="text-[10px] font-medium tracking-wide text-slate-400">Research lab governance</div>
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
    <div className="flex items-center gap-2">
      {/* Verified PI Profile badge */}
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/70 bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 text-xs text-white shadow-xs transition-all hover:border-slate-600">
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/30 text-amber-300">
          <ShieldCheck size={13} strokeWidth={2.4} />
          <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
        </div>
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-bold text-slate-100 tracking-tight">
              {formatDisplayName(user)}
            </span>
            <span className="rounded bg-emerald-500/20 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
              PI
            </span>
          </div>
          <span className="font-mono text-[9.5px] text-slate-400 mt-0.5 truncate max-w-[140px]">{user.email}</span>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all shadow-2xs active:scale-95 cursor-pointer"
        data-testid="button-sign-out"
        title="Sign Out of Laboratory Account"
      >
        <LogOut size={13} className="shrink-0" />
        <span className="text-[11px] font-medium hidden sm:inline">Sign Out</span>
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
        'flex items-center justify-center rounded-xl transition-all shadow-xs cursor-pointer active:scale-95',
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
          {!compact && <span className="hidden xl:inline text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Light</span>}
        </>
      ) : (
        <>
          <Moon size={14} className="text-indigo-600 dark:text-indigo-400" />
          {!compact && <span className="hidden xl:inline text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Dark</span>}
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
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-[hsl(var(--background)/.7)] backdrop-blur-sm md:hidden" data-testid="button-close-navigation" />}
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-[252px] -translate-x-full flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 transition-transform md:translate-x-0 shadow-xl shadow-black/20', open && 'translate-x-0')} data-testid="sidebar-navigation">
        <div className="px-2 pt-1"><LogoMark /></div>
        
        <div className="font-mono mt-8 px-3 text-[9px] font-bold uppercase tracking-[.24em] text-[hsl(var(--sidebar-foreground)/.45)]">CONTROL ROOM</div>
        <nav className="mt-2.5 space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all relative',
                  active
                    ? 'bg-gradient-to-r from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-accent)/.7)] text-white font-semibold shadow-xs border border-[hsl(var(--sidebar-border))]'
                    : 'text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent)/.4)] hover:text-white'
                )}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400" />
                )}
                <Icon
                  size={16}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={active ? 'text-emerald-400' : 'text-[hsl(var(--sidebar-foreground)/.6)] group-hover:text-slate-200 transition-colors'}
                />
                <span>{label}</span>
                {label === 'Citation health' && (
                  <span className="ml-auto rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/25">
                    37
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          {/* Enhanced Fleet Telemetry */}
          <div className="mb-3.5 rounded-xl border border-[hsl(var(--sidebar-border))] bg-gradient-to-b from-[hsl(var(--sidebar-accent)/.4)] to-[hsl(var(--sidebar-accent)/.15)] p-3.5 text-xs shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground)/.5)]">FLEET TELEMETRY</span>
              <span className="flex items-center gap-1 font-mono text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                72ms
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11.5px] font-bold text-[hsl(var(--sidebar-foreground))]">
              <span className="size-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
              Bedrock Sovereign Node
            </div>
            <div className="font-mono mt-1 text-[9.5px] text-[hsl(var(--sidebar-foreground)/.55)] flex items-center justify-between">
              <span>Strands · 10 Tools</span>
              <span>us-east-1</span>
            </div>
          </div>

          {/* PI Persona Summary */}
          <div className="flex items-center gap-2.5 border-t border-[hsl(var(--sidebar-border))] px-1 pt-3.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-slate-800 border border-[hsl(var(--sidebar-border))] text-[11px] font-black text-emerald-300 shadow-inner">
              {activePersona.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11.5px] font-bold text-slate-200">
                {activePersona.title || activePersona.name}
              </div>
              <div className="font-mono truncate text-[9.5px] text-slate-400">
                {activePersona.role}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle compact />
              <Link href="/settings" className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors" data-testid="link-profile-settings"><Settings2 size={14} /></Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const [location, setLocation] = useLocation();
  const current = navItems.find((item) => item.href !== '/' && location.startsWith(item.href)) ?? navItems[0];
  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/.92)] px-5 backdrop-blur-md md:px-9 shadow-xs" data-testid="topbar">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden cursor-pointer" aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button>
        <div className="hidden items-center gap-2.5 text-[11px] tracking-wider text-slate-400 sm:flex">
          <span className="font-mono font-bold text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest">GRANTGUARDIAN</span>
          <ChevronRight size={13} className="text-slate-400/50" />
          <span className="font-bold text-[12px] text-[hsl(var(--foreground))]">{current.label}</span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Shield Active
          </span>
        </div>
        <div className="text-[14px] font-bold sm:hidden">{current.label}</div>
      </div>
      <div className="flex items-center gap-3">
        <PersonaSwitcher />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setLocation('/activity')}
          className="relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-slate-400 hover:bg-[hsl(var(--muted))] hover:text-slate-700 dark:hover:text-slate-200 transition-all shadow-2xs cursor-pointer active:scale-95"
          aria-label="Open notifications"
          data-testid="button-open-notifications"
          title="Autonomous Event Stream"
        >
          <Bell size={16} />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-[hsl(var(--card))]" />
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
      <div className="md:pl-[252px]">
        <TopBar onMenu={toggleSidebar} />
        <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-9">{children}</main>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 font-mono mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-current" />
          <span>{eyebrow}</span>
        </div>
        <h1 className="text-[clamp(1.9rem,3.5vw,2.75rem)] font-extrabold tracking-tight leading-[1.05] text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && <p className="mt-2.5 max-w-[620px] text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Button({ children, variant = 'primary', className, onClick, disabled, type = 'button', testId }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; className?: string; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; testId?: string }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11.5px] font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs',
        variant === 'primary' && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 shadow-md shadow-[hsl(var(--primary)/.15)]',
        variant === 'secondary' && 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--ring))]',
        variant === 'ghost' && 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] shadow-none',
        variant === 'danger' && 'border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.18)]',
        className
      )}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

export function StatusPill({ value, kind = 'citation' }: { value: string; kind?: 'citation' | 'deadline' | 'tone' }) {
  const map: Record<string, { label: string; className: string; dotClass: string }> = {
    clear: { label: 'Clear', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25', dotClass: 'bg-emerald-500' },
    retracted: { label: 'Retracted', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25', dotClass: 'bg-rose-500 animate-pulse' },
    corrected: { label: 'Corrected', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25', dotClass: 'bg-amber-500' },
    propagation: { label: 'Propagation risk', className: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30', dotClass: 'bg-amber-500 animate-pulse' },
    on_track: { label: 'On track', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25', dotClass: 'bg-emerald-500' },
    due_soon: { label: 'Due soon', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25', dotClass: 'bg-amber-500' },
    attention: { label: 'Needs attention', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25', dotClass: 'bg-rose-500 animate-pulse' },
    neutral: { label: 'Recorded', className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20', dotClass: 'bg-slate-400' },
    success: { label: 'Cleared', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25', dotClass: 'bg-emerald-500' },
    warning: { label: 'Review', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25', dotClass: 'bg-amber-500' },
    danger: { label: 'Escalated', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25', dotClass: 'bg-rose-500 animate-pulse' },
  };
  const item = map[value] ?? {
    label: value.replaceAll('_', ' '),
    className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
    dotClass: 'bg-slate-400',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.8 text-[9px] font-bold uppercase tracking-[.1em] shadow-2xs transition-colors',
        item.className
      )}
      data-testid={`status-${kind}-${value}`}
    >
      <span className={cx('size-1.5 rounded-full ring-1 ring-current/20', item.dotClass)} />
      {item.label}
    </span>
  );
}

export function RiskPill({ risk }: { risk: string }) {
  const styles =
    risk === 'high'
      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25'
      : risk === 'medium'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25'
      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';

  return (
    <span
      className={cx('font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1', styles)}
      data-testid={`status-risk-${risk}`}
    >
      {risk} risk
    </span>
  );
}

export function LoadingBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xs" data-testid="state-loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cx('h-3.5 rounded-lg bg-[hsl(var(--muted))]', i % 3 === 0 ? 'w-2/5' : i % 3 === 1 ? 'w-full' : 'w-4/5')} />
      ))}
    </div>
  );
}

export function ErrorBlock({ onRetry, message = 'Guardian could not retrieve this desk right now.' }: { onRetry: () => void; message?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-5 shadow-xs" data-testid="state-error">
      <div className="flex items-start gap-3.5">
        <AlertCircle className="mt-0.5 text-rose-500 shrink-0" size={20} />
        <div>
          <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Telemetry Disruption Notice</div>
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
      </div>
      <Button variant="secondary" onClick={onRetry} testId="button-retry">Retry Query</Button>
    </div>
  );
}

export function EmptyBlock({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] p-8 text-center" data-testid="state-empty">
      <div className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-500 shadow-sm">
        <Sparkles size={19} />
      </div>
      <h3 className="text-[14px] font-bold text-[hsl(var(--foreground))] tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
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
  const toneMap = {
    danger: {
      border: 'hover:border-rose-500/40',
      iconBox: 'bg-rose-500/10 text-rose-500 border-rose-500/25',
      sparkColor: 'hsl(350, 84%, 60%)',
    },
    warning: {
      border: 'hover:border-amber-500/40',
      iconBox: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
      sparkColor: 'hsl(38, 92%, 50%)',
    },
    success: {
      border: 'hover:border-emerald-500/40',
      iconBox: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
      sparkColor: 'hsl(158, 75%, 42%)',
    },
    neutral: {
      border: 'hover:border-slate-400/40 dark:hover:border-slate-600/40',
      iconBox: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
      sparkColor: 'hsl(var(--muted-foreground))',
    },
  };

  const currentTone = toneMap[tone] || toneMap.neutral;

  return (
    <div
      className={cx(
        'group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        currentTone.border
      )}
      data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
        <div className={cx('flex size-8 items-center justify-center rounded-xl border shadow-xs transition-transform group-hover:scale-105', currentTone.iconBox)}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[32px] font-extrabold tracking-tight tabular-nums leading-none text-[hsl(var(--foreground))]">
            {value}
          </div>
          <div className="mt-1.5 text-[11.5px] font-medium text-[hsl(var(--muted-foreground))]">{detail}</div>
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 w-20 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 64 24" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id={`grad-${label.replaceAll(' ', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentTone.sparkColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={currentTone.sparkColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`M 0 ${24 - sparklineData[0] * 3} ${sparklineData
                  .slice(1)
                  .map((d, i) => `L ${(i + 1) * (64 / (sparklineData.length - 1))} ${Math.max(2, 22 - d * 3)}`)
                  .join(' ')}`}
                fill="none"
                stroke={currentTone.sparkColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute right-0 bottom-0 size-24 translate-x-8 translate-y-8 rounded-full bg-radial from-[hsl(var(--foreground)/.03)] to-transparent pointer-events-none" />
    </div>
  );
}

export function formatActivityTimestamp(raw: string | undefined | null): string {
  if (!raw) return 'Just now';
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const now = Date.now();
      const diffMs = now - d.getTime();
      if (diffMs >= 0 && diffMs < 45_000) return 'Just now';
      if (diffMs >= 0 && diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
      if (diffMs >= 0 && diffMs < 86_400_000) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
      return (
        d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      );
    }
  } catch {}
  return raw;
}

export function ActivityRow({ item }: { item: Activity }) {
  const icons = { scan: RefreshCw, flagged: AlertTriangle, escalation: AlertCircle, draft: FileText, clear: CheckCircle2 };
  const Icon = icons[item.kind as keyof typeof icons] ?? ActivityIcon;
  return (
    <div className="flex gap-3 border-b border-[hsl(var(--border)/.7)] py-3.5 last:border-0" data-testid={`row-activity-${item.id}`}>
      <div
        className={cx(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
          item.tone === 'danger'
            ? 'bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))]'
            : item.tone === 'warning'
            ? 'bg-[hsl(35_76%_61%/.18)] text-[hsl(25_62%_35%)]'
            : item.tone === 'success'
            ? 'bg-[hsl(var(--accent)/.25)] text-[hsl(155_35%_27%)]'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
        )}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[11px] font-bold">{item.title}</div>
          <time className="gg-mono text-[9px] text-[hsl(var(--muted-foreground))]">
            {formatActivityTimestamp(item.timestamp)}
          </time>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">{item.description}</p>
      </div>
    </div>
  );
}

export function CitationRow({ citation, onSelect }: { citation: Citation; onSelect?: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3.5 border-b border-[hsl(var(--border)/.6)] px-4 py-3.5 text-left transition-all duration-200 hover:bg-[hsl(var(--muted)/.4)] cursor-pointer"
      data-testid={`row-citation-${citation.id}`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] shadow-2xs group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-colors">
        <BookOpen size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold text-[hsl(var(--foreground))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {citation.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 truncate text-[11px] text-[hsl(var(--muted-foreground))]">
          <span>{citation.authors}</span>
          <span>·</span>
          <span className="font-medium text-[hsl(var(--foreground)/.8)]">{citation.venue}</span>
          <span>·</span>
          <span className="font-mono text-[10px]">{citation.year}</span>
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex shrink-0">
        <StatusPill value={citation.status} />
        <RiskPill risk={citation.risk} />
      </div>
      <div className="flex size-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] opacity-0 transition-all group-hover:opacity-100 group-hover:bg-[hsl(var(--card))] group-hover:text-[hsl(var(--foreground))]">
        <ArrowUpRight size={15} />
      </div>
    </button>
  );
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
  const { user } = useAuth();
  const userSlug = user?.tenantSlug || (user?.id ? String(user.id) : undefined);
  const isServerSubmitted =
    (deadline.progress ?? 0) >= 100 ||
    (deadline.status as string) === 'clear' ||
    (deadline.status as string) === 'submitted' ||
    isDeadlineSubmittedLocal(deadline.id, userSlug);
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const effectiveSubmitted = isServerSubmitted || localSubmitted;
  const isUrgentTrigger = deadline.daysLeft <= 14 && (deadline.progress ?? 0) < 80;

  return (
    <div
      className="border-b border-[hsl(var(--border)/.6)] p-5 last:border-0 hover:bg-[hsl(var(--muted)/.25)] transition-colors"
      data-testid={`row-deadline-${deadline.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] font-extrabold bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md border border-[hsl(var(--border))]">
              {deadline.type}
            </span>
            <StatusPill value={effectiveSubmitted ? 'clear' : deadline.status} kind="deadline" />
            {isUrgentTrigger && !effectiveSubmitted && (
              <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 animate-pulse">
                ⚡ 14-Day Trigger Active (&lt;80% prep)
              </span>
            )}
            {effectiveSubmitted && (
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ PI Signed &amp; Filed Externally
              </span>
            )}
          </div>
          <div className="mt-2 text-[15px] font-bold text-[hsl(var(--foreground))] tracking-tight">{deadline.title}</div>
          <div className="mt-1 text-[11.5px] text-[hsl(var(--muted-foreground))]">
            Owner: <strong className="text-[hsl(var(--foreground)/.85)] font-semibold">{deadline.owner}</strong> · Due {deadline.dueDate}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
          <div className="text-right">
            <span className={cx(
              'font-mono text-[16px] font-extrabold',
              deadline.daysLeft <= 7 ? 'text-rose-600 dark:text-rose-400' : deadline.daysLeft <= 21 ? 'text-amber-600 dark:text-amber-400' : 'text-[hsl(var(--foreground))]'
            )}>
              {deadline.daysLeft}d
            </span>
            <span className="ml-1 text-[10.5px] text-[hsl(var(--muted-foreground))] font-medium">remaining</span>
          </div>

          <div className="flex items-center gap-2">
            {!effectiveSubmitted && (
              <button
                type="button"
                onClick={onDraft}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-1.8 text-[11.5px] shadow-sm shadow-emerald-500/20 active:scale-95 cursor-pointer transition-all shrink-0"
                data-testid={`button-draft-${deadline.id}`}
                title="Generate AI compliance draft using deadline & lab context"
              >
                <Sparkles size={13} className="text-emerald-200" />
                <span>Draft report</span>
              </button>
            )}

            {!effectiveSubmitted ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSubmitted(true);
                  if (onMarkSubmitted) onMarkSubmitted();
                }}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] px-3 py-1.8 text-[10.5px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors active:scale-95 cursor-pointer shadow-2xs"
                title="Mark this deadline officially submitted by PI to external agency portal"
              >
                Mark Submitted
              </button>
            ) : (
              <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Check size={14} /> Filed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar with Shimmer & Readiness Gauge */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[10.5px] text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-[hsl(var(--foreground))]">Preparation Readiness:</span> {effectiveSubmitted ? 100 : (deadline.progress ?? 0)}%
            <span className="text-[9.5px] opacity-75">(audit artifacts &amp; narrative completeness)</span>
          </span>
          <span className="font-mono font-bold text-[hsl(var(--foreground))]">{effectiveSubmitted ? 100 : (deadline.progress ?? 0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))] p-0.5 border border-[hsl(var(--border)/.5)]">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
            style={{ width: `${Math.min(100, effectiveSubmitted ? 100 : (deadline.progress ?? 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ScanButton({ isPending, onClick }: { isPending: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={isPending} testId="button-run-scan" className="shadow-emerald-500/20">
      {isPending ? (
        <>
          <RefreshCw size={14} className="animate-spin text-emerald-300" />
          <span>Scanning desk...</span>
        </>
      ) : (
        <>
          <Play size={13} fill="currentColor" className="text-emerald-400" />
          <span>Run scan</span>
        </>
      )}
    </Button>
  );
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
              className="group flex flex-col items-center justify-center gap-2 rounded-l-xl border-y border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-4 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer transition-all shadow-xs"
              title="Push to Center for expanded visibility"
              data-testid="button-push-to-center"
            >
              <ArrowLeft size={16} className="text-[hsl(var(--foreground))] group-hover:-translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
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
              className="group flex flex-col items-center justify-center gap-2 rounded-r-xl border-y border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-4 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer transition-all shadow-xs"
              title="Dock back to right sidebar"
              data-testid="button-dock-to-side"
            >
              <ArrowRight size={16} className="text-[hsl(var(--foreground))] group-hover:translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
                Dock Side
              </span>
            </button>
          </div>
        )}

        <section
          className={cx(
            'relative h-full w-full overflow-y-auto bg-[hsl(var(--card))] shadow-xl transition-all duration-300 flex flex-col',
            isCentered
              ? 'rounded-2xl border border-[hsl(var(--border))] p-6 sm:p-8'
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
                className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] transition-colors shadow-2xs cursor-pointer"
                title={isCentered ? 'Dock back to right sidebar' : 'Push AI investigation to center stage'}
                data-testid="button-toggle-center"
              >
                {isCentered ? (
                  <>
                    <ArrowRight size={13} className="text-[hsl(var(--muted-foreground))]" />
                    <span>Dock to Side</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft size={13} className="text-[hsl(var(--muted-foreground))]" />
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