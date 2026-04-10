function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function resolveApiBase() {
  const rawBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.PUBLIC_API_BASE_URL ??
    'http://localhost:3102/api';

  const cleaned = trimTrailingSlash(rawBase);
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}
