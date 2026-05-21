import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { GeocodeResult } from "../types";
import { IconPin, IconSearch } from "./icons";

type Props = {
  onPick: (result: GeocodeResult) => void;
  onClose: () => void;
};

export function GeocodeSearch({ onPick, onClose }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" && results.length > 0) {
        const r = results[activeIdx];
        if (r) {
          e.preventDefault();
          onPick(r);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, activeIdx, onPick, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    setActiveIdx(0);
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
    <div
      className="popover-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="popover" role="dialog" aria-label="Search location">
        <form className="popover-input-row" onSubmit={submit}>
          <IconSearch className="icon" />
          <input
            ref={inputRef}
            placeholder="Search address or place name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="popover-status">
            {busy ? "Searching…" : results.length > 0 ? `${results.length} results` : ""}
          </span>
        </form>

        <div className="popover-results">
          {error && <div className="popover-empty">{error}</div>}
          {!error && results.length === 0 && !busy && (
            <div className="popover-empty">
              Type an address or place name, then press Enter.
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.lat}-${r.lon}-${i}`}
              className={`popover-result${i === activeIdx ? " active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => onPick(r)}
            >
              <span className="result-icon">
                <IconPin size={14} />
              </span>
              <div className="result-text">
                <div className="result-name">{r.displayName}</div>
                <div className="result-coords">
                  {r.lat.toFixed(5)}, {r.lon.toFixed(5)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
