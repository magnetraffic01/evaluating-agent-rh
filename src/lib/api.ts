// src/lib/api.ts
// Cliente HTTP unico hacia el backend Express del proyecto magnetraffic-hr.
// Reemplaza al cliente Supabase. Auth via JWT en localStorage (`hr_admin_token`).

const RAW_BASE = (import.meta.env.VITE_HR_API_URL ?? 'http://localhost:3001') as string;
export const API_BASE_URL: string = RAW_BASE.replace(/\/+$/, '');

const TOKEN_KEY = 'hr_admin_token';

// ─── Tipos de dominio ─────────────────────────────────────────────────────────

export type EvaluationStatus =
  | 'en_progreso'
  | 'elite'
  | 'calificado'
  | 'potencial'
  | 'descartado';

export interface Evaluation {
  id: string;
  session_id: string;
  created_at: string;
  completed_at: string | null;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  location: string | null;
  marital_status: string | null;
  daily_calls: number | null;
  last_income: number | null;
  exit_reason: string | null;
  highlight: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  score_total: number;
  score_breakdown: Record<string, number> | null;
  flags: Record<string, boolean> | unknown[] | null;
  status: EvaluationStatus;
  disqualify_reason: string | null;
  current_step: number | null;
  abandon_detected: boolean | number | null;
  ip_address: string | null;
  user_agent: string | null;
  answers: Record<string, unknown> | null;
  assigned_to: string | null;
  interview_status: string | null;
  interview_date: string | null;
  recruiter_notes: string | null;
  last_activity?: string | null;
}

export interface EvaluationListItem {
  id: string;
  session_id: string;
  created_at: string;
  completed_at: string | null;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  location: string | null;
  score_total: number;
  status: EvaluationStatus;
  assigned_to: string | null;
  interview_status: string | null;
  interview_date: string | null;
}

export interface EvaluationCreateBody {
  session_id?: string;
  name: string;
  phone: string;
  email?: string | null;
  age?: number | null;
  location?: string | null;
  marital_status?: string | null;
  daily_calls?: number | null;
  last_income?: number | null;
  exit_reason?: string | null;
  highlight?: string | null;
  cv_url?: string | null;
  linkedin_url?: string | null;
  score_total?: number;
  score_breakdown?: Record<string, unknown>;
  flags?: unknown[] | Record<string, unknown>;
  status?: string | null;
  current_step?: number | null;
  abandon_detected?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  answers?: Record<string, unknown>;
  completed_at?: string | null;
}

export interface EvaluationUpdateBody {
  status?: string | null;
  disqualify_reason?: string | null;
  assigned_to?: string | null;
  interview_status?: string | null;
  interview_date?: string | null;
  recruiter_notes?: string | null;
  score_total?: number;
  score_breakdown?: Record<string, unknown>;
  flags?: unknown[] | Record<string, unknown>;
  current_step?: number | null;
  abandon_detected?: boolean;
  completed_at?: string | null;
  answers?: Record<string, unknown>;
}

export interface EvaluationsListResponse {
  rows: EvaluationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface Recruiter {
  id: string;
  name: string;
  label: string;
  calendar_url: string;
  weight: number;
  active: boolean | number;
  total_assigned: number;
  notes?: string | null;
  created_at?: string;
}

export interface RecruiterAssignment {
  label: string;
  calendar_url: string;
}

export interface RecruiterCreateBody {
  name: string;
  label: string;
  calendar_url: string;
  weight?: number;
  active?: boolean;
  notes?: string | null;
}

export interface RecruiterUpdateBody {
  name?: string;
  calendar_url?: string;
  weight?: number;
  active?: boolean;
  notes?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  created_at?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AdminUser;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size?: number;
  mime?: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage may be disabled */
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code: string | null;
  details: unknown;

