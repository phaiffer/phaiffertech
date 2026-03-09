import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TenantsPage from '@/app/(app)/tenants/page';
import { tenantService } from '@/shared/services/tenant-service';

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: vi.fn().mockReturnValue(false),
    hasAnyPermission: vi.fn().mockReturnValue(false)
  })
}));

vi.mock('@/shared/services/tenant-service', () => ({
  tenantService: {
    list: vi.fn()
  }
}));

describe('TenantsPage authorization', () => {
  it('nao chama tenantService.list sem TENANT_READ', async () => {
    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText('Você não possui permissão para visualizar tenants.')).toBeInTheDocument();
    });

    expect(tenantService.list).not.toHaveBeenCalled();
  });
});
