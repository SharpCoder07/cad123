import type { CSSProperties, ReactNode } from "react";

/** Public, server-renderable CMS elements. CMS HTML/JS is never executed. */
export type WebsiteElementData = {
  id: number;
  parentId: number | null;
  key: string;
  type: string;
  sortOrder: number;
  visible: boolean;
  content: unknown;
  styles: unknown;
  responsive?: unknown;
  action?: unknown;
};

type Props = { elements: WebsiteElementData[]; className?: string };
type JsonObject = Record<string, unknown>;
const isObject = (v: unknown): v is JsonObject => typeof v === "object" && v !== null && !Array.isArray(v);
const stringValue = (v: unknown, max = 4000) => typeof v === "string" ? v.slice(0, max) : "";

function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string" || !value || value.length > 2048) return undefined;
  const href = value.trim();
  if (/^\/(?!\/)[^\\\r\n]*$/.test(href) || /^#[a-zA-Z][\w-]*$/.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}

function safeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (/^#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(v)) return v;
  if (/^(?:transparent|currentColor|inherit|black|white)$/.test(v)) return v;
  const rgb = v.match(/^rgba?\(([^()]*)\)$/i);
  if (!rgb) return undefined;
  const values = rgb[1].split(",").map((part) => part.trim());
  if (values.length !== (v.toLowerCase().startsWith("rgba") ? 4 : 3)) return undefined;
  if (!values.slice(0, 3).every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return undefined;
  if (values.length === 4 && (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(values[3]))) return undefined;
  return v;
}

function safeLength(value: unknown, allowNegative = false): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 2000) {
    return value >= 0 || allowNegative ? `${value}px` : undefined;
  }
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (v === "0" || v === "auto") return v;
  const match = v.match(/^(-?\d{1,4}(?:\.\d{1,2})?)(px|rem|em|%|vw|vh)$/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && Math.abs(amount) <= 2000 && (allowNegative || amount >= 0) ? v : undefined;
}

/** Strictly allowlisted CSS properties; never inject arbitrary CSS or CMS HTML. */
export function safeWebsiteElementStyle(raw: unknown): CSSProperties {
  if (!isObject(raw)) return {};
  const style: CSSProperties = {};
  for (const key of ["color", "backgroundColor", "borderColor"] as const) {
    const color = safeColor(raw[key]);
    if (color) style[key] = color;
  }
  for (const key of [
    "fontSize", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "gap", "rowGap", "columnGap", "borderRadius", "borderWidth", "width", "maxWidth",
    "minWidth", "height", "minHeight", "maxHeight", "letterSpacing",
  ] as const) {
    const length = safeLength(raw[key]);
    if (length) style[key] = length;
  }
  for (const key of ["margin", "marginTop", "marginRight", "marginBottom", "marginLeft"] as const) {
    const length = safeLength(raw[key], true);
    if (length) style[key] = length;
  }
  const enums: Record<string, readonly string[]> = {
    textAlign: ["left", "center", "right", "justify", "start", "end"],
    fontWeight: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: ["block", "flex", "grid", "inline-flex", "inline-block", "none"],
    flexDirection: ["row", "column", "row-reverse", "column-reverse"],
    flexWrap: ["wrap", "nowrap", "wrap-reverse"],
    justifyContent: ["center", "start", "end", "flex-start", "flex-end", "stretch", "space-between", "space-around", "space-evenly"],
    alignItems: ["center", "start", "end", "stretch", "flex-start", "flex-end", "baseline"],
    alignSelf: ["auto", "start", "end", "center", "stretch", "flex-start", "flex-end"],
    borderStyle: ["none", "solid", "dashed", "dotted"],
    textTransform: ["none", "uppercase", "lowercase", "capitalize"],
    objectFit: ["contain", "cover", "fill", "none", "scale-down"],
    overflow: ["hidden", "visible", "auto", "scroll"],
  };
  for (const [key, choices] of Object.entries(enums)) {
    if (typeof raw[key] === "string" && choices.includes(raw[key])) Object.assign(style, { [key]: raw[key] });
  }
  if (typeof raw.lineHeight === "number" && Number.isFinite(raw.lineHeight) && raw.lineHeight >= 0.5 && raw.lineHeight <= 4) {
    style.lineHeight = raw.lineHeight;
  } else {
    const lineHeight = safeLength(raw.lineHeight);
    if (lineHeight) style.lineHeight = lineHeight;
  }
  if (typeof raw.opacity === "number" && Number.isFinite(raw.opacity) && raw.opacity >= 0 && raw.opacity <= 1) style.opacity = raw.opacity;
  return style;
}

function columnCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4 ? value : undefined;
}

