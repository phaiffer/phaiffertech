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

// PetFlow owns the visible follow-up surface now. CRM endpoints remain behind
// this adapter until the backend persistence layer is absorbed safely.
export const petFollowUpService = {
  listTasks: crmService.listTasks,
  createTask: crmService.createTask,
  updateTask: crmService.updateTask,
  deleteTask: crmService.deleteTask,
  listNotes: crmService.listNotes,
  createNote: crmService.createNote,
  updateNote: crmService.updateNote,
  deleteNote: crmService.deleteNote,
  listActivity: crmService.listActivity
};
