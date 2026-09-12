import { useEffect, useState } from 'react';
import {
  Check,
  Clock3,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  Building2,
  User,
  FileText,
  Sparkles,
  Save,
} from 'lucide-react';
import { Button, SectionHeading } from '@/components/guardian-ui';
import { useAuth } from '@/context/auth-context';

type Preferences = { highRisk: boolean; weeklyDigest: boolean; draftSuggestions: boolean; quietHours: boolean };
const defaults: Preferences = { highRisk: true, weeklyDigest: true, draftSuggestions: true, quietHours: false };

export default function Settings() {
  const { user, updateProfile, openAuthModal, isAuthenticated } = useAuth();

  // Notification Preferences
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [prefSaved, setPrefSaved] = useState(false);

  // Lab Identity State
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [labName, setLabName] = useState(user.labName);
  const [institution, setInstitution] = useState(user.institution);
  const [proposalName, setProposalName] = useState(user.proposalName);
  const [focus, setFocus] = useState(user.focus);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setName(user.name);
    setTitle(user.title);
    setLabName(user.labName);
    setInstitution(user.institution);
    setProposalName(user.proposalName);
    setFocus(user.focus);
  }, [user]);

  const update = (key: keyof Preferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setPrefSaved(false);
  };

  useEffect(() => {
    void fetch('/api/guardian/preferences')
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (value) {
          setPreferences({
            highRisk: value.highRiskInterrupts,
            weeklyDigest: value.weeklyDeskNote,
            draftSuggestions: value.deadlineReminders,
            quietHours: false,
          });
        }
      })
      .catch(() => undefined);
  }, [user.id]);

  const savePreferences = () => {
    void fetch('/api/guardian/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        highRiskInterrupts: preferences.highRisk,
        weeklyDeskNote: preferences.weeklyDigest,
        deadlineReminders: preferences.draftSuggestions,
      }),
    })
      .then((response) => {
        if (response.ok) setPrefSaved(true);
      })
      .catch(() => undefined);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await updateProfile({
        name,
        title,
        labName,
        institution,
        proposalName,
        focus,
      });
      setProfileSaved(true);
    } catch {
      setProfileSaved(false);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="gg-stagger space-y-8">
      <SectionHeading
        eyebrow="Multi-Tenant Workspace Configuration"
        title="Identity & Attention."
        description="Configure your laboratory identity, grant focus, and threshold settings for autonomous compliance watch."
      />

      <div className="grid max-w-[1040px] gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Lab & Research Identity Section */}
          <section
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            data-testid="section-lab-identity"
          >
            <div className="border-b border-[hsl(var(--border))] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-700 dark:text-slate-300" />
                  <h2 className="text-[13px] font-bold">Research Laboratory & Tenant Profile</h2>
                </div>
                <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                  All proposal labels, compliance monitors, and citation blast radii dynamically adapt to this identity.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 font-mono">
                {isAuthenticated ? 'Authenticated Account' : 'Evaluation Mode'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Academic Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dr. / Prof."
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Principal Investigator / Researcher Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Laboratory / Group Name
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="e.g. Translational Therapeutics Lab"
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Harvard University / MIT"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Primary Grant Proposal Title
                  </label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      required
                      value={proposalName}
                      onChange={(e) => setProposalName(e.target.value)}
                      placeholder="e.g. NIH R01 / NSF CAREER"
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--foreground))] mb-1">
                    Research Domain & Focus
                  </label>
                  <input
                    type="text"
                    required
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g. Tissue Engineering & Regenerative Medicine"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  {profileSaved ? 'Profile updated across active workspace.' : 'Changes apply live.'}
                </span>
                <Button type="submit" disabled={profileSaving} testId="button-save-profile">
                  {profileSaved ? <Check size={14} /> : <Save size={14} />}
                  {profileSaving ? 'Saving...' : 'Save Profile Identity'}
                </Button>
              </div>
            </form>
          </section>

          {/* Attention Settings Section */}
          <section
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            data-testid="section-notification-preferences"
          >
            <div className="border-b border-[hsl(var(--border))] px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-[hsl(var(--accent-foreground))]" />
                <h2 className="text-[13px] font-bold">Attention settings</h2>
              </div>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                These preferences shape when the desk interrupts you.
              </p>
            </div>
            <div className="divide-y divide-[hsl(var(--border)/.7)]">
              <PreferenceRow
                icon={ShieldCheck}
                title="High-risk signals"
                detail="Interrupt me immediately when a citation is retracted or propagation risk is high."
                checked={preferences.highRisk}
                onChange={() => update('highRisk')}
                testId="toggle-high-risk"
              />
              <PreferenceRow
                icon={Mail}
                title="Weekly desk note"
                detail="Send a compact Monday summary of what changed while you were away."
                checked={preferences.weeklyDigest}
                onChange={() => update('weeklyDigest')}
                testId="toggle-weekly-digest"
              />
              <PreferenceRow
                icon={Check}
                title="Draft suggestions"
                detail="Offer a report draft when a compliance deadline enters the attention window."
                checked={preferences.draftSuggestions}
                onChange={() => update('draftSuggestions')}
                testId="toggle-draft-suggestions"
              />
              <PreferenceRow
                icon={Clock3}
                title="Quiet hours"
                detail="Hold non-urgent notices between 19:00 and 07:00 local time."
                checked={preferences.quietHours}
                onChange={() => update('quietHours')}
                testId="toggle-quiet-hours"
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {prefSaved ? 'Preferences saved to workspace' : 'Changes are not saved yet'}
            </span>
            <Button onClick={savePreferences} testId="button-save-preferences">
              {prefSaved && <Check size={14} />}Save preferences
            </Button>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <aside
          className="gg-grid h-fit rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))]"
          data-testid="card-preferences-principle"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            <ShieldCheck size={18} />
          </div>
          <div className="mt-6 gg-serif text-[25px] leading-[1.05]">
            Precision over
            <br />
            <em>presence.</em>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.55)]">
            Guardian handles the obvious. Your settings decide how much of the ambiguous work reaches your desk.
          </p>

          <div className="mt-6 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.4)] p-3">
            <div className="text-[10px] font-extrabold uppercase text-[hsl(var(--sidebar-foreground)/.7)] mb-1">
              Active Tenant
            </div>
            <div className="text-xs font-bold text-[hsl(var(--sidebar-foreground))]">
              {user.title} {user.name}
            </div>
            <div className="text-[11px] text-[hsl(var(--sidebar-foreground)/.6)] truncate">
              {user.labName}
            </div>
            <div className="text-[10px] text-[hsl(var(--sidebar-foreground)/.4)] truncate mt-0.5">
              {user.institution}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={openAuthModal}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-600/30 transition-colors"
            >
              <Sparkles size={14} />
              Switch or Create Account
            </button>
          </div>

          <div className="mt-8 border-t border-[hsl(var(--sidebar-border))] pt-4 gg-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--sidebar-foreground)/.45)] truncate">
            Workspace · {user.labName}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  detail,
  checked,
  onChange,
  testId,
}: {
  icon: typeof Check;
  title: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="hidden size-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] sm:flex">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold">{title}</div>
        <div className="mt-1 max-w-[550px] text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">
          {detail}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--muted-foreground)/.3)]'
        }`}
        data-testid={testId}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}