/**
 * Layout contract for container/group/row/column elements:
 * styles.layout: "grid" | "flex" | "row" | "column"
 * styles.columns: 1..4 (desktop), responsive.tablet.columns and responsive.mobile.columns: 1..4.
 * Breakpoints use Tailwind's default md (768px) and lg (1024px).
 * Layout uses static, predeclared Tailwind classes (no dynamic class generation).
 */
function layoutClasses(element: WebsiteElementData): string {
  const styles = isObject(element.styles) ? element.styles : {};
  const responsive = isObject(element.responsive) ? element.responsive : {};
  const tablet = isObject(responsive.tablet) ? responsive.tablet : {};
  const mobile = isObject(responsive.mobile) ? responsive.mobile : {};
  const layout = styles.layout ?? styles.display;
  if (layout === "grid") {
    const desktopCount = columnCount(styles.columns) ?? 2;
    const tabletCount = columnCount(tablet.columns) ?? Math.min(desktopCount, 2);
    const mobileCount = columnCount(mobile.columns) ?? 1;
    const base = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"];
    const md = ["", "md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"];
    const lg = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];
    return `grid ${base[mobileCount]} ${md[tabletCount]} ${lg[desktopCount]}`;
  }
  if (layout === "flex" || layout === "row" || layout === "column") {
    const direction = layout === "column" ? "column" : styles.flexDirection === "column" ? "column" : "row";
    // Stack by default on narrow screens; row on desktop unless explicitly column.
    return direction === "column" ? "flex flex-col" : "flex flex-col md:flex-row md:flex-wrap";
  }
  return "";
}

function renderElement(element: WebsiteElementData, children: ReactNode): ReactNode {
  const content = isObject(element.content) ? element.content : {};
  const action = isObject(element.action) ? element.action : {};
  const style = safeWebsiteElementStyle(element.styles);
  const text = stringValue(content.text);
  const key = element.id;
  switch (element.type.toLowerCase()) {
    case "heading": {
      const tag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(String(content.tag))
        ? (content.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6") : "h2";
      const Tag = tag;
      return <Tag key={key} style={style}>{text}{children}</Tag>;
    }
    case "text":
    case "paragraph": return <p key={key} style={style}>{text}{children}</p>;
    case "button":
    case "link": {
      const href = safeHref(action.href ?? action.url ?? content.href ?? content.url);
      const label = text || stringValue(content.label, 200) || "Learn more";
      return href
        ? <a key={key} href={href} style={style} className="cursor-pointer" rel="noopener noreferrer">{label}{children}</a>
        : <span key={key} style={style}>{label}{children}</span>;
    }
    case "image": {
      const src = safeHref(content.src ?? content.url);
      if (!src || src.startsWith("#")) return null;
      return <div key={key} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={stringValue(content.alt ?? content.altText, 300)} loading="lazy" style={{ maxWidth: "100%", height: "auto" }} />
        {children}
      </div>;
    }
    case "container":
    case "group":
    case "column":
    case "row": {
      const classes = layoutClasses(element);
      // CSS grid must not be overridden by an inline display value.
      if (classes.startsWith("grid")) delete style.display;
      if (classes.startsWith("flex")) { delete style.display; delete style.flexDirection; }
      return <div key={key} className={classes || undefined} style={style}>{children}</div>;
    }
    case "divider": return <hr key={key} style={style} />;
    case "spacer": return <div key={key} aria-hidden="true" style={style} />;
    default: return null;
  }
}

export default function ElementRenderer({ elements, className }: Props) {
  const visible = elements.filter((element) => element.visible);
  const byId = new Map(visible.map((element) => [element.id, element]));
  const childrenByParent = new Map<number | null, WebsiteElementData[]>();
  for (const element of visible) {
    const parentId = element.parentId !== null && byId.has(element.parentId) && element.parentId !== element.id
      ? element.parentId : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(element);
    childrenByParent.set(parentId, siblings);
  }
  for (const siblings of childrenByParent.values()) siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const rendered = new Set<number>();
  function renderBranch(parentId: number | null, ancestors: Set<number>, depth: number): ReactNode {
    if (depth > 20) return null;
    return (childrenByParent.get(parentId) ?? []).map((element) => {
      if (ancestors.has(element.id) || rendered.has(element.id)) return null;
      rendered.add(element.id);
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(element.id);
      return renderElement(element, renderBranch(element.id, nextAncestors, depth + 1));
    });
  }
  const rootNodes = renderBranch(null, new Set<number>(), 0);
  // Invalid/cyclic parent chains are ignored rather than rendering arbitrary recursive trees.
  return <div className={className}>{rootNodes}</div>;
}
