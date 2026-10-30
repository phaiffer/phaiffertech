import {
  crmService,
  CreateNoteInput,
  CreateTaskInput,
  UpdateNoteInput,
  UpdateTaskInput
} from '@/shared/services/crm-service';

export type CreatePetFollowUpTaskInput = CreateTaskInput;
export type UpdatePetFollowUpTaskInput = UpdateTaskInput;
export type CreatePetFollowUpNoteInput = CreateNoteInput;
export type UpdatePetFollowUpNoteInput = UpdateNoteInput;

type TaskFilters = NonNullable<Parameters<typeof crmService.listTasks>[3]>;
type NoteFilters = NonNullable<Parameters<typeof crmService.listNotes>[3]>;

// Gestão Pet owns the visible follow-up surface now. CRM endpoints remain behind
// this adapter until the backend persistence layer is absorbed safely, so lists
// are pinned to PET.* relations and never surface generic CRM records.
const PET_RELATED_MODULE = 'PET';

export const petFollowUpService = {
  listTasks: (page = 0, size = 20, search = '', filters: TaskFilters = {}) =>
    crmService.listTasks(page, size, search, { ...filters, relatedModule: PET_RELATED_MODULE }),
  createTask: crmService.createTask,
  updateTask: crmService.updateTask,
  deleteTask: crmService.deleteTask,
  listNotes: (page = 0, size = 20, search = '', filters: NoteFilters = {}) =>
    crmService.listNotes(page, size, search, { ...filters, relatedModule: PET_RELATED_MODULE }),
  createNote: crmService.createNote,
  updateNote: crmService.updateNote,
  deleteNote: crmService.deleteNote,
  listActivity: crmService.listActivity
};
