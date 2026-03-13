import { clearSession, getSession, setSession } from '@/shared/lib/session';
import { logClientError, logClientInfo } from '@/shared/observability/client-logger';
import { AuthTokenResponse, SessionState } from '@/shared/types/auth';
import { ApiEnvelope, ApiErrorEnvelope } from '@/shared/types/common';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
let refreshSessionPromise: Promise<SessionState | null> | null = null;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

function buildHeaders(options: RequestOptions, session: SessionState | null): Headers {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    headers.set('X-Tenant-Id', session.user.tenantId);
  }

  return headers;
}

async function performFetch(path: string, options: RequestOptions, sessionOverride?: SessionState | null): Promise<Response> {
  const headers = buildHeaders(options, sessionOverride ?? getSession());

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: options.credentials ?? 'include',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    logClientError('apiClient', 'Network request failed', {
      path,
      method: options.method ?? 'GET',
      error: error instanceof Error ? error.message : 'unknown'
    });
    throw new ApiClientError(
      'Falha de comunicação com a API. O backend pode estar inicializando ou indisponível.',
      0,
      'NETWORK_ERROR'
    );
  }

  return response;
}

async function parseErrorEnvelope(response: Response): Promise<ApiErrorEnvelope | null> {
  try {
    return (await response.json()) as ApiErrorEnvelope;
  } catch {
    return null;
  }
}

async function parseSuccessEnvelope<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  const envelope = JSON.parse(raw) as ApiEnvelope<T>;
  return envelope.data;
}

async function refreshSession(): Promise<SessionState | null> {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  const session = getSession();
  if (!session?.accessToken) {
    clearSession();
    return null;
  }

  refreshSessionPromise = (async () => {
    try {
      const response = await performFetch('/auth/refresh', {
        method: 'POST',
        skipAuth: true
      }, null);

      if (!response.ok) {
        clearSession();
        return null;
      }

      const tokenData = await parseSuccessEnvelope<AuthTokenResponse>(response);
      const refreshedSession: SessionState = {
        accessToken: tokenData.accessToken,
        user: tokenData.user
      };

      setSession(refreshedSession);
      return refreshedSession;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshSessionPromise = null;
    }
  })();

  return refreshSessionPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, allowRefresh = true): Promise<T> {
  const response = await performFetch(path, options);

  if (!response.ok) {
    const payload = await parseErrorEnvelope(response);

    if (response.status === 401 && allowRefresh && !options.skipAuth) {
      const refreshedSession = await refreshSession();
      if (refreshedSession) {
        return request<T>(path, options, false);
      }
    }

    if (response.status === 401) {
      clearSession();
    }

    logClientInfo('apiClient', 'API request failed', {
      path,
      method: options.method ?? 'GET',
      status: response.status,
      code: payload?.code
    });

    throw new ApiClientError(
      payload?.message ?? 'Erro inesperado da API.',
      response.status,
      payload?.code,
      payload?.details
    );
  }

  return parseSuccessEnvelope<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' })
};
