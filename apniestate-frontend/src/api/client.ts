const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface CacheEntry<T> {
  data: ApiResponse<T>;
  timestamp: number;
}

interface GetOptions {
  ttl?: number;
  noCache?: boolean;
}

class ApiClient {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();
  private defaultTtl = 30000; // 30 seconds default in-memory cache

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Clears in-memory cache. If a pattern is provided, clears matching keys.
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private invalidateForEndpoint(endpoint: string): void {
    // Determine base resource path (e.g., /cashbook, /finance, /dues, /projects)
    const base = endpoint.split('?')[0].split('/')[1];
    if (base) {
      this.clearCache(`/${base}`);
    } else {
      this.clearCache();
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      // Retry on 5xx server errors
      if (response.status >= 500 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return this.request<T>(endpoint, options, retries - 1);
      }

      if (response.status === 204) {
        return { success: true };
      }

      let json;
      try {
        json = await response.json();
      } catch (e) {
        throw new ApiError('Invalid JSON response from server', response.status);
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const errorMsg =
          (typeof json?.error === 'string' ? json.error : json?.error?.message) ||
          json?.message ||
          'Something went wrong';

        throw new ApiError(
          errorMsg,
          response.status,
          typeof json?.error === 'object' ? json.error?.code : undefined
        );
      }

      return json;
    } catch (error) {
      // Retry on Network Errors (fetch throws TypeError)
      if (error instanceof TypeError && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return this.request<T>(endpoint, options, retries - 1);
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network Error or Backend Unavailable', 0);
    }
  }

  async get<T>(endpoint: string, getOptions?: GetOptions): Promise<ApiResponse<T>> {
    const ttl = getOptions?.ttl ?? this.defaultTtl;
    const noCache = getOptions?.noCache ?? false;
    const cacheKey = endpoint;

    // 1. Check in-memory cache if not bypassed
    if (!noCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < ttl) {
          // Fresh cache hit - return instantly (0ms)
          return cached.data;
        } else if (age < ttl * 3) {
          // SWR: return stale data immediately and refresh silently in background
          this.fetchAndCache<T>(endpoint, cacheKey).catch(() => {});
          return cached.data;
        }
      }
    }

    // 2. In-flight request deduplication
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Perform network fetch
    const fetchPromise = this.fetchAndCache<T>(endpoint, cacheKey);
    this.inFlightRequests.set(cacheKey, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private async fetchAndCache<T>(endpoint: string, cacheKey: string): Promise<ApiResponse<T>> {
    const res = await this.request<T>(endpoint, { method: 'GET' });
    if (res.success && res.data !== undefined) {
      this.cache.set(cacheKey, { data: res, timestamp: Date.now() });
    }
    return res;
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    this.invalidateForEndpoint(endpoint);
    return res;
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    this.invalidateForEndpoint(endpoint);
    return res;
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    this.invalidateForEndpoint(endpoint);
    return res;
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const json = await response.json();
    if (!response.ok) {
      const errorMsg =
        (typeof json?.error === 'string' ? json.error : json?.error?.message) ||
        json?.message ||
        'Upload failed';
      throw new ApiError(errorMsg, response.status);
    }
    this.invalidateForEndpoint(endpoint);
    return json;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await this.request<T>(endpoint, { method: 'DELETE' });
    this.invalidateForEndpoint(endpoint);
    return res;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse };

