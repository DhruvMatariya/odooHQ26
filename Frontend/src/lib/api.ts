/**
 * api.ts — Centralised fetch client for TransitOps
 *
 * All requests go through `apiFetch`, which:
 *  - Prepends VITE_API_BASE_URL automatically
 *  - Attaches the Bearer token from localStorage when present
 *  - Parses JSON responses and throws ApiError on non-2xx
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/** Token helpers — token lives in localStorage under this key */
const TOKEN_KEY = 'transit_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** ------------------------------------------------------------------ *
 *  ApiError — thrown for any non-2xx response                          *
 * ------------------------------------------------------------------ */
export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    /** Per-field validation errors from the backend `errors[]` array */
    public fieldErrors: Record<string, string> = {},
  ) {
    super(title);
    this.name = 'ApiError';
  }
}

/** ------------------------------------------------------------------ *
 *  Core fetch wrapper                                                   *
 * ------------------------------------------------------------------ */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Parse JSON body regardless of status (errors also carry JSON)
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    // Convert validation errors array → { field: message } map
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(body.errors)) {
      for (const e of body.errors) {
        if (e.field) fieldErrors[e.field] = e.message;
      }
    }
    throw new ApiError(
      res.status,
      body.title ?? 'Request failed',
      body.detail ?? `HTTP ${res.status}`,
      fieldErrors,
    );
  }

  return body as T;
}

/** ------------------------------------------------------------------ *
 *  Auth API                                                             *
 * ------------------------------------------------------------------ */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

/** POST /auth/login */
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

/** POST /auth/register */
export async function apiRegister(
  name: string,
  email: string,
  password: string,
  role: ApiUser['role'],
): Promise<ApiUser> {
  // Register returns the created user (201), then we need to login to get a token
  const user = await apiFetch<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  // Auto-login after registration to obtain a token
  await apiLogin(email, password);
  return user;
}

/** GET /auth/me — fetch the current user from the token */
export async function apiGetMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/auth/me');
}
