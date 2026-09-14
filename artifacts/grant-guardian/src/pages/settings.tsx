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
        action={
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shadow-2xs cursor-pointer"
            data-testid="button-switch-account-workspace"
          >
            <Sparkles size={14} className="text-purple-500" />
            <span>Switch or Create Account</span>
          </button>
        }
      />

      <div className="w-full space-y-6">
        {/* Lab & Research Identity Section */}
        <section
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden"
          data-testid="section-lab-identity"
        >
          <div className="border-b border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--muted)/.3)] to-transparent px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 size={14} />
                </span>
                <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Research Laboratory &amp; Tenant Profile</h2>
              </div>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] font-medium">
                All proposal labels, compliance monitors, and citation blast radii dynamically adapt to this identity.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300 font-mono self-start sm:self-auto">
              {isAuthenticated ? 'Authenticated Workspace' : 'Evaluation Mode'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Academic Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dr. / Prof."
                  className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Principal Investigator / Researcher Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Laboratory / Group Name
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-3 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    required
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="e.g. Translational Therapeutics Lab"
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Institution / University
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Harvard University / MIT"
                  className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Primary Grant Proposal Title
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3.5 top-3 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    required
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    placeholder="e.g. NIH R01 / NSF CAREER"
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-9 pr-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--foreground))] mb-1.5">
                  Research Domain &amp; Focus
                </label>
                <input
                  type="text"
                  required
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Tissue Engineering & Regenerative Medicine"
                  className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-xs text-[hsl(var(--foreground))] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                {profileSaved ? '✓ Profile updated across active workspace.' : 'Changes apply live.'}
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
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden"
          data-testid="section-notification-preferences"
        >
          <div className="border-b border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--muted)/.3)] to-transparent px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <SlidersHorizontal size={14} />
              </span>
              <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">Attention &amp; Alert Invariants</h2>
            </div>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] font-medium">
              Configure deterministic threshold criteria for autonomous interruptions and weekly intelligence memos.
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

          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-gradient-to-b from-transparent to-[hsl(var(--muted)/.15)] px-6 py-4">
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
              {prefSaved ? '✓ Preferences saved to workspace' : 'Changes are not saved yet'}
            </span>
            <Button onClick={savePreferences} testId="button-save-preferences">
              {prefSaved ? <Check size={14} /> : <Save size={14} />}
              Save preferences
            </Button>
          </div>
        </section>
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
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-[hsl(var(--muted)/.2)] transition-colors">
      <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] sm:flex">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-[hsl(var(--foreground))]">{title}</div>
        <div className="mt-0.5 max-w-[550px] text-xs leading-relaxed text-[hsl(var(--muted-foreground))] font-medium">
          {detail}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all cursor-pointer ${
          checked ? 'bg-emerald-600 shadow-sm' : 'bg-[hsl(var(--muted-foreground)/.25)]'
        }`}
        data-testid={testId}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}