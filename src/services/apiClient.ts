// Slightly longer than the server's 10s upstream timeout.
const DEFAULT_TIMEOUT_MS = 12000;

/**
 * POSTs JSON or FormData to the OLearn server.
 * Returns null when offline, on timeout, on any non-2xx response or on bad JSON,
 * so callers can fall back to on-device behaviour. Never throws.
 */
export async function apiPost<T>(
  path: string,
  body: FormData | object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const isForm = body instanceof FormData;
    const res = await fetch(path, {
      method: 'POST',
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
