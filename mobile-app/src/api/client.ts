import type { AuthResponse } from './types';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000';

export const WS_URL: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ||
  `${API_URL.replace(/^http/, 'ws')}/ws`;

export const STRIPE_PUBLISHABLE_KEY: string =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) || '';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  get user(): string | null {
    return localStorage.getItem(USER_KEY);
  },
  set(access: string, refresh?: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  setUser(user: unknown): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as AuthResponse;
        tokenStore.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';

    const token = tokenStore.access;
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;

    return fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth && !path.startsWith('/auth/')) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch();
    }
  }

  const payload = await parse(res);

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

export { qs };
