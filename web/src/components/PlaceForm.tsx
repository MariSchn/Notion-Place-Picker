import type { PlaceValue } from "../types";
import { IconHash, IconHome, IconPin, IconText } from "./icons";

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
    <div>
      <div className="properties">
        <div className="property-row">
          <div className="property-label">
            <span className="label-icon"><IconHash size={14} /></span>
            <span>Latitude</span>
          </div>
          <div className="property-value">
            <input
              type="number"
              step="any"
              placeholder="Empty"
              value={Number.isFinite(d.lat) ? d.lat : ""}
              onChange={(e) =>
                setField("lat", e.target.value === "" ? NaN : Number(e.target.value))
              }
              disabled={disabled}
            />
          </div>
        </div>

        <div className="property-row">
          <div className="property-label">
            <span className="label-icon"><IconHash size={14} /></span>
            <span>Longitude</span>
          </div>
          <div className="property-value">
            <input
              type="number"
              step="any"
              placeholder="Empty"
              value={Number.isFinite(d.lon) ? d.lon : ""}
              onChange={(e) =>
                setField("lon", e.target.value === "" ? NaN : Number(e.target.value))
              }
              disabled={disabled}
            />
          </div>
        </div>

        <div className="property-row">
          <div className="property-label">
            <span className="label-icon"><IconText size={14} /></span>
            <span>Name</span>
          </div>
          <div className="property-value">
            <input
              placeholder="Empty"
              value={d.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="property-row">
          <div className="property-label">
            <span className="label-icon"><IconHome size={14} /></span>
            <span>Address</span>
          </div>
          <div className="property-value">
            <input
              placeholder="Empty"
              value={d.address ?? ""}
              onChange={(e) => setField("address", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="property-row">
          <div className="property-label">
            <span className="label-icon"><IconPin size={14} /></span>
            <span>Status</span>
          </div>
          <div className="property-value" style={{ paddingLeft: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>
              {!valid ? "Place not set" : isDirty ? "Unsaved changes" : "Saved"}
            </span>
          </div>
        </div>
      </div>

      <div className="property-actions">
        <span className="spacer" />
        {isDirty && (
          <span className="save-hint">
            <kbd className="kbd-hint">⌘S</kbd> to save
          </span>
        )}
        <button
          className="button-ghost"
          onClick={onReset}
          disabled={disabled || saving || !isDirty}
        >
          Reset
        </button>
        <button
          className="button-primary"
          onClick={onSave}
          disabled={disabled || saving || !valid || !isDirty}
        >
          {saving ? "Saving…" : "Save to Notion"}
        </button>
      </div>
    </div>
  );
}
