function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveClientApiBase() {
  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3102/api';
  const cleaned = trimTrailingSlash(rawBase);
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

type ClientApiResult<T> = {
  response: Response;
  payload: T | null;
  text: string;
};

async function performRequest<T>(url: string, init: RequestInit): Promise<ClientApiResult<T>> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
  });

  const text = await response.text();
  let payload: T | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as T;
    } catch {
      payload = null;
    }
  }

  return {
    response,
    payload,
    text,
  };
}

function shouldFallback(result: ClientApiResult<unknown>) {
  if (result.response.ok) {
    return false;
  }

  if (result.response.status === 404 || result.response.status === 405) {
    return true;
  }

  const contentType = result.response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    return true;
  }

  return /cannot (post|patch|get|put|delete)/i.test(result.text);
}

export async function requestClientApi<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
) {
  const normalizedPath = normalizePath(path);
  const internalUrl = `/api${normalizedPath}`;
  const method = (init.method ?? 'GET').toUpperCase();
  const backendUrl = `${resolveClientApiBase()}${normalizedPath}`;
  const shouldPreferDirectBackend = method !== 'GET' && method !== 'HEAD';

  if (shouldPreferDirectBackend) {
    try {
      const backendResult = await performRequest<T>(backendUrl, init);
      if (!shouldFallback(backendResult)) {
        return backendResult;
      }
    } catch {
      // Seguimos con la ruta interna solo como fallback de seguridad.
    }
  }

  try {
    const internalResult = await performRequest<T>(internalUrl, init);

    if (!shouldFallback(internalResult)) {
      return internalResult;
    }
  } catch {
    // Fallback directo al backend cuando la ruta interna no existe o falla en runtime.
  }

  return performRequest<T>(backendUrl, init);
}

export function extractClientApiError(
  result: ClientApiResult<{ message?: string }>,
  fallbackMessage: string,
) {
  const payloadMessage =
    result.payload && typeof result.payload === 'object' && 'message' in result.payload
      ? result.payload.message
      : null;

  if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
    return payloadMessage;
  }

  if (result.text && !result.text.startsWith('<!DOCTYPE html')) {
    return result.text;
  }

  return fallbackMessage;
}
