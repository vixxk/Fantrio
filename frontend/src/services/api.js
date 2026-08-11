const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE_URL = `${BACKEND_URL}/api/v1`;

class ApiService {
  constructor() {}

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';

    const headers = {
      'Content-Type': 'application/json',
    };

    const fetchOptions = {
      method,
      headers,
      credentials: 'include',
    };
    if (options.body) {
      fetchOptions.body = options.body;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

    if (res.status === 401) {
      const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/verify-2fa'].some((p) => endpoint.startsWith(p));
      if (!isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();