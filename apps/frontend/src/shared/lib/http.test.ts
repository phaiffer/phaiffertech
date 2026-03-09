import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/lib/http';
import { getSession, setSession } from '@/shared/lib/session';
import { SessionState } from '@/shared/types/auth';

const sessionFixture: SessionState = {
  accessToken: 'expired-access-token',
  refreshToken: 'refresh-token',
  user: {
    userId: 'user-1',
    email: 'admin@local.test',
    fullName: 'Admin Local',
    tenantId: 'tenant-1',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['tenant.read']
  }
};

const refreshedSession: SessionState = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  user: {
    ...sessionFixture.user,
    fullName: 'Admin Refreshed'
  }
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function headerValue(input: RequestInit | undefined, headerName: string): string | null {
  return new Headers(input?.headers).get(headerName);
}

describe('apiClient refresh flow', () => {
  beforeEach(() => {
    setSession(sessionFixture);
  });

  it('faz refresh no primeiro 401, atualiza a sessao e repete a request original', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication is required.',
        timestamp: '2026-03-09T00:00:00Z'
      }, 401))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: {
          accessToken: refreshedSession.accessToken,
          refreshToken: refreshedSession.refreshToken,
          expiresInSeconds: 300,
          user: refreshedSession.user
        },
        timestamp: '2026-03-09T00:00:01Z'
      }, 200))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: {
          status: 'ok'
        },
        timestamp: '2026-03-09T00:00:02Z'
      }, 200));

    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.get<{ status: string }>('/protected-resource');

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8080/api/v1/protected-resource');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:8080/api/v1/auth/refresh');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('http://localhost:8080/api/v1/protected-resource');
    expect(headerValue(fetchMock.mock.calls[0]?.[1], 'Authorization')).toBe('Bearer expired-access-token');
    expect(headerValue(fetchMock.mock.calls[2]?.[1], 'Authorization')).toBe('Bearer new-access-token');
    expect(getSession()).toEqual(refreshedSession);

    const refreshRequest = fetchMock.mock.calls[1]?.[1];
    expect(refreshRequest?.body).toBe(JSON.stringify({ refreshToken: 'refresh-token' }));
  });
});
