import { HTTP_STATUS } from "./status-code";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.NOT_FOUND, "NOT_FOUND", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.BAD_REQUEST, "VALIDATION_ERROR", message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.CONFLICT, "CONFLICT", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.UNAUTHORIZED, "UNAUTHORIZED", message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.FORBIDDEN, "FORBIDDEN", message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, details?: unknown) {
    super(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "INTERNAL_SERVER_ERROR",
      message,
      details
    );
  }
}
