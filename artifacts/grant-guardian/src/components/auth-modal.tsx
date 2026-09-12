import { useState } from 'react';
import { useAuth } from '../context/auth-context';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    demoLogin,
    tenants,
    isLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [error, setError] = useState<string | null>(null);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regTitle, setRegTitle] = useState('Dr.');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLabName, setRegLabName] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regFocus, setRegFocus] = useState('');
  const [regProposalName, setRegProposalName] = useState('');
  const [regStarter, setRegStarter] = useState('clean');

  if (!isAuthModalOpen) return null;

  const passwordChecks = {
    length: regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    lowercase: /[a-z]/.test(regPassword),
    number: /[0-9]/.test(regPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(regPassword),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(signInEmail, signInPassword);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isPasswordStrong) {
      setError('Please fulfill all password security requirements before proceeding.');
      return;
    }
    try {
      await register({
        name: regName,
        title: regTitle,
        email: regEmail,
        password: regPassword,
        labName: regLabName || `${regName.split(' ').pop() || 'Research'} Lab`,
        institution: regInstitution || 'Research Institution',
        focus: regFocus || 'General Scientific Proposal',
        proposalName: regProposalName || 'Active Research Proposal',
        starterTemplate: regStarter,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    }
  };

  const handleDemoClick = async (slugOrId: string | number) => {
    setError(null);
    try {
      await demoLogin(slugOrId);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch demo account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Calm Slate Enterprise Style */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-6 py-4.5 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">
                  GrantGuardian Access
                </h2>
                <span className="font-mono rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Lab Authority
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Institutional research lab authentication and multi-tenant workspaces.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Calm Segmented Tabs */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 px-6 pt-3 flex gap-6 text-[12px]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 font-medium transition-colors ${
              activeTab === 'signin'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LogIn size={14} />
            <span>Sign in</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 font-medium transition-colors ${
              activeTab === 'register'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} />
            <span>Register new laboratory</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-3 text-[11px] text-rose-700 dark:text-rose-300">
              <XCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <span className="font-bold">Authentication error:</span> {error}
              </div>
            </div>
          )}

          {activeTab === 'signin' ? (
            <div className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. pi@university.edu"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-[12px] font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Verifying credentials...' : 'Sign in to workspace'}
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* 1-Click Institutional Demo Workspaces */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Sandbox & Demo Workspaces
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    1-Click Access
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleDemoClick(t.tenantSlug || t.id)}
                      disabled={isLoading}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 w-full mb-1">
                        <span className="flex size-5 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                          {t.initials}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                          {t.title} {t.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
                        {t.labName}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate w-full mt-0.5">
                        {t.focus}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title
                  </label>
                  <select
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Assoc. Prof.">Assoc. Prof.</option>
                    <option value="Postdoc">Postdoc</option>
                    <option value="Director">Lab Director</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Principal Investigator Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alan Turing"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Laboratory Name
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neural Systems Lab"
                      value={regLabName}
                      onChange={(e) => setRegLabName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cambridge University"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grant Proposal Name
                  </label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. NIH R01 / NSF CAREER"
                      value={regProposalName}
                      onChange={(e) => setRegProposalName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Research Focus Area
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cellular Logic & Genetics"
                    value={regFocus}
                    onChange={(e) => setRegFocus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="pi@lab.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Security Passphrase
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Create a strong passphrase"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Calm password checklist */}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                  <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 size={11} className={passwordChecks.length ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>8+ chars</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 size={11} className={passwordChecks.uppercase ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>Uppercase</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 size={11} className={passwordChecks.lowercase ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>Lowercase</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 size={11} className={passwordChecks.number ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.special ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 size={11} className={passwordChecks.special ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>Special</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Starter Template
                </label>
                <select
                  value={regStarter}
                  onChange={(e) => setRegStarter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                >
                  <option value="clean">Blank Workspace (Clean slate for custom grant proposal)</option>
                  <option value="biomaterials">Biomaterials & Regenerative Scaffolds Benchmark</option>
                  <option value="oncology">Computational Oncology & Genomics Benchmark</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordStrong}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-[12px] font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Configuring laboratory...' : 'Create laboratory workspace'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/40 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>PBKDF2-SHA512 Salted Hashing · Multi-Tenant Isolation</span>
          <span className="text-slate-500">GrantGuardian v2.4</span>
        </div>
      </div>
    </div>
  );
}
