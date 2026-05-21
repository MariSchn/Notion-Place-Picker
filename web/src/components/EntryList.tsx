import { useEffect, useMemo, useRef } from "react";
import type { Entry } from "../types";

type Props = {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  filter: string;
  onlyMissing: boolean;
};

export function EntryList({
  entries,
  selectedId,
  onSelect,
  loading,
  filter,
  onlyMissing,
}: Props) {
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
    <div className="sidebar-list" ref={listRef}>
      {loading && entries.length === 0 && (
        <div className="sidebar-empty">Loading entries…</div>
      )}
      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div className="sidebar-empty">No entries match.</div>
      )}
      {filtered.map((e) => (
        <div
          key={e.id}
          data-id={e.id}
          className={`sidebar-item${selectedId === e.id ? " selected" : ""}`}
          onClick={() => onSelect(e.id)}
        >
          <span
            className={`item-dot${e.place ? " set" : ""}`}
            title={e.place ? `${e.place.lat}, ${e.place.lon}` : "Missing"}
            aria-label={e.place ? "Place set" : "Place missing"}
          />
          <span className="item-title">{e.title || "Untitled"}</span>
        </div>
      ))}
    </div>
  );
}
