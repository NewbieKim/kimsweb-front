import type { ApiEnvelope } from '../types/admin';

interface LocalImportMetaEnv {
  VITE_API_BASE_URL?: string;
  VITE_ADMIN_API_TOKEN?: string;
  DEV?: boolean;
}

interface LocalImportMeta {
  env: LocalImportMetaEnv;
}

const env = (import.meta as unknown as LocalImportMeta).env;
const configuredBaseUrl = (env.VITE_API_BASE_URL || '').trim();
const fallbackBaseUrl = env.DEV ? '' : 'https://space.ltbot.top';
const API_BASE_URL = (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, '');
const ADMIN_API_TOKEN = (env.VITE_ADMIN_API_TOKEN || '').trim();

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | null | undefined>;
}

export async function requestApi<T>(path: string, options: RequestOptions = {}) {
  const { query, headers, ...restOptions } = options;
  const url = buildUrl(path, query);

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_API_TOKEN ? { Authorization: `Bearer ${ADMIN_API_TOKEN}` } : {}),
      ...headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    const errorMessage =
      payload?.message || payload?.error || `请求失败: ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload.data;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveBaseUrl();
  const url = new URL(normalizedPath, ensureTrailingSlash(baseUrl));
  if (!query) {
    return url.toString();
  }
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function resolveBaseUrl() {
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL;
  }
  if (!API_BASE_URL) {
    return window.location.origin;
  }
  return `${window.location.origin}${API_BASE_URL.startsWith('/') ? '' : '/'}${API_BASE_URL}`;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}