  constructor(status: number, message: string, code: string | null = null, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Manejo de 401 ────────────────────────────────────────────────────────────

function handleUnauthorized(): void {
  clearToken();
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  // Solo redirige rutas privadas; evita loops si ya estamos en login.
  if (path.startsWith('/admin') && path !== '/admin/login') {
    window.location.assign('/admin/login');
  } else if (path.startsWith('/portal') && path !== '/portal') {
    window.location.assign('/portal');
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Si true, no agrega Authorization aunque haya token. */
  anonymous?: boolean;
  /** Permite mandar FormData sin que se serialize. */
  formData?: FormData;
  /** Si true, no redirige a login en 401 (útil para `auth.me()` opcional). */
  silent401?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };

  if (!opts.anonymous) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
    // No setear Content-Type — el browser pone el boundary.
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body,
    });
  } catch (e) {
    throw new ApiError(0, 'No se pudo conectar con el servidor.', 'network_error', e);
  }

  if (res.status === 401 && !opts.silent401) {
    handleUnauthorized();
    throw new ApiError(401, 'Sesión expirada o no autorizado.', 'unauthorized');
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const payload = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
    const code = typeof payload.error === 'string' ? payload.error : null;
    const message = code ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, code, payload.details ?? parsed);
  }

  return parsed as T;
}

// ─── Helpers genéricos ────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...(opts ?? {}), method: 'GET' });
  },
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...(opts ?? {}), method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...(opts ?? {}), method: 'PATCH', body });
  },
  delete<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...(opts ?? {}), method: 'DELETE' });
  },
  upload<T>(path: string, file: File, fieldName = 'file', opts?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) {
    const fd = new FormData();
    fd.append(fieldName, file);
    return request<T>(path, { ...(opts ?? {}), method: 'POST', formData: fd });
  },
};

// ─── Funciones de dominio ─────────────────────────────────────────────────────

export interface EvaluationsListParams {
  status?: string;
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of entries) usp.append(k, String(v));
  return `?${usp.toString()}`;
}

export const evaluations = {
  create(payload: EvaluationCreateBody) {
    return api.post<{ id: string; session_id: string }>('/api/hr/evaluations', payload, { anonymous: true });
  },
  list(params: EvaluationsListParams = {}) {
    return api.get<EvaluationsListResponse>(`/api/hr/evaluations${qs({
      status:      params.status,
      assigned_to: params.assigned_to,
      limit:       params.limit,
      offset:      params.offset,
    })}`);
  },
  get(id: string) {
    return api.get<Evaluation>(`/api/hr/evaluations/${encodeURIComponent(id)}`);
  },
  update(id: string, patch: EvaluationUpdateBody) {
    return api.patch<{ ok: true }>(`/api/hr/evaluations/${encodeURIComponent(id)}`, patch);
  },
};

export const recruiters = {
  assign() {
    return api.post<RecruiterAssignment>('/api/hr/recruiters/assign', undefined, { anonymous: true });
  },
  list() {
    return api.get<{ rows: Recruiter[] }>('/api/hr/recruiters');
  },
  create(payload: RecruiterCreateBody) {
    return api.post<{ id: string }>('/api/hr/recruiters', payload);
  },
  update(id: string, patch: RecruiterUpdateBody) {
    return api.patch<{ ok: true }>(`/api/hr/recruiters/${encodeURIComponent(id)}`, patch);
  },
};

export const auth = {
  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const res = await api.post<AuthLoginResponse>('/api/hr/auth/login', { email, password }, { anonymous: true });
    if (res?.token) setToken(res.token);
    return res;
  },
  me() {
    return api.get<{ user: AdminUser }>('/api/hr/auth/me');
  },
  async logout(): Promise<void> {
    try {
      await api.post<{ ok: true }>('/api/hr/auth/logout', undefined, { silent401: true });
    } catch {
      /* tolerar errores de red — siempre limpiamos token igual */
    }
    clearToken();
  },
  isAuthenticated(): boolean {
    return !!getToken();
  },
};

export const storage = {
  upload(file: File) {
    return api.upload<UploadResponse>('/api/hr/storage/upload', file, 'file', { anonymous: true });
  },
};

// Default export — ergonomía para `import api from '@/lib/api'`
const apiClient = {
  ...api,
  evaluations,
  recruiters,
  auth,
  storage,
  getToken,
  setToken,
  clearToken,
  ApiError,
  BASE_URL: API_BASE_URL,
};

export default apiClient;
