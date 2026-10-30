import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crmService } from '@/shared/services/crm-service';
import { petFollowUpService } from '@/shared/services/pet-follow-up-service';

vi.mock('@/shared/services/crm-service', () => ({
  crmService: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    listNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    listActivity: vi.fn()
  }
}));

describe('petFollowUpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pins task listing to PET relations while keeping the caller filters', async () => {
    await petFollowUpService.listTasks(1, 10, 'banho', { status: 'OPEN', relatedReferenceType: 'PET.CLIENT' });

    expect(crmService.listTasks).toHaveBeenCalledWith(1, 10, 'banho', {
      status: 'OPEN',
      relatedReferenceType: 'PET.CLIENT',
      relatedModule: 'PET'
    });
  });

  it('pins note listing to PET relations even when no filters are given', async () => {
    await petFollowUpService.listNotes();

    expect(crmService.listNotes).toHaveBeenCalledWith(0, 20, '', { relatedModule: 'PET' });
  });
});
