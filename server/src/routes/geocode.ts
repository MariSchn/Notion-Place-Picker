import { Router } from "express";
import { geocode } from "../nominatim.js";

export const geocodeRouter: Router = Router();

geocodeRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json({ results: [] });
  try {
    const results = await geocode(q);
    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});
