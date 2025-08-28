export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Meta = {
  traceId: string;
  pagination?: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Meta;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    fields?: Array<{
      path: string;
      message: string;
      code?: string;
    }>;
  };
  meta?: Meta;
};
