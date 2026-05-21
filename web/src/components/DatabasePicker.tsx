import { useEffect, useState } from "react";
import { api } from "../api";
import type { DatabaseDetail, DatabaseSummary } from "../types";
import { IconDatabase, IconMoon, IconSun } from "./icons";

type Theme = "light" | "dark";

type Props = {
  onSelected: (selection: {
    database: DatabaseDetail;
    dataSourceId: string;
    placeProperty: string;
  }) => void;
  theme: Theme;
  onToggleTheme: () => void;
};

export function DatabasePicker({ onSelected, theme, onToggleTheme }: Props) {
  const [databases, setDatabases] = useState<DatabaseSummary[] | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DatabaseDetail | null>(null);
  const [chosenProperty, setChosenProperty] = useState<string>("");

  useEffect(() => {
    api.listDatabases().then(setDatabases).catch((e) => setError((e as Error).message));
  }, []);

  async function selectDatabase(db: DatabaseSummary) {
    setLoadingId(db.id);
    setError(undefined);
    try {
      const d = await api.getDatabase(db.id);
      setDetail(d);
      const placeProps = d.properties.filter((p) => p.type === "place");
      if (placeProps.length === 1) {
        setChosenProperty(placeProps[0]!.name);
      } else if (placeProps.length === 0) {
        setError(
          "This database has no property of type 'Place'. Add one in Notion first.",
        );
      } else {
        setChosenProperty("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  function confirm() {
    if (!detail || !chosenProperty || !detail.primaryDataSourceId) return;
    onSelected({
      database: detail,
      dataSourceId: detail.primaryDataSourceId,
      placeProperty: chosenProperty,
    });
  }

  const themeToggle = (
    <button
      className="icon-button theme-toggle-corner"
      onClick={onToggleTheme}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );

  if (detail) {
    const placeProps = detail.properties.filter((p) => p.type === "place");
    return (
      <div className="modal-backdrop">
        {themeToggle}
        <div className="modal">
          <h2>{detail.title}</h2>
          {placeProps.length === 0 ? (
            <p className="error">No "Place" property found. Add one in Notion and reload.</p>
          ) : (
            <>
              <p>Pick which Place property to edit:</p>
              <select
                className="input-bordered"
                value={chosenProperty}
                onChange={(e) => setChosenProperty(e.target.value)}
              >
                <option value="" disabled>
                  — select —
                </option>
                {placeProps.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="modal-row">
            <button className="button-ghost" onClick={() => setDetail(null)}>
              Back
            </button>
            <span style={{ flex: 1 }} />
            <button
              className="button-primary"
              disabled={!chosenProperty}
              onClick={confirm}
            >
              Open editor
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      {themeToggle}
      <div className="modal wide">
        <h2>Pick a database</h2>
        <p>
          Showing databases your integration is connected to. Don't see yours? Open it in
          Notion → <strong>…</strong> → <strong>Connections</strong> → add the integration.
        </p>
        {!databases && !error && <p className="muted">Loading…</p>}
        {error && <div className="error">{error}</div>}
        {databases && (
          <div className="db-list">
            {databases.length === 0 && (
              <p className="error" style={{ padding: 12 }}>
                No databases visible to this integration.
              </p>
            )}
            {databases.map((db) => (
              <div
                key={db.id}
                className="db-row"
                onClick={() => selectDatabase(db)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectDatabase(db);
                  }
                }}
              >
                <span className="db-icon">
                  <IconDatabase />
                </span>
                <div className="db-text">
                  <div className="db-title">{db.title || "Untitled"}</div>
                  <div className="db-sub">
                    {loadingId === db.id ? "Loading…" : db.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
