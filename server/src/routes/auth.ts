import { Router } from "express";
import { z } from "zod";
import { getToken, setToken } from "../config.js";
import { NotionError, notionFetch } from "../notion.js";

export const authRouter: Router = Router();

authRouter.get("/", async (_req, res) => {
  const token = getToken();
  if (!token) return res.json({ configured: false });
  try {
    const me = (await notionFetch(token, "/v1/users/me")) as { name?: string; bot?: { workspace_name?: string } };
    res.json({
      configured: true,
      botName: me.name,
      workspaceName: me.bot?.workspace_name,
    });
  } catch (err) {
    if (err instanceof NotionError && err.status === 401) {
      return res.json({ configured: false, error: "Stored token is no longer valid." });
    }
    res.status(500).json({ configured: true, error: (err as Error).message });
  }
});

authRouter.post("/", async (req, res) => {
  const parsed = z.object({ token: z.string().min(10) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid token." });
  const token = parsed.data.token.trim();
  try {
    const me = (await notionFetch(token, "/v1/users/me")) as { name?: string; bot?: { workspace_name?: string } };
    await setToken(token);
    res.json({ configured: true, botName: me.name, workspaceName: me.bot?.workspace_name });
  } catch (err) {
    if (err instanceof NotionError) {
      return res.status(err.status === 401 ? 401 : 400).json({ error: err.message });
    }
    res.status(500).json({ error: (err as Error).message });
  }
});
