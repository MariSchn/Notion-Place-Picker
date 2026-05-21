import type {
  AuthStatus,
  DatabaseDetail,
  DatabaseSummary,
  Entry,
  GeocodeResult,
  PageFull,
} from "./types";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error?: unknown }).error)
        : res.statusText;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return body as T;
}

export const api = {
  getAuth: () => call<AuthStatus>("/api/auth"),
  setToken: (token: string) =>
    call<AuthStatus>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  listDatabases: () =>
    call<{ databases: DatabaseSummary[] }>("/api/databases").then((r) => r.databases),
  getDatabase: (id: string) => call<DatabaseDetail>(`/api/databases/${id}`),
  listEntries: (dataSourceId: string, placeProperty: string, cursor?: string) => {
    const params = new URLSearchParams({ placeProperty });
    if (cursor) params.set("cursor", cursor);
    return call<{ entries: Entry[]; nextCursor: string | null; hasMore: boolean }>(
      `/api/data-sources/${dataSourceId}/entries?${params.toString()}`,
    );
  },
  savePlace: (
    pageId: string,
    payload: { propertyName: string; lat: number; lon: number; name?: string; address?: string },
  ) =>
    call<Entry>(`/api/pages/${pageId}/place`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  geocode: (q: string) =>
    call<{ results: GeocodeResult[] }>(`/api/geocode?q=${encodeURIComponent(q)}`).then(
      (r) => r.results,
    ),
  getPage: (pageId: string) => call<PageFull>(`/api/pages/${pageId}/full`),
};
