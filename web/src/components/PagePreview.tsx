import type { ReactNode } from "react";
import type { NotionBlock, NotionIcon, NotionProperty, PageFull } from "../types";
import {
  IconCalendar,
  IconCheckSquare,
  IconHash,
  IconHome,
  IconLink,
  IconMail,
  IconPhone,
  IconPin,
  IconTag,
  IconText,
  IconUser,
} from "./icons";

type Props = {
  page: PageFull | null;
  loading: boolean;
  databaseTitle: string;
};

type RichTextRun = {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
};

function renderRichText(runs: RichTextRun[] | undefined): ReactNode {
  if (!runs || runs.length === 0) return null;
  return runs.map((r, i) => {
    const a = r.annotations ?? {};
    let node: ReactNode = r.plain_text;
    if (a.code) node = <code>{node}</code>;
    const style: React.CSSProperties = {};
    if (a.bold) style.fontWeight = 600;
    if (a.italic) style.fontStyle = "italic";
    if (a.underline) style.textDecoration = "underline";
    if (a.strikethrough)
      style.textDecoration = (style.textDecoration ? style.textDecoration + " " : "") + "line-through";
    if (a.color && a.color !== "default") {
      if (a.color.endsWith("_background")) {
        style.background = colorBg(a.color.replace("_background", ""));
        style.padding = "0 4px";
        style.borderRadius = 3;
      } else {
        style.color = colorFg(a.color);
      }
    }
    const inner =
      r.href ? (
        <a href={r.href} target="_blank" rel="noreferrer">
          {node}
        </a>
      ) : (
        node
      );
    return (
      <span key={i} style={style}>
        {inner}
      </span>
    );
  });
}

function plainText(runs: RichTextRun[] | undefined): string {
  if (!runs) return "";
  return runs.map((r) => r.plain_text ?? "").join("");
}

// Notion color tokens
function colorBg(c: string): string {
  switch (c) {
    case "gray": return "var(--n-gray-bg)";
    case "brown": return "var(--n-brown-bg)";
    case "orange": return "var(--n-orange-bg)";
    case "yellow": return "var(--n-yellow-bg)";
    case "green": return "var(--n-green-bg)";
    case "blue": return "var(--n-blue-bg)";
    case "purple": return "var(--n-purple-bg)";
    case "pink": return "var(--n-pink-bg)";
    case "red": return "var(--n-red-bg)";
    default: return "var(--n-default-bg)";
  }
}
function colorFg(c: string): string {
  switch (c) {
    case "gray": return "var(--n-gray-fg)";
    case "brown": return "var(--n-brown-fg)";
    case "orange": return "var(--n-orange-fg)";
    case "yellow": return "var(--n-yellow-fg)";
    case "green": return "var(--n-green-fg)";
    case "blue": return "var(--n-blue-fg)";
    case "purple": return "var(--n-purple-fg)";
    case "pink": return "var(--n-pink-fg)";
    case "red": return "var(--n-red-fg)";
    default: return "var(--text)";
  }
}

function Tag({ name, color }: { name: string; color?: string }) {
  return (
    <span className="np-tag" style={{ background: colorBg(color ?? "default"), color: colorFg(color ?? "default") }}>
      {name}
    </span>
  );
}

function PropertyIcon({ type }: { type: string }) {
  const map: Record<string, ReactNode> = {
    title: <IconText size={14} />,
    rich_text: <IconText size={14} />,
    checkbox: <IconCheckSquare size={14} />,
    select: <IconTag size={14} />,
    multi_select: <IconTag size={14} />,
    status: <IconTag size={14} />,
    url: <IconLink size={14} />,
    email: <IconMail size={14} />,
    phone_number: <IconPhone size={14} />,
    number: <IconHash size={14} />,
    date: <IconCalendar size={14} />,
    created_time: <IconCalendar size={14} />,
    last_edited_time: <IconCalendar size={14} />,
    people: <IconUser size={14} />,
    created_by: <IconUser size={14} />,
    last_edited_by: <IconUser size={14} />,
    place: <IconPin size={14} />,
    files: <IconHome size={14} />,
  };
  return <span className="np-prop-icon">{map[type] ?? <IconText size={14} />}</span>;
}

function shortenUrl(u: string): string {
  try {
    const url = new URL(u);
    const path = url.pathname.length > 12 ? url.pathname.slice(0, 8) + "…" : url.pathname;
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return u;
  }
}

