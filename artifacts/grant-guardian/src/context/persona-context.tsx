import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUserGetter } from '@workspace/api-client-react';

export interface Persona {
  id: number;
  slug: string;
  name: string;
  title: string;
  lab: string;
  initials: string;
  focus: string;
  role: string;
  workspace?: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 1,
    slug: 'elena',
    name: 'Elena Rossi',
    title: 'Dr. Elena Rossi',
    lab: 'Materials Science & Biomaterials Lab',
    initials: 'ER',
    focus: 'Tissue Engineering & Regenerative Scaffolds',
    role: 'Principal Investigator',
    workspace: 'NSF CAREER Proposal (Materials Lab)',
  },
  {
    id: 2,
    slug: 'marcus',
    name: 'Marcus Chen',
    title: 'Dr. Marcus Chen',
    lab: 'Computational Oncology & Genomics Lab',
    initials: 'MC',
    focus: 'Cancer Biomarkers & Clinical Microarrays',
    role: 'Principal Investigator',
    workspace: 'NIH R01 Proposal (Computational Oncology)',
  },
  {
    id: 3,
    slug: 'sarah',
    name: 'Sarah Jenkins',
    title: 'Dr. Sarah Jenkins',
    lab: 'Neurobiology & Molecular Therapeutics Lab',
    initials: 'SJ',
    focus: 'Translational Medicine & COVID-19 Therapeutics',
    role: 'Associate Professor',
    workspace: 'NIH R21 Proposal (Genomics Lab)',
  },
  {
    id: 4,
    slug: 'new-lab',
    name: 'New Researcher',
    title: 'First-Time PI (Blank State)',
    lab: 'Your Laboratory / Blank Workspace',
    initials: 'PI',
    focus: 'Custom Grant Literature & Deadlines',
    role: 'Principal Investigator',
    workspace: 'New Grant Workspace (Unseeded)',
  },
];

interface PersonaContextValue {
  activePersona: Persona;
  personas: Persona[];
  selectPersona: (slugOrId: string | number) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

function resolveInitialPersona(): Persona {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user') || params.get('u');
    if (userParam) {
      const clean = userParam.trim().toLowerCase();
      const bySlug = PERSONAS.find(
        (p) => p.slug === clean || String(p.id) === clean || p.name.toLowerCase().includes(clean)
      );
      if (bySlug) return bySlug;
    }
    const stored = localStorage.getItem('gg_persona_slug');
    if (stored) {
      const byStored = PERSONAS.find((p) => p.slug === stored);
      if (byStored) return byStored;
    }
  }
  return PERSONAS[0];
}

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [activePersona, setActivePersona] = useState<Persona>(resolveInitialPersona);
  const queryClient = useQueryClient();

  useEffect(() => {
    setUserGetter(() => activePersona.slug);
    localStorage.setItem('gg_persona_slug', activePersona.slug);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('user') !== activePersona.slug) {
        url.searchParams.set('user', activePersona.slug);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activePersona]);

  const selectPersona = (slugOrId: string | number) => {
    const clean = String(slugOrId).trim().toLowerCase();
    const target = PERSONAS.find(
      (p) => p.slug === clean || String(p.id) === clean || p.name.toLowerCase().includes(clean)
    );
    if (target && target.slug !== activePersona.slug) {
      setActivePersona(target);
      setUserGetter(() => target.slug);
      queryClient.invalidateQueries();
    }
  };

  return (
    <PersonaContext.Provider value={{ activePersona, personas: PERSONAS, selectPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return ctx;
}
