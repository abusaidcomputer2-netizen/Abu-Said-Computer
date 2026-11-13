import { getCachedAccessToken } from '../services/googleAuth';

/**
 * Safe API request helper that parses JSON reliably, distinguishes real backend errors
 * from static-host SPA HTML fallbacks (e.g., Cloudflare Workers ./dist) or offline mode.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  backendUnavailable?: boolean;
}> {
  try {
    const token = getCachedAccessToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const rawText = await res.text();
    const trimmed = (rawText || '').trim();

    if (!trimmed) {
      if (res.status === 404 || res.status === 405) {
        return {
          ok: false,
          status: res.status,
          data: null,
          backendUnavailable: true,
          error: 'API endpoint not available on static host'
        };
      }
      return { ok: res.ok, status: res.status, data: null, backendUnavailable: false };
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const data = JSON.parse(trimmed) as T;
        return { ok: res.ok, status: res.status, data, backendUnavailable: false };
      } catch (parseErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null,
          backendUnavailable: false,
          error: parseErr.message
        };
      }
    }

    // Returned HTML or plain text (e.g., Cloudflare Workers SPA fallback returning index.html with 200 or 404)
    return {
      ok: false,
      status: res.status,
      data: null,
      backendUnavailable: true,
      error: 'Non-JSON server response (static host or SPA fallback)'
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      backendUnavailable: true,
      error: netErr.message || 'Network error'
    };
  }
}
