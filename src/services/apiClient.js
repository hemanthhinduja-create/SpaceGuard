// Single place for HTTP: base URL, credentials (HTTP-only auth cookie), timeouts and error shape.
const BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, { method = 'GET', body, signal, timeout = DEFAULT_TIMEOUT_MS, cache } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, timeout);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      cache,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      /* non-JSON body */
    }
    if (!response.ok) {
      throw new ApiError(data?.error?.message || `Request failed (${response.status}).`, {
        status: response.status,
        code: data?.error?.code || 'HTTP_ERROR',
      });
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Caller-initiated cancellation is passed through untouched so callers can ignore it.
    if (signal?.aborted) throw error;
    if (timedOut) throw new ApiError('The SpaceGuard server took too long to respond.', { code: 'TIMEOUT' });
    throw new ApiError(
      'Unable to reach the SpaceGuard server. Make sure the backend and MongoDB are running.',
      { code: 'NETWORK_ERROR' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
