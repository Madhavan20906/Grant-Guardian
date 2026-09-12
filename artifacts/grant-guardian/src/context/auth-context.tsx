import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthTokenGetter, setUserGetter } from '@workspace/api-client-react';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  title: string;
  labName: string;
  institution: string;
  focus: string;
  proposalName: string;
  initials: string;
  tenantSlug: string;
  createdAt?: string | Date;
}

export interface Persona {
  id: number;
  slug: string;
  name: string;
  title: string;
  lab: string;
  institution: string;
  initials: string;
  focus: string;
  role: string;
  workspace: string;
}

export const FALLBACK_DEMO_USERS: UserProfile[] = [
  {
    id: 1,
    email: 'elena.rossi@example.org',
    name: 'Elena Rossi',
    role: 'PI',
    title: 'Dr. Elena Rossi',
    labName: 'Materials Science & Biomaterials Lab',
    institution: 'Institute for Bioengineering',
    focus: 'Tissue Engineering & Regenerative Scaffolds',
    proposalName: 'NSF CAREER Proposal (Biomaterials)',
    initials: 'ER',
    tenantSlug: 'elena',
  },
  {
    id: 2,
    email: 'marcus.chen@example.org',
    name: 'Marcus Chen',
    role: 'PI',
    title: 'Dr. Marcus Chen',
    labName: 'Computational Oncology & Genomics Lab',
    institution: 'Comprehensive Cancer Center',
    focus: 'Cancer Biomarkers & Clinical Microarrays',
    proposalName: 'NIH R01 Proposal (Computational Oncology)',
    initials: 'MC',
    tenantSlug: 'marcus',
  },
  {
    id: 3,
    email: 'sarah.jenkins@example.org',
    name: 'Sarah Jenkins',
    role: 'Assoc. Prof',
    title: 'Dr. Sarah Jenkins',
    labName: 'Neurobiology & Molecular Therapeutics Lab',
    institution: 'School of Medicine & Health Sciences',
    focus: 'Translational Medicine & COVID-19 Therapeutics',
    proposalName: 'NIH R21 Proposal (Translational Neuro)',
    initials: 'SJ',
    tenantSlug: 'sarah',
  },
  {
    id: 4,
    email: 'new.pi@example.org',
    name: 'New Researcher',
    role: 'PI',
    title: 'First-Time PI (Blank State)',
    labName: 'Your Laboratory / Blank Workspace',
    institution: 'Your Research Institution',
    focus: 'Custom Grant Literature & Deadlines',
    proposalName: 'Custom Grant Workspace',
    initials: 'PI',
    tenantSlug: 'new-lab',
  },
];

export function toPersona(user: UserProfile): Persona {
  return {
    id: user.id,
    slug: user.tenantSlug,
    name: user.name,
    title: user.title,
    lab: user.labName,
    institution: user.institution,
    initials: user.initials,
    focus: user.focus,
    role: user.role === 'PI' ? 'Principal Investigator' : user.role,
    workspace: user.proposalName,
  };
}

interface AuthContextValue {
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenants: UserProfile[];
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    title?: string;
    labName?: string;
    institution?: string;
    focus?: string;
    proposalName?: string;
    starterTemplate?: string;
  }) => Promise<void>;
  demoLogin: (slugOrId: string | number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  // Compatibility with existing persona usage
  activePersona: Persona;
  personas: Persona[];
  selectPersona: (slugOrId: string | number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'gg_auth_token';
const USER_STORAGE_KEY = 'gg_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return FALLBACK_DEMO_USERS[0];
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  });

  const [tenants, setTenants] = useState<UserProfile[]>(FALLBACK_DEMO_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Keep API client synchronised
  useEffect(() => {
    setAuthTokenGetter(() => token);
    setUserGetter(() => user.tenantSlug || user.id);

    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('gg_persona_slug', user.tenantSlug);

      const url = new URL(window.location.href);
      if (url.searchParams.get('user') !== user.tenantSlug) {
        url.searchParams.set('user', user.tenantSlug);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [user, token]);

  // Load available demo accounts from server on startup
  useEffect(() => {
    fetch('/api/auth/demo-accounts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data);
        }
      })
      .catch(() => {});
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      queryClient.invalidateQueries();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    title?: string;
    labName?: string;
    institution?: string;
    focus?: string;
    proposalName?: string;
    starterTemplate?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        const detailMsg = Array.isArray(data.details) ? `: ${data.details.join(', ')}` : '';
        throw new Error((data.error || 'Registration failed') + detailMsg);
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      queryClient.invalidateQueries();
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (slugOrId: string | number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugOrId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      queryClient.invalidateQueries();
    } catch {
      // Offline fallback
      const clean = String(slugOrId).trim().toLowerCase();
      const match = tenants.find((t) => t.tenantSlug === clean || String(t.id) === clean || t.name.toLowerCase().includes(clean));
      if (match) {
        setUser(match);
        queryClient.invalidateQueries();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (fields: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setUser(data.user);
      queryClient.invalidateQueries();
    } catch (err: any) {
      // Local optimistic update
      setUser((prev) => ({ ...prev, ...fields }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    // Switch to first demo profile or blank
    setUser(FALLBACK_DEMO_USERS[0]);
    queryClient.invalidateQueries();
  };

  // Backwards compatibility mappings
  const activePersona = toPersona(user);
  const personas = tenants.map(toPersona);

  const selectPersona = (slugOrId: string | number) => {
    demoLogin(slugOrId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        tenants,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        demoLogin,
        updateProfile,
        logout,
        activePersona,
        personas,
        selectPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function usePersona() {
  return useAuth();
}
