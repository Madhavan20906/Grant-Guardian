export const TOKEN_STORAGE_KEY = 'gg_auth_token';
export const USER_STORAGE_KEY = 'gg_auth_user';
export const SUBMITTED_DEADLINES_KEY = 'gg_submitted_deadlines';
export const CITATION_JUDGMENTS_KEY = 'gg_citation_judgments';
export const LOCAL_ACTIVITIES_KEY = 'gg_local_activities';

export function getActiveAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window === 'undefined') return headers;

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let userSlug = localStorage.getItem('gg_persona_slug');
  if (!userSlug) {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        userSlug = u.tenantSlug || String(u.id);
      } catch {}
    }
  }
  if (userSlug) {
    headers['x-user-id'] = userSlug;
  } else {
    headers['x-user-id'] = 'elena';
  }

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

// Submitted deadlines local persistence
export function getSubmittedDeadlineIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SUBMITTED_DEADLINES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(Number) : []);
  } catch {
    return new Set();
  }
}

export function markDeadlineSubmittedLocal(id: number) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getSubmittedDeadlineIds();
    ids.add(Number(id));
    localStorage.setItem(SUBMITTED_DEADLINES_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function isDeadlineSubmittedLocal(id: number): boolean {
  return getSubmittedDeadlineIds().has(Number(id));
}

// Citation judgments local persistence
export interface LocalJudgment {
  id: number;
  judgment: 'relevant' | 'not_relevant' | 'deferred';
  notes?: string;
  savedAt: string;
}

export function getLocalJudgments(): Record<number, LocalJudgment> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CITATION_JUDGMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalJudgment(id: number, judgment: 'relevant' | 'not_relevant' | 'deferred', notes?: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = getLocalJudgments();
    all[id] = { id, judgment, notes, savedAt: new Date().toISOString() };
    localStorage.setItem(CITATION_JUDGMENTS_KEY, JSON.stringify(all));
  } catch {}
}

// Custom activities local persistence
export function getLocalActivities(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalActivity(activity: {
  title: string;
  description: string;
  kind?: string;
  tone?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    const all = getLocalActivities();
    const newAct = {
      id: Date.now(),
      title: activity.title,
      description: activity.description,
      kind: activity.kind || 'clear',
      tone: activity.tone || 'success',
      createdAt: new Date().toISOString(),
    };
    all.unshift(newAct);
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {}
}
