// ─────────────────────────────────────────────────────────────
//  Maarkbh · مركبة — API Client
//  HTTP client for consuming the Maarkbh.API backend
// ─────────────────────────────────────────────────────────────

// Use Next.js proxy to avoid CORS issues
const API_BASE_URL = ''; // Empty string means relative URLs, which will use the Next.js proxy

// JWT Token decoding utilities
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}


export class ApiError extends Error {
  constructor( message: string, public status?: number, public response?:any ){
   super(message);
   this.name = 'ApiError';
  }
}


interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number>;
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from sessionStorage on client side (mirrors AuthContext's session lifecycle)
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('access_token', token);
      } else {
        sessionStorage.removeItem('access_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
    // When using Next.js proxy, prepend '/api' to the endpoint
    const proxyEndpoint = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
    
    let url: string;
    if (this.baseUrl) {
      url = new URL(`${this.baseUrl}${proxyEndpoint}`).toString();
    } else {
      // Use relative URL for Next.js proxy
      url = proxyEndpoint;
    }
    
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.requiresAuth !== false && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      params,
      requiresAuth = true,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(options);

    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
    };

    if (body) {
      if (body instanceof FormData || body instanceof URLSearchParams) {
        // Don't set Content-Type for FormData/URLSearchParams - browser will set it
        delete headers['Content-Type'];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ API Error:', errorData);
        throw new ApiError(
          errorData?.message || errorData?.title || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Handle empty responses (204 No Content, etc.)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return undefined as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network errors or other issues
      console.error('🔴 Network Error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        undefined,
        undefined
      );
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
