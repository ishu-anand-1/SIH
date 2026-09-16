const API_BASE = '/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('metrologyx_token');

  const headers = new Headers(options.headers);

  // Do NOT force JSON Content-Type for FormData uploads.
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
      `API Request Failed: ${response.status} ${response.statusText}`
    );
  }

  // Handle empty responses safely.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}