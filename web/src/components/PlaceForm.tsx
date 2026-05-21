import type { PlaceValue } from "../types";

type Props = {
  draft: PlaceValue | null;
  original: PlaceValue | null;
  onChange: (next: PlaceValue) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  disabled: boolean;
};

function isValid(p: PlaceValue | null): boolean {
  if (!p) return false;
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    p.lat >= -90 && p.lat <= 90 &&
    p.lon >= -180 && p.lon <= 180
  );
}

function dirty(a: PlaceValue | null, b: PlaceValue | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return (
    a.lat !== b.lat ||
    a.lon !== b.lon ||
    (a.name ?? "") !== (b.name ?? "") ||
    (a.address ?? "") !== (b.address ?? "")
  );
}

export function PlaceForm({ draft, original, onChange, onSave, onReset, saving, disabled }: Props) {
  const empty: PlaceValue = { lat: NaN, lon: NaN, name: "", address: "" };
  const d = draft ?? empty;
  const valid = isValid(draft);
  const isDirty = dirty(draft, original);

  function setField<K extends keyof PlaceValue>(key: K, value: PlaceValue[K]) {
    onChange({ ...(d as PlaceValue), [key]: value } as PlaceValue);
  }

  return (
    <div className="details">
      <label className="field">
        <span>Latitude</span>
        <input
          type="number"
          step="any"
          value={Number.isFinite(d.lat) ? d.lat : ""}
          onChange={(e) => setField("lat", e.target.value === "" ? NaN : Number(e.target.value))}
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span>Longitude</span>
        <input
          type="number"
          step="any"
          value={Number.isFinite(d.lon) ? d.lon : ""}
          onChange={(e) => setField("lon", e.target.value === "" ? NaN : Number(e.target.value))}
          disabled={disabled}
        />
      </label>
      <label className="field full">
        <span>Name (optional)</span>
        <input
          value={d.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="field full">
        <span>Address (optional)</span>
        <input
          value={d.address ?? ""}
          onChange={(e) => setField("address", e.target.value)}
          disabled={disabled}
        />
      </label>
      <div className="actions">
        <span className="spacer" />
        <button onClick={onReset} disabled={disabled || saving || !isDirty}>
          Reset
        </button>
        <button
          className="primary"
          onClick={onSave}
          disabled={disabled || saving || !valid || !isDirty}
        >
          {saving ? "Saving..." : "Save to Notion"}
        </button>
      </div>
    </div>
  );
}
