export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  requestId?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Array<{ field: string; message: string }>;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ResponseBuilder {
  private response: ApiResponse = {
    success: false,
    timestamp: new Date().toISOString()
  };

  static success<T>(data?: T): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.response.success = true;
    if (data !== undefined) {
      builder.response.data = data;
    }
    return builder;
  }

  static error(message: string): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.response.success = false;
    builder.response.error = message;
    return builder;
  }

  static validationError(errors: Array<{ field: string; message: string }>): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.response.success = false;
    builder.response.error = 'Erreur de validation';
    builder.response.errors = errors;
    return builder;
  }

  message(message: string): ResponseBuilder {
    this.response.message = message;
    return this;
  }

  requestId(id: string): ResponseBuilder {
    this.response.requestId = id;
    return this;
  }

  pagination(page: number, limit: number, total: number): ResponseBuilder {
    this.response.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
    return this;
  }

  meta(meta: Record<string, any>): ResponseBuilder {
    this.response.meta = meta;
    return this;
  }

  build(): ApiResponse {
    return this.response;
  }
}

export const createSuccessResponse = <T>(data?: T, message?: string): ApiResponse<T> => {
  return ResponseBuilder.success(data).message(message || '').build();
};

export const createErrorResponse = (message: string, errors?: Array<{ field: string; message: string }>): ApiResponse => {
  if (errors) {
    return ResponseBuilder.validationError(errors).build();
  }
  return ResponseBuilder.error(message).build();
};