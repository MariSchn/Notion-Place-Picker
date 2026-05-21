import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry } from "../types";

type Props = {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
};

export function EntryList({ entries, selectedId, onSelect, loading }: Props) {
  const [filter, setFilter] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (onlyMissing && e.place) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, filter, onlyMissing]);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = filtered.findIndex((x) => x.id === selectedId);
      const nextIdx =
        e.key === "ArrowDown"
          ? Math.min(filtered.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      const next = filtered[nextIdx];
      if (next) onSelect(next.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, selectedId, onSelect]);

  return (
    <div className="list-pane">
      <div className="list-controls">
        <input
          placeholder="Filter by title..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="toggles">
          <label>
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
            />
            Show only missing
          </label>
          <span className="spacer" />
          <span>{filtered.length} / {entries.length}</span>
        </div>
      </div>
      <div className="entry-list" ref={listRef}>
        {loading && entries.length === 0 && <div style={{ padding: 12 }}>Loading...</div>}
        {filtered.map((e) => (
          <div
            key={e.id}
            data-id={e.id}
            className={`entry${selectedId === e.id ? " selected" : ""}`}
            onClick={() => onSelect(e.id)}
          >
            <div className="title">{e.title}</div>
            {e.place ? (
              <span className="badge set" title={`${e.place.lat}, ${e.place.lon}`}>📍 set</span>
            ) : (
              <span className="badge">— missing</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
