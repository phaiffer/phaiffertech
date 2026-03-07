import { clearSession, getSession } from '@/shared/lib/session';
import { logClientError, logClientInfo } from '@/shared/observability/client-logger';
import { ApiEnvelope, ApiErrorEnvelope } from '@/shared/types/common';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (!options.skipAuth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    headers.set('X-Tenant-Id', session.user.tenantId);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
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

  if (!response.ok) {
    let payload: ApiErrorEnvelope | null = null;
    try {
      payload = (await response.json()) as ApiErrorEnvelope;
    } catch {
      payload = null;
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
