import { useMemo } from "react";
import type { Entry } from "../types";
import { EntryList } from "./EntryList";
import {
  IconDatabase,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSidebar as IconSidebarToggle,
  IconSun,
} from "./icons";

type Theme = "light" | "dark";

type Props = {
  workspaceName?: string;
  botName?: string;
  databaseTitle: string;
  placeProperty: string;
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  filter: string;
  onFilterChange: (v: string) => void;
  onlyMissing: boolean;
  onOnlyMissingChange: (v: boolean) => void;
  onChangeDatabase: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onCollapse: () => void;
};

export function Sidebar({
  workspaceName,
  botName,
  databaseTitle,
  placeProperty,
  entries,
  selectedId,
  onSelect,
  loading,
  filter,
  onFilterChange,
  onlyMissing,
  onOnlyMissingChange,
  onChangeDatabase,
  theme,
  onToggleTheme,
  onCollapse,
}: Props) {
  const filteredCount = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (onlyMissing && e.place) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      return true;
    }).length;
  }, [entries, filter, onlyMissing]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="workspace">
          <span className="workspace-name">
            {workspaceName || "Notion Place Picker"}
          </span>
          {botName && <span className="workspace-bot">· {botName}</span>}
        </div>
        <button
          className="icon-button"
          title="Collapse sidebar"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
        >
          <IconSidebarToggle />
        </button>
      </div>

      <div className="sidebar-search">
        <div className="input-wrap">
          <IconSearch className="icon" size={14} />
          <input
            placeholder="Search entries…"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-toggles">
        <label>
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => onOnlyMissingChange(e.target.checked)}
          />
          Only missing
        </label>
        <span className="spacer" />
        <span>
          {filteredCount} / {entries.length}
        </span>
      </div>

      <div className="sidebar-section">
        <IconDatabase size={12} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {databaseTitle}
        </span>
        <span style={{ flex: 1 }} />
        <span className="muted" style={{ fontSize: 11, textTransform: "none" }}>
          {placeProperty}
        </span>
      </div>

      <EntryList
        entries={entries}
        selectedId={selectedId}
        onSelect={onSelect}
        loading={loading}
        filter={filter}
        onlyMissing={onlyMissing}
      />

      <div className="sidebar-footer">
        <button
          className="footer-button"
          onClick={onChangeDatabase}
          title="Change database"
        >
          <IconSettings size={14} />
          <span>Change database</span>
        </button>
        <button
          className="icon-button"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </aside>
  );
}
