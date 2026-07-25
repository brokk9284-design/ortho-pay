export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    database: "up" | "down";
    redis: "up" | "down";
    email: "up" | "down";
    sms: "up" | "down";
  };
  timestamp: string;
}