function formatDate(d: { start?: string | null; end?: string | null } | null): string {
  if (!d || !d.start) return "";
  const fmt = (s: string) => {
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return s;
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  const start = fmt(d.start);
  if (d.end) return `${start} → ${fmt(d.end)}`;
  return start;
}

function PropertyValue({ prop }: { prop: NotionProperty }): ReactNode {
  switch (prop.type) {
    case "title": {
      const runs = prop.title as RichTextRun[] | undefined;
      return <span>{renderRichText(runs) || <span className="np-empty">Empty</span>}</span>;
    }
    case "rich_text": {
      const runs = prop.rich_text as RichTextRun[] | undefined;
      const text = plainText(runs);
      return text ? <span>{renderRichText(runs)}</span> : <span className="np-empty">Empty</span>;
    }
    case "checkbox": {
      const checked = Boolean(prop.checkbox);
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="np-checkbox"
          aria-label="Checkbox"
        />
      );
    }
    case "select": {
      const v = prop.select as { name: string; color?: string } | null | undefined;
      return v ? <Tag name={v.name} color={v.color} /> : <span className="np-empty">Empty</span>;
    }
    case "status": {
      const v = prop.status as { name: string; color?: string } | null | undefined;
      return v ? <Tag name={v.name} color={v.color} /> : <span className="np-empty">Empty</span>;
    }
    case "multi_select": {
      const arr = (prop.multi_select as { name: string; color?: string }[] | undefined) ?? [];
      if (arr.length === 0) return <span className="np-empty">Empty</span>;
      return (
        <span className="np-tags">
          {arr.map((t, i) => (
            <Tag key={i} name={t.name} color={t.color} />
          ))}
        </span>
      );
    }
    case "url": {
      const u = prop.url as string | null | undefined;
      return u ? (
        <a href={u} target="_blank" rel="noreferrer" className="np-link">
          {shortenUrl(u)}
        </a>
      ) : (
        <span className="np-empty">Empty</span>
      );
    }
    case "email": {
      const v = prop.email as string | null | undefined;
      return v ? (
        <a href={`mailto:${v}`} className="np-link">{v}</a>
      ) : (
        <span className="np-empty">Empty</span>
      );
    }
    case "phone_number": {
      const v = prop.phone_number as string | null | undefined;
      return v ? <span>{v}</span> : <span className="np-empty">Empty</span>;
    }
    case "number": {
      const v = prop.number as number | null | undefined;
      return v == null ? <span className="np-empty">Empty</span> : <span>{v}</span>;
    }
    case "date": {
      const v = prop.date as { start?: string | null; end?: string | null } | null | undefined;
      const text = formatDate(v ?? null);
      return text ? <span>{text}</span> : <span className="np-empty">Empty</span>;
    }
    case "created_time": {
      return <span>{formatDate({ start: prop.created_time as string })}</span>;
    }
    case "last_edited_time": {
      return <span>{formatDate({ start: prop.last_edited_time as string })}</span>;
    }
    case "people": {
      const arr = (prop.people as { name?: string; person?: { email?: string } }[] | undefined) ?? [];
      if (arr.length === 0) return <span className="np-empty">Empty</span>;
      return (
        <span className="np-tags">
          {arr.map((p, i) => (
            <span key={i} className="np-person">
              <span className="np-avatar">{(p.name ?? "?").slice(0, 1).toUpperCase()}</span>
              <span>{p.name ?? "Unknown"}</span>
            </span>
          ))}
        </span>
      );
    }
    case "files": {
      const arr = (prop.files as { name?: string }[] | undefined) ?? [];
      return arr.length === 0 ? (
        <span className="np-empty">Empty</span>
      ) : (
        <span className="muted">{arr.length} file{arr.length === 1 ? "" : "s"}</span>
      );
    }
    case "relation": {
      const arr = (prop.relation as { id: string }[] | undefined) ?? [];
      return arr.length === 0 ? (
        <span className="np-empty">Empty</span>
      ) : (
        <span className="muted">{arr.length} relation{arr.length === 1 ? "" : "s"}</span>
      );
    }
    case "place": {
      const v = prop.place as { lat: number; lon: number; name?: string; address?: string } | null | undefined;
      if (!v) return <span className="np-empty">Empty</span>;
      return <span>{v.name || v.address || `${v.lat.toFixed(4)}, ${v.lon.toFixed(4)}`}</span>;
    }
    case "formula": {
      const f = prop.formula as { type: string; [k: string]: unknown } | undefined;
      if (!f) return <span className="np-empty">Empty</span>;
      const v = (f as Record<string, unknown>)[f.type];
      if (v == null || v === "") return <span className="np-empty">Empty</span>;
      if (typeof v === "boolean") return <input type="checkbox" checked={v} readOnly className="np-checkbox" />;
      return <span>{String(v)}</span>;
    }
    case "rollup": {
      const r = prop.rollup as { type: string; [k: string]: unknown } | undefined;
      if (!r) return <span className="np-empty">Empty</span>;
      const v = (r as Record<string, unknown>)[r.type];
      if (v == null) return <span className="np-empty">Empty</span>;
      if (Array.isArray(v)) return <span className="muted">{v.length} item{v.length === 1 ? "" : "s"}</span>;
      return <span>{String(v)}</span>;
    }
    default:
      return <span className="np-empty">Unsupported</span>;
  }
}

