export const TOKEN_STORAGE_KEY = 'gg_auth_token';
export const USER_STORAGE_KEY = 'gg_auth_user';
export const SUBMITTED_DEADLINES_KEY = 'gg_submitted_deadlines';
export const CITATION_JUDGMENTS_KEY = 'gg_citation_judgments';
export const LOCAL_ACTIVITIES_KEY = 'gg_local_activities';
export const LOCAL_CITATIONS_KEY = 'gg_local_citations';
export const LOCAL_DEADLINES_KEY = 'gg_local_deadlines';

export function getActiveUserSlug(): string {
  if (typeof window === 'undefined') return 'elena';
  const slug = localStorage.getItem('gg_persona_slug');
  if (slug) return slug;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (raw) {
    try {
      const u = JSON.parse(raw);
      if (u.tenantSlug) return u.tenantSlug;
      if (u.id) return String(u.id);
    } catch {}
  }
  return 'elena';
}

export function getActiveAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window === 'undefined') return headers;

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const userSlug = getActiveUserSlug();
  headers['x-user-id'] = userSlug;

  return headers;
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const headers = {
    ...getActiveAuthHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      error: !res.ok ? (data?.error || `HTTP ${res.status}`) : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network error',
    };
  }
}

// ==========================================
// Per-account Submitted Deadlines Persistence
// ==========================================

export function getSubmittedDeadlineIds(userSlug?: string): Set<number> {
  if (typeof window === 'undefined') return new Set();
  const slug = userSlug || getActiveUserSlug();
  const key = `${SUBMITTED_DEADLINES_KEY}_${slug}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(Number) : []);
  } catch {
    return new Set();
  }
}

export function markDeadlineSubmittedLocal(id: number, userSlug?: string) {
  if (typeof window === 'undefined') return;
  const slug = userSlug || getActiveUserSlug();
  const key = `${SUBMITTED_DEADLINES_KEY}_${slug}`;
  try {
    const ids = getSubmittedDeadlineIds(slug);
    ids.add(Number(id));
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function isDeadlineSubmittedLocal(id: number, userSlug?: string): boolean {
  return getSubmittedDeadlineIds(userSlug).has(Number(id));
}

// ==========================================
// Per-account Imported Citations Persistence
// ==========================================

export function getLocalCitations(userSlug?: string): any[] {
  if (typeof window === 'undefined') return [];
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_CITATIONS_KEY}_${slug}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalCitation(citation: any, userSlug?: string) {
  if (typeof window === 'undefined') return;
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_CITATIONS_KEY}_${slug}`;
  try {
    const all = getLocalCitations(slug);
    const normalizedDoi = String(citation.doi || '').trim().toLowerCase();
    const exists = all.some((c: any) =>
      (normalizedDoi && String(c.doi || '').trim().toLowerCase() === normalizedDoi) ||
      c.id === citation.id
    );
    if (!exists) {
      all.push({
        ...citation,
        id: citation.id || Date.now(),
        userSlug: slug,
        createdAt: citation.createdAt || new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(all));
    }
  } catch {}
}

// ==========================================
// Per-account Custom Deadlines Persistence
// ==========================================

export function getLocalDeadlines(userSlug?: string): any[] {
  if (typeof window === 'undefined') return [];
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_DEADLINES_KEY}_${slug}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalDeadline(deadline: any, userSlug?: string) {
  if (typeof window === 'undefined') return;
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_DEADLINES_KEY}_${slug}`;
  try {
    const all = getLocalDeadlines(slug);
    all.push({
      ...deadline,
      id: deadline.id || Date.now(),
      userSlug: slug,
    });
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
}

// ==========================================
// Per-account Citation Judgments Persistence
// ==========================================

export interface LocalJudgment {
  id: number;
  judgment: 'relevant' | 'not_relevant' | 'deferred';
  notes?: string;
  savedAt: string;
}

export function getLocalJudgments(userSlug?: string): Record<number, LocalJudgment> {
  if (typeof window === 'undefined') return {};
  const slug = userSlug || getActiveUserSlug();
  const key = `${CITATION_JUDGMENTS_KEY}_${slug}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalJudgment(
  id: number,
  judgment: 'relevant' | 'not_relevant' | 'deferred',
  notes?: string,
  userSlug?: string
) {
  if (typeof window === 'undefined') return;
  const slug = userSlug || getActiveUserSlug();
  const key = `${CITATION_JUDGMENTS_KEY}_${slug}`;
  try {
    const all = getLocalJudgments(slug);
    all[id] = { id, judgment, notes, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
}

// ==========================================
// Per-account Decision Log & Activities Persistence
// ==========================================

export function getLocalActivities(userSlug?: string): any[] {
  if (typeof window === 'undefined') return [];
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_ACTIVITIES_KEY}_${slug}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalActivity(
  activity: {
    title: string;
    description: string;
    kind?: string;
    tone?: string;
  },
  userSlug?: string
) {
  if (typeof window === 'undefined') return;
  const slug = userSlug || getActiveUserSlug();
  const key = `${LOCAL_ACTIVITIES_KEY}_${slug}`;
  try {
    const all = getLocalActivities(slug);
    const newAct = {
      id: Date.now(),
      title: activity.title,
      description: activity.description,
      kind: activity.kind || 'clear',
      tone: activity.tone || 'success',
      createdAt: new Date().toISOString(),
      userSlug: slug,
    };
    all.unshift(newAct);
    localStorage.setItem(key, JSON.stringify(all.slice(0, 50)));
  } catch {}
}
