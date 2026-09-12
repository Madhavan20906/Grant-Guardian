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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4 bg-[hsl(var(--muted)/.3)]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Grant Guardian Identity
                </h2>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Enterprise Cryptographic Authentication & Isolated Research Workspaces
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[hsl(var(--border))] px-6 pt-3 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'signin'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <UserPlus size={15} />
            Create Lab Account (Multi-Tenant)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
              <XCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Notice:</span> {error}
              </div>
            </div>
          )}

          {activeTab === 'signin' ? (
            <div className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. pi@university.edu"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.6)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.6)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Instant 1-Click Evaluation Accounts */}
              <div className="border-t border-[hsl(var(--border))] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                      Peer-Review & Judge 1-Click Accounts
                    </span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Instant sandbox access
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleDemoClick(t.tenantSlug || t.id)}
                      disabled={isLoading}
                      className="flex flex-col items-start p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] hover:bg-purple-500/10 hover:border-purple-500/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 w-full mb-1">
                        <span className="flex size-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white shrink-0">
                          {t.initials}
                        </span>
                        <span className="text-xs font-bold text-[hsl(var(--foreground))] group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                          {t.title} {t.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate w-full">
                        {t.labName}
                      </span>
                      <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 italic truncate w-full mt-0.5">
                        {t.focus}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Title
                  </label>
                  <select
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Assoc. Prof.">Assoc. Prof.</option>
                    <option value="Postdoc">Postdoc Fellow</option>
                    <option value="Director">Lab Director</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Primary Investigator / Researcher Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alan Turing"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Laboratory / Group Name
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neural Computation Lab"
                      value={regLabName}
                      onChange={(e) => setRegLabName(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    University / Institute
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cambridge University"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Primary Grant Proposal Name
                  </label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. NIH R01 / NSF CAREER"
                      value={regProposalName}
                      onChange={(e) => setRegProposalName(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                    Scientific Focus / Field
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synthetic Biology & Cellular Logic"
                    value={regFocus}
                    onChange={(e) => setRegFocus(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="email"
                    required
                    placeholder="pi@lab.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Password (Enterprise 10/10 Cryptographic Security)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="password"
                    required
                    placeholder="Create a strong passphrase"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Password validation checklist */}
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-500 font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {passwordChecks.length ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-emerald-500 font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {passwordChecks.uppercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-emerald-500 font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {passwordChecks.lowercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-emerald-500 font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {passwordChecks.number ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.special ? 'text-emerald-500 font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {passwordChecks.special ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Initial Workspace Template
                </label>
                <select
                  value={regStarter}
                  onChange={(e) => setRegStarter(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                >
                  <option value="clean">Blank Workspace (Clean slate for custom grant proposal)</option>
                  <option value="biomaterials">Biomaterials & Regenerative Scaffolds Benchmark</option>
                  <option value="oncology">Computational Oncology & Genomics Benchmark</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordStrong}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Creating Tenant Workspace...' : 'Register Lab & Launch Workspace'}
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[hsl(var(--border))] px-6 py-3 bg-[hsl(var(--muted)/.2)] text-[10px] text-[hsl(var(--muted-foreground))] flex items-center justify-between">
          <span>PBKDF2-SHA512 Salted Hashing · Constant-Time Verification · Isolated Multi-Tenancy</span>
          <span className="font-mono text-purple-500">Grant Guardian v2.4</span>
        </div>
      </div>
    </div>
  );
}
