import { PaginatedResponse, PaginationMeta } from '@/lib/types';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/lib/auth-tokens';

export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryParamValue>;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: QueryParams;
  _retryUnauthorized?: boolean;
};

interface PaginationDefaults {
  page: number;
  limit: number;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getApiBaseUrl(): string {
  const rawValue =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:8080';

  return rawValue.replace(/\/$/, '');
}

function getApiPrefix(): string {
  const rawPrefix = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/aegis/v1';
  const withLeadingSlash = rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`;
  return withLeadingSlash.replace(/\/$/, '');
}

function getRefreshEndpointPath(): string {
  return process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH ?? '/auth/refresh';
}

function getAuthPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const message = payload.message ?? payload.error;
  return typeof message === 'string' ? message : null;
}

function buildUrl(path: string, query?: QueryParams): string {
  if (/^https?:\/\//i.test(path)) {
    const absoluteUrl = new URL(path);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            absoluteUrl.searchParams.append(key, String(item));
          }
          continue;
        }

        absoluteUrl.searchParams.set(key, String(value));
      }
    }

    return absoluteUrl.toString();
  }

  const endpoint = getAuthPath(path);
  const prefix = getApiPrefix();
  const prefixedEndpoint = endpoint.startsWith(`${prefix}/`) || endpoint === prefix
    ? endpoint
    : `${prefix}${endpoint}`;
  const url = new URL(`${getApiBaseUrl()}${prefixedEndpoint}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (contentType.startsWith('text/')) {
    return response.text();
  }

  return null;
}

function isUnauthorizedError(status: number): boolean {
  return status === 401;
}

function isRefreshRequest(path: string): boolean {
  const normalizedPath = getAuthPath(path).toLowerCase();
  const refreshPath = getAuthPath(getRefreshEndpointPath()).toLowerCase();
  return normalizedPath === refreshPath;
}

function normalizeAuthPayload(payload: unknown): {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
} {
  const unwrapped = unwrapData<unknown>(payload);

  if (!isRecord(unwrapped)) {
    return {};
  }

  const accessTokenCandidate =
    unwrapped.accessToken ?? unwrapped.token ?? unwrapped.jwt ?? unwrapped.idToken;
  const refreshTokenCandidate = unwrapped.refreshToken;
  const expiresInCandidate = unwrapped.expiresIn;
  const expiresAtCandidate = unwrapped.expiresAt;

  return {
    accessToken:
      typeof accessTokenCandidate === 'string' && accessTokenCandidate.trim().length > 0
        ? accessTokenCandidate
        : undefined,
    refreshToken:
      typeof refreshTokenCandidate === 'string' && refreshTokenCandidate.trim().length > 0
        ? refreshTokenCandidate
        : undefined,
    expiresIn: typeof expiresInCandidate === 'number' ? expiresInCandidate : undefined,
    expiresAt: typeof expiresAtCandidate === 'number' ? expiresAtCandidate : undefined,
  };
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  try {
    const response = await fetch(buildUrl(getRefreshEndpointPath()), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    const parsedBody = await parseResponse(response);

    if (!response.ok) {
      clearAuthTokens();
      return false;
    }

    const normalizedTokens = normalizeAuthPayload(parsedBody);

    if (!normalizedTokens.accessToken && !refreshToken) {
      // Cookie-based sessions may refresh server-side without returning a token payload.
      return true;
    }

    if (!normalizedTokens.accessToken) {
      clearAuthTokens();
      return false;
    }

    setAuthTokens({
      accessToken: normalizedTokens.accessToken,
      refreshToken: normalizedTokens.refreshToken ?? refreshToken ?? undefined,
      expiresAt:
        normalizedTokens.expiresAt ??
        (normalizedTokens.expiresIn ? Date.now() + normalizedTokens.expiresIn * 1000 : undefined),
    });

    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

let refreshRequestPromise: Promise<boolean> | null = null;

async function ensureFreshAccessToken(): Promise<boolean> {
  if (!refreshRequestPromise) {
    refreshRequestPromise = refreshAccessToken();
  }

  try {
    return await refreshRequestPromise;
  } finally {
    refreshRequestPromise = null;
  }
}

function buildHeaders(
  headers: HeadersInit | undefined,
  hasBody: boolean,
  isFormData: boolean
): Headers {
  const mergedHeaders = new Headers(headers ?? {});
  mergedHeaders.set('Accept', 'application/json');

  if (hasBody && !isFormData && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  return mergedHeaders;
}

function buildPaginationMeta(
  payload: Record<string, unknown>,
  itemCount: number,
  defaults: PaginationDefaults
): PaginationMeta {
  const rawMeta = isRecord(payload.meta) ? payload.meta : null;
  const page =
    Number(
      rawMeta?.page ??
        payload.page ??
        (payload.number !== undefined ? Number(payload.number) + 1 : undefined) ??
        defaults.page
    ) || defaults.page;
  const limit =
    Number(rawMeta?.limit ?? payload.limit ?? payload.size ?? defaults.limit) ||
    defaults.limit;
  const total =
    Number(rawMeta?.total ?? payload.total ?? payload.totalElements ?? itemCount) ||
    itemCount;
  const totalPages =
    Number(
      rawMeta?.totalPages ??
        payload.totalPages ??
        Math.ceil(total / limit) ??
        1
    ) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, query, headers, _retryUnauthorized = false, ...rest } = options;
    const hasBody = body !== undefined;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const response = await fetch(buildUrl(path, query), {
      ...rest,
      credentials: 'include',
      headers: buildHeaders(headers, hasBody, isFormData),
      body: hasBody && !isFormData ? JSON.stringify(body) : (body as BodyInit | null | undefined),
    });

    const parsedBody = await parseResponse(response);

    if (
      isUnauthorizedError(response.status) &&
      !_retryUnauthorized &&
      !isRefreshRequest(path)
    ) {
      const refreshed = await ensureFreshAccessToken();

      if (refreshed) {
        return apiClient.request<T>(path, {
          ...options,
          _retryUnauthorized: true,
        });
      }
    }

    if (!response.ok) {
      const message = getErrorMessage(parsedBody) ?? `Request failed with status ${response.status}.`;
      throw new ApiError(message, response.status, parsedBody);
    }

    return parsedBody as T;
  },
};

export function unwrapData<T>(payload: unknown): T {
  if (!isRecord(payload)) {
    return payload as T;
  }

  if ('data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export function toPaginatedResponse<T>(
  payload: unknown,
  defaults: PaginationDefaults = { page: 1, limit: 20 }
): PaginatedResponse<T> {
  const unwrapped = unwrapData<unknown>(payload);

  if (Array.isArray(unwrapped)) {
    return {
      items: unwrapped as T[],
      meta: {
        page: defaults.page,
        limit: defaults.limit,
        total: unwrapped.length,
        totalPages: Math.max(1, Math.ceil(unwrapped.length / defaults.limit)),
      },
    };
  }

  if (!isRecord(unwrapped)) {
    return {
      items: [],
      meta: {
        page: defaults.page,
        limit: defaults.limit,
        total: 0,
        totalPages: 1,
      },
    };
  }

  const itemsCandidate =
    unwrapped.content ??
    unwrapped.items ??
    unwrapped.results ??
    unwrapped.records ??
    unwrapped.alerts ??
    unwrapped.logs ??
    unwrapped.workflows ??
    [];

  const items = Array.isArray(itemsCandidate) ? (itemsCandidate as T[]) : [];

  return {
    items,
    meta: buildPaginationMeta(unwrapped, items.length, defaults),
  };
}
