import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { DatabasePicker } from "./components/DatabasePicker";
import { GeocodeSearch } from "./components/GeocodeSearch";
import { MapPanel } from "./components/MapPanel";
import { PagePreview } from "./components/PagePreview";
import { PlaceForm } from "./components/PlaceForm";
import { Sidebar } from "./components/Sidebar";
import { TokenSetup } from "./components/TokenSetup";
import {
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconMoon,
  IconPanelRight,
  IconPin,
  IconSearch,
  IconSidebar as IconSidebarToggle,
  IconSun,
} from "./components/icons";
import type { AuthStatus, DatabaseDetail, Entry, PageFull, PlaceValue } from "./types";

type Selection = {
  database: DatabaseDetail;
  dataSourceId: string;
  placeProperty: string;
};

const SELECTION_KEY = "nps.selection";
const THEME_KEY = "npp.theme";
const PEEK_KEY = "npp.peekOpen";

type Toast = { kind: "good" | "bad"; message: string };
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [peekOpen, setPeekOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem(PEEK_KEY);
    return stored === null ? true : stored === "1";
  });
  const [filter, setFilter] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [geocodeOpen, setGeocodeOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(PEEK_KEY, peekOpen ? "1" : "0");
  }, [peekOpen]);

  const [pageFull, setPageFull] = useState<PageFull | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

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

  // Fetch the full page (properties + blocks) for the peek preview.
  useEffect(() => {
    if (!selectedId) {
      setPageFull(null);
      return;
    }
    let cancelled = false;
    setPageLoading(true);
    api
      .getPage(selectedId)
      .then((p) => {
        if (!cancelled) setPageFull(p);
      })
      .catch(() => {
        if (!cancelled) setPageFull(null);
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

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

  // ⌘/Ctrl+S to save, ⌘/Ctrl+K to open geocode search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (selected) {
          e.preventDefault();
          setGeocodeOpen(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft, selected]);

  // ---- Loading splash ----
  if (!auth) {
    return (
      <div className="modal-backdrop">
        <div className="muted">Loading…</div>
      </div>
    );
  }

  // ---- Onboarding: token ----
  if (!auth.configured) {
    return (
      <TokenSetup
        initialError={auth.error}
        onAuthenticated={(s) => setAuth(s)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // ---- Onboarding: database ----
  if (!selection) {
    return (
      <DatabasePicker
        onSelected={(s) => {
          localStorage.setItem(SELECTION_KEY, JSON.stringify(s));
          setSelection(s);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // ---- Editor ----
  const lat = draft && Number.isFinite(draft.lat) ? draft.lat : null;
  const lon = draft && Number.isFinite(draft.lon) ? draft.lon : null;

  return (
    <div className="shell">
      {!sidebarCollapsed && (
        <Sidebar
          workspaceName={auth.workspaceName}
          botName={auth.botName}
          databaseTitle={selection.database.title}
          placeProperty={selection.placeProperty}
          entries={entries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loadingEntries}
          filter={filter}
          onFilterChange={setFilter}
          onlyMissing={onlyMissing}
          onOnlyMissingChange={setOnlyMissing}
          theme={theme}
          onToggleTheme={toggleTheme}
          onCollapse={() => setSidebarCollapsed(true)}
          onChangeDatabase={() => {
            localStorage.removeItem(SELECTION_KEY);
            setSelection(null);
            setEntries([]);
            setSelectedId(null);
          }}
        />
      )}

      <main className="page">
        <div className="page-header">
          {sidebarCollapsed && (
            <button
              className="icon-button"
              onClick={() => setSidebarCollapsed(false)}
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <IconSidebarToggle />
            </button>
          )}
          <div className="breadcrumb">
            <span className="crumb">{selection.database.title}</span>
            <IconChevronRight size={12} className="sep" />
            <span className="crumb current">
              {selected?.title || "Select an entry"}
            </span>
          </div>
          <div className="actions">
            <button
              className="icon-button"
              onClick={() => selected && setGeocodeOpen(true)}
              disabled={!selected}
              title="Search location (⌘K)"
              aria-label="Search location"
            >
              <IconSearch />
            </button>
            <button
              className="icon-button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <button
              className={`icon-button${peekOpen ? " active" : ""}`}
              onClick={() => setPeekOpen((v) => !v)}
              disabled={!selected}
              title={peekOpen ? "Close properties panel" : "Open properties panel"}
              aria-label="Toggle properties panel"
            >
              <IconPanelRight />
            </button>
          </div>
        </div>

        <div className="page-body">
          {selected ? (
            <>
              <h1 className="page-title">
                <span className="title-icon">
                  <IconPin size={28} />
                </span>
                <span>{selected.title || "Untitled"}</span>
              </h1>

              <div className="cover-actions">
                <button
                  className="button-ghost"
                  onClick={() => setGeocodeOpen(true)}
                  title="Search a location to drop the pin"
                >
                  <IconSearch size={14} />
                  Search location
                  <span className="kbd-hint">⌘K</span>
                </button>
              </div>

              <div className="cover">
                <MapPanel
                  lat={lat}
                  lon={lon}
                  onPick={(la, lo) => {
                    if (!draft) return;
                    setDraft({ ...draft, lat: la, lon: lo });
                  }}
                />
              </div>

              <div className="properties-heading">Place Properties</div>
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
            </>
          ) : (
            <div className="page-empty">
              {loadingEntries
                ? "Loading entries…"
                : entries.length === 0
                ? "No entries in this database yet."
                : "Select an entry from the sidebar to begin."}
            </div>
          )}
        </div>
      </main>

      {selected && peekOpen && (
        <aside className="peek">
          <div className="peek-header">
            <span className="peek-title muted">Page preview</span>
            <span style={{ flex: 1 }} />
            <button
              className="icon-button"
              onClick={() => setPeekOpen(false)}
              title="Close page preview"
              aria-label="Close page preview"
            >
              <IconPanelRight />
            </button>
          </div>
          <div className="peek-body">
            <PagePreview
              page={pageFull}
              loading={pageLoading}
              databaseTitle={selection.database.title}
            />
          </div>
        </aside>
      )}

      {geocodeOpen && selected && (
        <GeocodeSearch
          onClose={() => setGeocodeOpen(false)}
          onPick={(r) => {
            setDraft({
              lat: r.lat,
              lon: r.lon,
              name: draft?.name || "",
              address: draft?.address || r.displayName,
            });
            setGeocodeOpen(false);
          }}
        />
      )}

      {toast && (
        <div className={`toast ${toast.kind}`} role="status">
          <span className="toast-icon">
            {toast.kind === "good" ? <IconCheck /> : <IconAlert />}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
