import { useEffect, useState } from 'react';
import { Check, Clock3, Mail, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Button, SectionHeading } from '@/components/guardian-ui';

type Preferences = { highRisk: boolean; weeklyDigest: boolean; draftSuggestions: boolean; quietHours: boolean };
const defaults: Preferences = { highRisk: true, weeklyDigest: true, draftSuggestions: true, quietHours: false };

export default function Settings() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);
  const update = (key: keyof Preferences) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  useEffect(() => { setSaved(false); }, [preferences]);
  useEffect(() => {
    void fetch('/api/guardian/preferences').then((response) => response.ok ? response.json() : null).then((value) => {
      if (value) setPreferences({ highRisk: value.highRiskInterrupts, weeklyDigest: value.weeklyDeskNote, draftSuggestions: value.deadlineReminders, quietHours: false });
    }).catch(() => undefined);
  }, []);
  const save = () => {
    void fetch('/api/guardian/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      highRiskInterrupts: preferences.highRisk, weeklyDeskNote: preferences.weeklyDigest, deadlineReminders: preferences.draftSuggestions,
    }) }).then((response) => { if (response.ok) setSaved(true); }).catch(() => undefined);
  };
  return (
    <div className="gg-stagger">
      <SectionHeading eyebrow="Workspace preferences" title="Set the distance." description="Guardian should feel present without becoming another inbox. Tune what crosses the threshold into your attention." />
      <div className="grid max-w-[980px] gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid="section-notification-preferences"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><div className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-[hsl(var(--accent-foreground))]" /><h2 className="text-[13px] font-bold">Attention settings</h2></div><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">These preferences shape when the desk interrupts you.</p></div><div className="divide-y divide-[hsl(var(--border)/.7)]">
            <PreferenceRow icon={ShieldCheck} title="High-risk signals" detail="Interrupt me immediately when a citation is retracted or propagation risk is high." checked={preferences.highRisk} onChange={() => update('highRisk')} testId="toggle-high-risk" />
            <PreferenceRow icon={Mail} title="Weekly desk note" detail="Send a compact Monday summary of what changed while you were away." checked={preferences.weeklyDigest} onChange={() => update('weeklyDigest')} testId="toggle-weekly-digest" />
            <PreferenceRow icon={Check} title="Draft suggestions" detail="Offer a report draft when a compliance deadline enters the attention window." checked={preferences.draftSuggestions} onChange={() => update('draftSuggestions')} testId="toggle-draft-suggestions" />
            <PreferenceRow icon={Clock3} title="Quiet hours" detail="Hold non-urgent notices between 19:00 and 07:00 local time." checked={preferences.quietHours} onChange={() => update('quietHours')} testId="toggle-quiet-hours" />
          </div></section>
          <div className="flex items-center justify-end gap-3"><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{saved ? 'Preferences saved to workspace' : 'Changes are not saved yet'}</span><Button onClick={save} testId="button-save-preferences">{saved && <Check size={14} />}Save preferences</Button></div>
        </div>
        <aside className="gg-grid h-fit rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))]" data-testid="card-preferences-principle"><div className="flex size-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><ShieldCheck size={18} /></div><div className="mt-6 gg-serif text-[25px] leading-[1.05]">Precision over<br /><em>presence.</em></div><p className="mt-4 text-[11px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.55)]">Guardian handles the obvious. Your settings decide how much of the ambiguous work reaches your desk.</p><div className="mt-8 border-t border-[hsl(var(--sidebar-border))] pt-4 gg-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--sidebar-foreground)/.45)]">Workspace · Materials Lab</div></aside>
      </div>
    </div>
  );
}

function PreferenceRow({ icon: Icon, title, detail, checked, onChange, testId }: { icon: typeof Check; title: string; detail: string; checked: boolean; onChange: () => void; testId: string }) {
  return <div className="flex items-center gap-4 px-5 py-4"><div className="hidden size-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] sm:flex"><Icon size={15} /></div><div className="min-w-0 flex-1"><div className="text-[11px] font-bold">{title}</div><div className="mt-1 max-w-[550px] text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">{detail}</div></div><button type="button" role="switch" aria-checked={checked} onClick={onChange} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--muted-foreground)/.3)]'}`} data-testid={testId}><span className={`absolute top-1 size-4 rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>;
}