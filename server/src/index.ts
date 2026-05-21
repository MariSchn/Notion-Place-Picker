import express from "express";
import cors from "cors";
import { loadConfig } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { databasesRouter } from "./routes/databases.js";
import { entriesRouter } from "./routes/entries.js";
import { geocodeRouter } from "./routes/geocode.js";

const PORT = Number(process.env.PORT ?? 5179);

async function main() {
  await loadConfig();

  const app = express();
  app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api/databases", databasesRouter);
  app.use("/api", entriesRouter);
  app.use("/api/geocode", geocodeRouter);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
