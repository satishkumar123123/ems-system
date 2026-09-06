// Production requests stay on the website's origin. Vercel forwards /api/*
// to Render, so browser CORS rules and stale build-time API URLs cannot reroute them.
export const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000')
      .replace(/\/+$/, '').replace(/\/api$/, '')
  : '';

export async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const parentSignal = options.signal;
  let timedOut = false;
  const abort = () => controller.abort();
  if (parentSignal?.aborted) abort();
  else parentSignal?.addEventListener('abort', abort, { once: true });
  // Render may need time to start after inactivity.
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 65000);

  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`The data service returned HTTP ${response.status}. Please retry.`);
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('The data service returned a page instead of data. Please retry.');
    }
    // Read the body before clearing the timeout/abort handler.
    const data = await response.json();
    return { ok: true, status: response.status, json: async () => data };
  } catch (error) {
    if (timedOut) throw new Error('The data service took too long to respond. Please retry.');
    if (error.name === 'AbortError') throw error;
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the data service. Check your connection and retry.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', abort);
  }
}
