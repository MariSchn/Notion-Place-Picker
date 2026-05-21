import { useState } from "react";
import { api } from "../api";
import type { GeocodeResult } from "../types";

type Props = {
  onPick: (result: GeocodeResult) => void;
};

export function GeocodeSearch({ onPick }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.geocode(q.trim());
      setResults(r);
      if (r.length === 0) setError("No results.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="geocode">
      <form className="geocode-row" onSubmit={search}>
        <input
          placeholder="Search address or place name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="primary" type="submit" disabled={busy || !q.trim()}>
          {busy ? "..." : "Search"}
        </button>
      </form>
      {error && <div className="error" style={{ marginTop: 0 }}>{error}</div>}
      {results.length > 0 && (
        <div className="geocode-results">
          {results.map((r, i) => (
            <div
              key={i}
              className="result"
              onClick={() => {
                onPick(r);
                setResults([]);
              }}
            >
              <div>{r.displayName}</div>
              <div className="coords">
                {r.lat.toFixed(5)}, {r.lon.toFixed(5)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