function Block({ block, index, blocks }: { block: NotionBlock; index: number; blocks: NotionBlock[] }) {
  const t = block.type;
  const data = (block as Record<string, unknown>)[t] as Record<string, unknown> | undefined;
  const richText = (data?.rich_text as RichTextRun[] | undefined) ?? undefined;

  switch (t) {
    case "paragraph": {
      const rendered = renderRichText(richText);
      return <p className="np-p">{rendered || <span className="np-empty">&nbsp;</span>}</p>;
    }
    case "heading_1":
      return <h1 className="np-h1">{renderRichText(richText)}</h1>;
    case "heading_2":
      return <h2 className="np-h2">{renderRichText(richText)}</h2>;
    case "heading_3":
      return <h3 className="np-h3">{renderRichText(richText)}</h3>;
    case "bulleted_list_item":
      return (
        <div className="np-li">
          <span className="np-bullet">•</span>
          <span>{renderRichText(richText)}</span>
        </div>
      );
    case "numbered_list_item": {
      // Numbering: count consecutive numbered_list_item blocks before this index.
      let n = 1;
      for (let i = index - 1; i >= 0; i--) {
        if (blocks[i]?.type === "numbered_list_item") n++;
        else break;
      }
      return (
        <div className="np-li">
          <span className="np-bullet">{n}.</span>
          <span>{renderRichText(richText)}</span>
        </div>
      );
    }
    case "to_do": {
      const checked = Boolean(data?.checked);
      return (
        <div className="np-todo">
          <input type="checkbox" checked={checked} readOnly className="np-checkbox" />
          <span style={checked ? { textDecoration: "line-through", color: "var(--text-muted)" } : undefined}>
            {renderRichText(richText)}
          </span>
        </div>
      );
    }
    case "quote":
      return <blockquote className="np-quote">{renderRichText(richText)}</blockquote>;
    case "callout": {
      const icon = data?.icon as { emoji?: string } | undefined;
      return (
        <div className="np-callout">
          {icon?.emoji && <span className="np-callout-icon">{icon.emoji}</span>}
          <span>{renderRichText(richText)}</span>
        </div>
      );
    }
    case "code": {
      return (
        <pre className="np-code">
          <code>{plainText(richText)}</code>
        </pre>
      );
    }
    case "divider":
      return <hr className="np-divider" />;
    case "toggle":
      return (
        <details className="np-toggle">
          <summary>{renderRichText(richText)}</summary>
        </details>
      );
    case "child_page":
    case "child_database":
      return <div className="np-child">📄 {String(data?.title ?? "Untitled")}</div>;
    default:
      return <div className="np-unsupported muted">[{t}]</div>;
  }
}

function PageIcon({ icon }: { icon: NotionIcon }) {
  if (!icon) return <IconPin size={26} />;
  if (icon.type === "emoji") return <span className="np-emoji">{icon.emoji}</span>;
  if (icon.type === "external") return <img src={icon.external.url} alt="" className="np-img-icon" />;
  if (icon.type === "file") return <img src={icon.file.url} alt="" className="np-img-icon" />;
  return <IconPin size={26} />;
}

export function PagePreview({ page, loading, databaseTitle }: Props) {
  if (loading && !page) {
    return <div className="peek-loading muted">Loading page…</div>;
  }
  if (!page) {
    return <div className="peek-loading muted">No page selected.</div>;
  }

  const propsArr = Object.entries(page.properties);

  return (
    <div className="np-page">
      <h2 className="np-title">
        <span className="np-title-icon"><PageIcon icon={page.icon} /></span>
        <span>{page.title || "Untitled"}</span>
      </h2>

      <div className="np-page-meta">
        <span className="muted">In</span>
        <span className="peek-chip">{databaseTitle}</span>
      </div>

      <div className="np-properties">
        {propsArr.map(([name, prop]) => (
          <div className="np-row" key={name}>
            <div className="np-label">
              <PropertyIcon type={prop.type} />
              <span className="np-name">{name}</span>
            </div>
            <div className="np-value">
              <PropertyValue prop={prop} />
            </div>
          </div>
        ))}
        <div className="np-row np-add-row muted">
          <span className="np-plus">+</span>
          <span>Add a property</span>
        </div>
      </div>

      <div className="np-divider-wrap" />

      <div className="np-blocks">
        {page.blocks.length === 0 ? (
          <div className="np-empty-page muted">This page is empty.</div>
        ) : (
          page.blocks.map((b, i) => (
            <Block key={b.id} block={b} index={i} blocks={page.blocks} />
          ))
        )}
      </div>
    </div>
  );
}
