const USER_AGENT = "NotionPlaceSetter/0.1 (smarian@ethz.ch)";
const BASE = "https://nominatim.openstreetmap.org";
const MIN_INTERVAL_MS = 1100;
const CACHE_MAX = 200;

let lastCallAt = 0;
let pendingChain: Promise<unknown> = Promise.resolve();

const cache = new Map<string, GeocodeResult[]>();

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lon: number;
};

type RawNominatim = {
  display_name: string;
  lat: string;
  lon: string;
};

function rememberCache(key: string, value: GeocodeResult[]): void {
  cache.set(key, value);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const key = query.trim().toLowerCase();
  if (!key) return [];
  const cached = cache.get(key);
  if (cached) return cached;

  // Chain calls so concurrent callers are serialized through the rate-limit gate.
  const run = pendingChain.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    const url = `${BASE}/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Nominatim ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = (await res.json()) as RawNominatim[];
    const mapped: GeocodeResult[] = data.map((r) => ({
      displayName: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
    }));
    rememberCache(key, mapped);
    return mapped;
  });

  pendingChain = run.catch(() => undefined);
  return run;
}
