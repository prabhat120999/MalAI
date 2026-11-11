
export interface ApiErrorResponse {
    error?: {
      code?: string;
      message?: string;
    };
  }
  
  export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
  
    constructor(
      message: string,
      status: number,
      code: string = 'unknown_error',
    ) {
      super(message);
  
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
  
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  
  export interface Money {
    amountMinor: number;
    currency: string;
  }
  
  export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
  