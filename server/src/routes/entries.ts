import { Router } from "express";
import { z } from "zod";
import { getToken } from "../config.js";
import {
  NotionError,
  NotionPage,
  NotionPlaceValue,
  extractPlace,
  extractTitle,
  notionFetch,
} from "../notion.js";

export const entriesRouter: Router = Router();

type EntrySlim = {
  id: string;
  title: string;
  place: NotionPlaceValue | null;
};

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

function toSlim(page: NotionPage, placePropertyName: string): EntrySlim {
  return {
    id: page.id,
    title: extractTitle(page.properties),
    place: extractPlace(page.properties, placePropertyName),
  };
}

entriesRouter.get("/data-sources/:id/entries", async (req, res) => {
  const token = requireToken(res);
  if (!token) return;
  const placeProperty = String(req.query.placeProperty ?? "");
  if (!placeProperty) {
    return res.status(400).json({ error: "placeProperty query parameter is required." });
  }
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  try {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const result = (await notionFetch(token, `/v1/data_sources/${req.params.id}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as { results: NotionPage[]; next_cursor: string | null; has_more: boolean };

    res.json({
      entries: result.results.map((p) => toSlim(p, placeProperty)),
      nextCursor: result.next_cursor,
      hasMore: result.has_more,
    });
  } catch (err) {
    handleError(res, err);
  }
});

const patchSchema = z.object({
  propertyName: z.string().min(1),
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
  name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

entriesRouter.patch("/pages/:id/place", async (req, res) => {
  const token = requireToken(res);
  if (!token) return;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  const { propertyName, lat, lon, name, address } = parsed.data;

  const placeValue: NotionPlaceValue = { lat, lon };
  if (name) placeValue.name = name;
  if (address) placeValue.address = address;

  try {
    const page = (await notionFetch(token, `/v1/pages/${req.params.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        properties: {
          [propertyName]: { place: placeValue },
        },
      }),
    })) as NotionPage;
    res.json(toSlim(page, propertyName));
  } catch (err) {
    handleError(res, err);
  }
});
