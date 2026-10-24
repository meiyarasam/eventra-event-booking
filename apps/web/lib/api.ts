export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export class ApiError extends Error {
  public status: number;
  public details?: any;
  public code?: string;

  constructor(message: string, status: number, details?: any, code?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach stored access token if present
  if (typeof window !== 'undefined' && !headers.has('Authorization')) {
    const token = localStorage.getItem('eventra_access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // include HTTP-only cookies
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized with automatic refresh token attempt
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/register')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData?.data?.accessToken && typeof window !== 'undefined') {
              localStorage.setItem('eventra_access_token', refreshData.data.accessToken);
            }
            processQueue(null);
            isRefreshing = false;
            // Retry original request
            return apiClient<T>(endpoint, options);
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          processQueue(refreshErr);
          isRefreshing = false;
          // Refresh failed - user must log in again
          throw new ApiError('Session expired. Please log in again.', 401);
        }
      } else {
        // Wait for active refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient<T>(endpoint, options)),
            reject: (err) => reject(err),
          });
        });
      }
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        data?.error?.message || data?.message || `HTTP ${response.status}: Request failed`;
      throw new ApiError(errorMessage, response.status, data?.error?.details, data?.error?.code);
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0);
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET', params }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
