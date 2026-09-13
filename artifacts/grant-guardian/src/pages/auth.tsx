import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/auth-context';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const {
    isAuthenticated,
    login,
    register,
    demoLogin,
    tenants,
    isLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'register' | 'signin'>('register');
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to the application
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

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
      setLocation('/');
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
      setLocation('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    }
  };

  const handleDemoClick = async (slugOrId: string | number) => {
    setError(null);
    try {
      await demoLogin(slugOrId);
      setLocation('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to switch demo account.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1120] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30">
      {/* Top Banner Branding */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 shadow-xs">
            🛡️
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-white flex items-center gap-2">
              <span>GrantGuardian</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase tracking-widest">
                v2.4
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Autonomous Citation Integrity & Lab Governance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Bedrock Sovereign Node Online</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header */}
          <div className="border-b border-slate-800 px-6 sm:px-8 py-6 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-amber-400 shadow-inner">
                <ShieldCheck size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Research Laboratory Authority Access
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in or create a multi-tenant laboratory workspace with cryptographic provenance.
                </p>
              </div>
            </div>

            {/* Segmented Tabs */}
            <div className="mt-6 flex border-b border-slate-800 gap-6 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className={`pb-3 flex items-center gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                data-testid="tab-register"
              >
                <UserPlus size={15} />
                <span>Create Lab Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className={`pb-3 flex items-center gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                data-testid="tab-signin"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3.5 text-xs text-rose-300">
                <XCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <span className="font-bold">Authentication error:</span> {error}
                </div>
              </div>
            )}

            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4" data-testid="form-signin">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. pi@university.edu"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                      data-testid="input-signin-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Security Passphrase
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                      data-testid="input-signin-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-3 transition-all shadow-md disabled:opacity-50 mt-2 cursor-pointer"
                  data-testid="button-submit-signin"
                >
                  {isLoading ? 'Verifying credentials...' : 'Sign in to workspace'}
                  <ArrowRight size={15} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Title
                    </label>
                    <select
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none transition-colors"
                      data-testid="select-title"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Assoc. Prof.">Assoc. Prof.</option>
                      <option value="Postdoc">Postdoc</option>
                      <option value="Director">Lab Director</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Principal Investigator Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alan Turing"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                        data-testid="input-name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Laboratory Name
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Neural Systems Lab"
                        value={regLabName}
                        onChange={(e) => setRegLabName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                        data-testid="input-lab-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Institution / University
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cambridge University"
                      value={regInstitution}
                      onChange={(e) => setRegInstitution(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      data-testid="input-institution"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Grant Proposal Name
                    </label>
                    <div className="relative">
                      <FileText size={15} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. NIH R01 / NSF CAREER"
                        value={regProposalName}
                        onChange={(e) => setRegProposalName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                        data-testid="input-proposal-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Research Focus Area
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cellular Logic & Genetics"
                      value={regFocus}
                      onChange={(e) => setRegFocus(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      data-testid="input-focus"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="pi@lab.org"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      data-testid="input-register-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Security Passphrase
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Create a strong passphrase"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      data-testid="input-register-password"
                    />
                  </div>

                  {/* Password Checklist */}
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={passwordChecks.length ? 'text-emerald-400' : 'text-slate-600'} />
                      <span>8+ chars</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={passwordChecks.uppercase ? 'text-emerald-400' : 'text-slate-600'} />
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={passwordChecks.lowercase ? 'text-emerald-400' : 'text-slate-600'} />
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={passwordChecks.number ? 'text-emerald-400' : 'text-slate-600'} />
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.special ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={passwordChecks.special ? 'text-emerald-400' : 'text-slate-600'} />
                      <span>Special char</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Starter Template
                  </label>
                  <select
                    value={regStarter}
                    onChange={(e) => setRegStarter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none transition-colors"
                    data-testid="select-template"
                  >
                    <option value="clean">Blank Workspace (Clean slate for custom grant proposal)</option>
                    <option value="biomaterials">Biomaterials & Regenerative Scaffolds Benchmark</option>
                    <option value="oncology">Computational Oncology & Genomics Benchmark</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordStrong}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-3 transition-all shadow-md disabled:opacity-50 mt-3 cursor-pointer"
                  data-testid="button-submit-register"
                >
                  {isLoading ? 'Configuring laboratory...' : 'Create laboratory workspace'}
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* Quick Demo Lab Workspaces */}
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>1-Click Sandbox & Demo Workspaces</span>
                </div>
                <span className="font-mono text-[9.5px] text-emerald-400 font-semibold">
                  Instant Test Access
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleDemoClick(t.tenantSlug || t.id)}
                    disabled={isLoading}
                    className="flex flex-col items-start p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group cursor-pointer"
                    data-testid={`button-demo-${t.tenantSlug || t.id}`}
                  >
                    <div className="flex items-center gap-2 w-full mb-1">
                      <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0 border border-amber-500/30">
                        {t.initials}
                      </span>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {t.title} {t.name}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 truncate w-full">
                      {t.labName}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 truncate w-full mt-0.5">
                      {t.focus}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-800/80 px-6 sm:px-8 py-3.5 bg-slate-950/60 text-[10.5px] text-slate-400 flex items-center justify-between font-mono">
            <span>PBKDF2-SHA512 Salted Hashing · Multi-Tenant Isolation</span>
            <span className="text-slate-500">GrantGuardian Sovereign</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 px-6 py-3 text-center text-[10.5px] text-slate-500 font-mono">
        GrantGuardian Research Integrity Protocol · Sovereign AI Deployment
      </footer>
    </div>
  );
}
