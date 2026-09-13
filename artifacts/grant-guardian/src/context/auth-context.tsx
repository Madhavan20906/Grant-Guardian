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

export const HACKATHON_DEMO_USER: UserProfile = {
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
};

export const FALLBACK_DEMO_USERS: UserProfile[] = [HACKATHON_DEMO_USER];

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
const ACCOUNTS_STORAGE_KEY = 'gg_registered_accounts';

function saveAccountLocally(email: string, password: string, profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    registry[email.toLowerCase()] = { password, profile };
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(registry));
  } catch {}
}

function getAccountLocally(email: string, password: string): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return null;
    const registry = JSON.parse(raw);
    const entry = registry[email.toLowerCase()];
    if (entry && entry.password === password) {
      return entry.profile;
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return HACKATHON_DEMO_USER;
  });

  const [tenants, setTenants] = useState<UserProfile[]>([HACKATHON_DEMO_USER]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Keep API client synchronised
  useEffect(() => {
    setAuthTokenGetter(() => token);
    setUserGetter(() => (token ? user.tenantSlug || user.id : null));

    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem('gg_persona_slug', user.tenantSlug);

        const url = new URL(window.location.href);
        if (url.searchParams.get('user') !== user.tenantSlug) {
          url.searchParams.set('user', user.tenantSlug);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('gg_persona_slug');
        const url = new URL(window.location.href);
        if (url.searchParams.has('user')) {
          url.searchParams.delete('user');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setToken(data.token);
          setUser(data.user);
          saveAccountLocally(cleanEmail, password, data.user);
          setIsAuthModalOpen(false);
          queryClient.invalidateQueries();
          return;
        }
      }
    } catch {
      // Backend offline or unreachable
    }

    // Check local accounts registry for accounts created by the user
    const local = getAccountLocally(cleanEmail, password);
    if (local) {
      const localToken = 'gg-token-' + btoa(`${cleanEmail}:${Date.now()}`);
      setUser(local);
      setToken(localToken);
      setIsAuthModalOpen(false);
      queryClient.invalidateQueries();
      return;
    }

    // Check if it's the safety demo account
    if (cleanEmail === HACKATHON_DEMO_USER.email.toLowerCase()) {
      await demoLogin(HACKATHON_DEMO_USER.tenantSlug);
      return;
    }

    throw new Error('Invalid email or password. Please verify your credentials or create a new lab account.');
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
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanName = formData.name.trim();
    const cleanTitle = formData.title?.trim() || 'Dr.';
    const cleanLab = formData.labName?.trim() || `${cleanName.split(' ').pop() || 'Research'} Lab`;
    const cleanInst = formData.institution?.trim() || 'Research University';
    const cleanFocus = formData.focus?.trim() || 'Grant-Funded Research';
    const cleanProposal = formData.proposalName?.trim() || 'Active Research Proposal';
    const initials =
      cleanName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'PI';
    const tenantSlug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '-') || 'lab';

    // Create the exact user profile with the real data given by the user
    const realUserProfile: UserProfile = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      role: 'PI',
      title: cleanTitle,
      labName: cleanLab,
      institution: cleanInst,
      focus: cleanFocus,
      proposalName: cleanProposal,
      initials,
      tenantSlug,
      createdAt: new Date().toISOString(),
    };

    const localToken = 'gg-token-' + btoa(`${cleanEmail}:${Date.now()}`);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setToken(data.token);
          setUser(data.user);
          saveAccountLocally(cleanEmail, formData.password, data.user);
          setIsAuthModalOpen(false);
          queryClient.invalidateQueries();
          return;
        }
      }
    } catch {
      // Backend offline or unreachable
    }

    // Always succeed with the user's real entered data!
    setUser(realUserProfile);
    setToken(localToken);
    saveAccountLocally(cleanEmail, formData.password, realUserProfile);
    setIsAuthModalOpen(false);
    queryClient.invalidateQueries();
  };

  const demoLogin = async (_slugOrId?: string | number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugOrId: HACKATHON_DEMO_USER.tenantSlug }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setToken(data.token);
          setUser(data.user);
          setIsAuthModalOpen(false);
          queryClient.invalidateQueries();
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Offline hackathon demo safety fallback
    setUser(HACKATHON_DEMO_USER);
    setToken('gg-demo-safety-token');
    setIsAuthModalOpen(false);
    queryClient.invalidateQueries();
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
      setUser((prev) => {
        const updated = { ...prev, ...fields };
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('gg_persona_slug');
      const url = new URL(window.location.href);
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url.toString());
    }
    setUser(HACKATHON_DEMO_USER);
    queryClient.invalidateQueries();
  };

  // Backwards compatibility mappings
  const activePersona = toPersona(user);
  const personas = [toPersona(HACKATHON_DEMO_USER)];

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
        openAuthModal: () => {
          setIsAuthModalOpen(true);
          if (typeof window !== 'undefined') {
            window.location.assign('/auth');
          }
        },
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
