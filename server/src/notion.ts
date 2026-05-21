export const NOTION_VERSION = "2025-09-03";
const BASE = "https://api.notion.com";

export class NotionError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function notionFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!res.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message?: unknown }).message ?? res.statusText)
        : res.statusText;
    throw new NotionError(res.status, parsed, message);
  }
  return parsed;
}

// ---- Domain types (only the bits we actually use) ----

export type NotionRichText = { plain_text: string };

export type NotionTitleProperty = {
  type: "title";
  title: NotionRichText[];
};

export type NotionPlaceValue = {
  lat: number;
  lon: number;
  name?: string | null;
  address?: string | null;
  aws_place_id?: string | null;
  google_place_id?: string | null;
};

export type NotionPlaceProperty = {
  type: "place";
  place: NotionPlaceValue | null;
};

export type NotionProperty =
  | NotionTitleProperty
  | NotionPlaceProperty
  | { type: string; [k: string]: unknown };

export type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};

export type NotionDataSourceSchemaProperty = {
  id: string;
  name: string;
  type: string;
};

export type NotionDataSource = {
  id: string;
  name?: string;
  properties: Record<string, NotionDataSourceSchemaProperty>;
};

export type NotionDatabase = {
  id: string;
  title?: NotionRichText[];
  data_sources?: { id: string; name?: string }[];
};

export function extractTitle(properties: Record<string, NotionProperty>): string {
  for (const value of Object.values(properties)) {
    if (value.type === "title") {
      const parts = (value as NotionTitleProperty).title ?? [];
      const text = parts.map((p) => p.plain_text ?? "").join("").trim();
      if (text) return text;
      return "(untitled)";
    }
  }
  return "(untitled)";
}

export function extractPlace(
  properties: Record<string, NotionProperty>,
  placePropertyName: string,
): NotionPlaceValue | null {
  const prop = properties[placePropertyName];
  if (!prop || prop.type !== "place") return null;
  return (prop as NotionPlaceProperty).place ?? null;
}
