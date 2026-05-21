import { Router } from "express";
import { getToken } from "../config.js";
import { NotionError, NotionRichText, notionFetch } from "../notion.js";

export const databasesRouter: Router = Router();

// In API 2025-09-03 the queryable collection is a "data source". A Notion
// database may have one or more data sources; for almost every existing
// database there's exactly one. From the user's perspective we still call
// them "databases" in the UI — internally `id` is always a data_source id.

type RawDataSource = {
  id: string;
  object: "data_source";
  // Notion sometimes returns title as rich text, sometimes name as string.
  title?: NotionRichText[];
  name?: string | NotionRichText[];
  parent?: {
    type?: string;
    database_id?: string;
  };
  properties?: Record<string, { id: string; name: string; type: string }>;
};

function richTextToString(rt: NotionRichText[] | undefined): string {
  if (!rt || rt.length === 0) return "";
  return rt.map((p) => p.plain_text ?? "").join("").trim();
}

function dataSourceTitle(ds: RawDataSource): string {
  const fromTitle = richTextToString(ds.title);
  if (fromTitle) return fromTitle;
  if (typeof ds.name === "string" && ds.name.trim()) return ds.name.trim();
  if (Array.isArray(ds.name)) {
    const s = richTextToString(ds.name);
    if (s) return s;
  }
  return "(untitled)";
}

function requireToken(res: import("express").Response): string | null {
  const token = getToken();
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return null;
  }
  return token;
}

function handleError(res: import("express").Response, err: unknown) {
  if (err instanceof NotionError) {
    res.status(err.status).json({ error: err.message, body: err.body });
  } else {
    res.status(500).json({ error: (err as Error).message });
  }
}

databasesRouter.get("/", async (_req, res) => {
  const token = requireToken(res);
  if (!token) return;
  try {
    const search = (await notionFetch(token, "/v1/search", {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "object", value: "data_source" },
        page_size: 100,
      }),
    })) as { results: RawDataSource[] };

    const databases = search.results.map((ds) => {
      const title = dataSourceTitle(ds);
      return {
        id: ds.id,
        title,
        dataSources: [{ id: ds.id, name: title }],
      };
    });

    res.json({ databases });
  } catch (err) {
    handleError(res, err);
  }
});

databasesRouter.get("/:id", async (req, res) => {
  const token = requireToken(res);
  if (!token) return;
  try {
    const ds = (await notionFetch(token, `/v1/data_sources/${req.params.id}`)) as RawDataSource;
    const title = dataSourceTitle(ds);
    const properties = Object.values(ds.properties ?? {}).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));
    res.json({
      id: ds.id,
      title,
      dataSources: [{ id: ds.id, name: title }],
      primaryDataSourceId: ds.id,
      properties,
    });
  } catch (err) {
    handleError(res, err);
  }
});
