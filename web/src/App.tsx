import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { DatabasePicker } from "./components/DatabasePicker";
import { EntryList } from "./components/EntryList";
import { GeocodeSearch } from "./components/GeocodeSearch";
import { MapPanel } from "./components/MapPanel";
import { PlaceForm } from "./components/PlaceForm";
import { TokenSetup } from "./components/TokenSetup";
import type { AuthStatus, DatabaseDetail, Entry, PlaceValue } from "./types";

type Selection = {
  database: DatabaseDetail;
  dataSourceId: string;
  placeProperty: string;
};

const SELECTION_KEY = "nps.selection";

type Toast = { kind: "good" | "bad"; message: string };

export function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Initial auth check.
  useEffect(() => {
    api.getAuth().then(setAuth).catch((e) => setAuth({ configured: false, error: (e as Error).message }));
  }, []);

  // Restore saved selection.
  useEffect(() => {
    if (!auth?.configured) return;
    const raw = localStorage.getItem(SELECTION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Selection;
      setSelection(parsed);
    } catch {
      localStorage.removeItem(SELECTION_KEY);
    }
  }, [auth?.configured]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadEntries = useCallback(async (s: Selection) => {
    setLoadingEntries(true);
    setEntries([]);
    try {
      let cursor: string | undefined = undefined;
      const acc: Entry[] = [];
      do {
        const page = await api.listEntries(s.dataSourceId, s.placeProperty, cursor);
        acc.push(...page.entries);
        cursor = page.nextCursor ?? undefined;
        setEntries([...acc]);
      } while (cursor);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        setAuth({ configured: false, error: "Token rejected by Notion." });
        setSelection(null);
      } else {
        setToast({ kind: "bad", message: err.message });
      }
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    if (selection) loadEntries(selection);
  }, [selection, loadEntries]);

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId],
  );

  // When selection changes, reset the draft to the entry's current place.
  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(
      selected.place
        ? { ...selected.place }
        : { lat: NaN, lon: NaN, name: "", address: "" },
    );
  }, [selected]);

  const saveDraft = useCallback(async () => {
    if (!selection || !selected || !draft) return;
    if (!Number.isFinite(draft.lat) || !Number.isFinite(draft.lon)) return;
    setSaving(true);
    try {
      const updated = await api.savePlace(selected.id, {
        propertyName: selection.placeProperty,
        lat: draft.lat,
        lon: draft.lon,
        name: draft.name?.trim() || undefined,
        address: draft.address?.trim() || undefined,
      });
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setToast({ kind: "good", message: `Saved "${updated.title}"` });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        setAuth({ configured: false, error: "Token rejected by Notion." });
      }
      setToast({ kind: "bad", message: err.message });
    } finally {
      setSaving(false);
    }
  }, [selection, selected, draft]);

  // ⌘/Ctrl+S to save.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft]);

  if (!auth) {
    return <div className="centered"><div>Loading...</div></div>;
  }

  if (!auth.configured) {
    return (
      <TokenSetup
        initialError={auth.error}
        onAuthenticated={(s) => {
          setAuth(s);
        }}
      />
    );
  }

  if (!selection) {
    return (
      <DatabasePicker
        onSelected={(s) => {
          localStorage.setItem(SELECTION_KEY, JSON.stringify(s));
          setSelection(s);
        }}
      />
    );
  }

  const lat = draft && Number.isFinite(draft.lat) ? draft.lat : null;
  const lon = draft && Number.isFinite(draft.lon) ? draft.lon : null;

  return (
    <div className="app">
      <div className="topbar">
        <h1>Notion Place Setter</h1>
        <span className="muted">
          {selection.database.title} · property "{selection.placeProperty}"
        </span>
        <span className="spacer" />
        <span className="muted">
          {auth.workspaceName ? `${auth.workspaceName} · ` : ""}
          {auth.botName ?? ""}
        </span>
        <button
          onClick={() => {
            localStorage.removeItem(SELECTION_KEY);
            setSelection(null);
            setEntries([]);
            setSelectedId(null);
          }}
        >
          Change database
        </button>
      </div>
      <div className="editor">
        <EntryList
          entries={entries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loadingEntries}
        />
        <div className="map-pane">
          <div className="map-container">
            <MapPanel
              lat={lat}
              lon={lon}
              onPick={(la, lo) => {
                if (!draft) return;
                setDraft({ ...draft, lat: la, lon: lo });
              }}
            />
            {selected && (
              <GeocodeSearch
                onPick={(r) => {
                  setDraft({
                    lat: r.lat,
                    lon: r.lon,
                    name: draft?.name || "",
                    address: draft?.address || r.displayName,
                  });
                }}
              />
            )}
          </div>
          {selected ? (
            <PlaceForm
              draft={draft}
              original={selected.place}
              onChange={setDraft}
              onSave={saveDraft}
              onReset={() =>
                setDraft(
                  selected.place
                    ? { ...selected.place }
                    : { lat: NaN, lon: NaN, name: "", address: "" },
                )
              }
              saving={saving}
              disabled={false}
            />
          ) : (
            <div className="empty" style={{ height: 120 }}>
              Select an entry from the list.
            </div>
          )}
        </div>
      </div>
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
