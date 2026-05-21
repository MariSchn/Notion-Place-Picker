import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// project root = two levels up from server/src/ (or server/dist/ when built)
const here = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(here, "..", "..", ".env");
const TOKEN_KEY = "NOTION_TOKEN";

let cachedToken: string | undefined;

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function serializeEnv(entries: Record<string, string>): string {
  return (
    Object.entries(entries)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n"
  );
}

async function readEnv(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(ENV_PATH, "utf8");
    return parseEnv(raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to read .env:", err);
    }
    return {};
  }
}

export async function loadConfig(): Promise<void> {
  // process.env wins (handy for one-off overrides), otherwise .env in repo root.
  if (process.env[TOKEN_KEY]) {
    cachedToken = process.env[TOKEN_KEY];
    return;
  }
  const env = await readEnv();
  cachedToken = env[TOKEN_KEY];
}

export function getToken(): string | undefined {
  return cachedToken;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  const env = await readEnv();
  env[TOKEN_KEY] = token;
  await fs.writeFile(ENV_PATH, serializeEnv(env), { mode: 0o600 });
}

export async function clearToken(): Promise<void> {
  cachedToken = undefined;
  const env = await readEnv();
  if (TOKEN_KEY in env) {
    delete env[TOKEN_KEY];
    await fs.writeFile(ENV_PATH, serializeEnv(env), { mode: 0o600 });
  }
}
