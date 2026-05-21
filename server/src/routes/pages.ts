import { Router } from "express";
import { getToken } from "../config.js";
import {
  NotionError,
  NotionPage,
  extractTitle,
  notionFetch,
} from "../notion.js";

export const pagesRouter: Router = Router();

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

type BlocksResponse = {
  results: unknown[];
  next_cursor: string | null;
  has_more: boolean;
};

async function fetchAllBlocks(token: string, pageId: string): Promise<unknown[]> {
  const acc: unknown[] = [];
  let cursor: string | undefined = undefined;
  do {
    const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}&page_size=100` : "?page_size=100";
    const resp = (await notionFetch(token, `/v1/blocks/${pageId}/children${qs}`)) as BlocksResponse;
    acc.push(...(resp.results ?? []));
    cursor = resp.has_more && resp.next_cursor ? resp.next_cursor : undefined;
  } while (cursor && acc.length < 500);
  return acc;
}

pagesRouter.get("/pages/:id/full", async (req, res) => {
  const token = requireToken(res);
  if (!token) return;
  try {
    const page = (await notionFetch(token, `/v1/pages/${req.params.id}`)) as NotionPage & {
      icon?: unknown;
      cover?: unknown;
    };
    let blocks: unknown[] = [];
    try {
      blocks = await fetchAllBlocks(token, req.params.id);
    } catch {
      blocks = [];
    }

    res.json({
      id: page.id,
      title: extractTitle(page.properties),
      icon: page.icon ?? null,
      properties: page.properties,
      blocks,
    });
  } catch (err) {
    handleError(res, err);
  }
});
