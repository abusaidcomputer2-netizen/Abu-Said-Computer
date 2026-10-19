import { getCachedAccessToken } from '../services/googleAuth';

/**
 * Safe API request helper that parses JSON reliably and never crashes on empty responses
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
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
    if (!rawText || rawText.trim() === '') {
      return { ok: res.ok, status: res.status, data: null };
    }

    if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      try {
        const data = JSON.parse(rawText) as T;
        return { ok: res.ok, status: res.status, data };
      } catch (parseErr: any) {
        return { ok: false, status: res.status, data: null, error: parseErr.message };
      }
    }

    // Returned HTML or plain text (e.g., Cloudflare 404 or index.html SPA fallback)
    return {
      ok: false,
      status: res.status,
      data: null,
      error: 'Non-JSON server response (likely static host or network fallback)'
    };
  } catch (netErr: any) {
    return { ok: false, status: 0, data: null, error: netErr.message || 'Network error' };
  }
}
