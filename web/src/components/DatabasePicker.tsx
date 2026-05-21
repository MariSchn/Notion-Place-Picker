import { useEffect, useState } from "react";
import { api } from "../api";
import type { DatabaseDetail, DatabaseSummary } from "../types";

type Props = {
  onSelected: (selection: {
    database: DatabaseDetail;
    dataSourceId: string;
    placeProperty: string;
  }) => void;
};

export function DatabasePicker({ onSelected }: Props) {
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

  if (detail) {
    const placeProps = detail.properties.filter((p) => p.type === "place");
    return (
      <div className="centered">
        <div className="card">
          <h2>{detail.title}</h2>
          {placeProps.length === 0 ? (
            <p className="error">No "Place" property found. Add one in Notion and reload.</p>
          ) : (
            <>
              <p>Pick which Place property to edit:</p>
              <select
                value={chosenProperty}
                onChange={(e) => setChosenProperty(e.target.value)}
              >
                <option value="" disabled>
                  -- select --
                </option>
                {placeProps.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="row">
            <button onClick={() => setDetail(null)}>Back</button>
            <button className="primary" disabled={!chosenProperty} onClick={confirm}>
              Open editor
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="centered">
      <div className="card db-picker">
        <h2>Pick a database</h2>
        <p>
          Showing databases your integration is connected to. Don't see yours? Open it in
          Notion → <strong>...</strong> → <strong>Connections</strong> → add the
          integration.
        </p>
        {!databases && !error && <p>Loading...</p>}
        {error && <div className="error">{error}</div>}
        {databases && (
          <div className="db-list">
            {databases.length === 0 && (
              <p className="error">No databases visible to this integration.</p>
            )}
            {databases.map((db) => (
              <div
                key={db.id}
                className="db"
                onClick={() => selectDatabase(db)}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontWeight: 600 }}>{db.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {loadingId === db.id ? "Loading..." : `id: ${db.id}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
