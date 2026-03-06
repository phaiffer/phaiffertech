export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

export type PageResponse<T> = {
  items?: T[];
  content?: T[];
  totalItems?: number;
  totalElements?: number;
  totalPages: number;
  page: number;
  size: number;
};

export type ApiErrorEnvelope = {
  success: false;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
};
