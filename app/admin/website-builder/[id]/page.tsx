"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  GripVertical,
  History,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";

type Element = {
  id: number;
  key: string;
  type: string;
  sortOrder: number;
  visible: boolean;
  content: unknown;
  styles?: unknown;
  responsive?: unknown;
  action?: unknown;
  parentId?: number | null;
};
type Section = {
  id: number;
  key: string;
  name: string | null;
  type: string;
  sortOrder: number;
  visible: boolean;
  elements: Element[];
  settings?: unknown;
  styles?: unknown;
};
type Version = {
  id: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  sections: Section[];
};
type CmsPage = {
  id: number;
  title: string;
  slug: string;
  status: string;
  publishedVersion: number | null;
  versions: Version[];
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
};
type ApiResponse<T> = { success?: boolean; message?: string; data?: T };


type SectionTemplate = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  createdAt: string;
  updatedAt?: string;
};

const SECTION_TYPES = [
  "hero",
  "text",
  "features",
  "cta",
  "gallery",
  "faq",
  "testimonials",
  "pricing",
  "stats",
  "contact",
  "header",
  "footer",
  "blank",
] as const;
const ELEMENT_TYPES = [
  "heading",
  "text",
  "button",
  "image",
  "divider",
  "spacer",
  "container",
  "group",
  "row",
  "column",
] as const;

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload.data as T;
}

function elementText(element: Element): string {
  if (
    !element.content ||
    typeof element.content !== "object" ||
    Array.isArray(element.content)
  )
    return "";
  const data = element.content as Record<string, unknown>;
  return typeof data.text === "string"
    ? data.text
    : typeof data.src === "string"
      ? data.src
      : "";
}

type StyleValues = Record<string, string>;
const STYLE_FIELDS = [
  { key: "backgroundColor", label: "Background color", placeholder: "#ffffff" },
  { key: "color", label: "Text color", placeholder: "#0f172a" },
  { key: "fontSize", label: "Font size", placeholder: "24px" },
  { key: "fontWeight", label: "Font weight", placeholder: "700" },
  {
    key: "textAlign",
    label: "Text alignment",
    placeholder: "left / center / right",
  },
  { key: "padding", label: "Padding", placeholder: "24px" },
  { key: "margin", label: "Margin", placeholder: "0px" },
  { key: "gap", label: "Gap", placeholder: "16px" },
  { key: "borderRadius", label: "Border radius", placeholder: "12px" },
  { key: "borderColor", label: "Border color", placeholder: "#e2e8f0" },
  { key: "maxWidth", label: "Maximum width", placeholder: "960px" },
] as const;

function styleValues(input: unknown): StyleValues {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const obj = input as Record<string, unknown>;
  const values: StyleValues = {};
  for (const field of STYLE_FIELDS) {
    if (
      typeof obj[field.key] === "string" ||
      typeof obj[field.key] === "number"
    ) {
      values[field.key] = String(obj[field.key]);
    }
  }
  return values;
}

function cssStyle(input: unknown, overrides?: StyleValues): CSSProperties {
  const values = { ...styleValues(input), ...overrides };
  const result: Record<string, string> = {};
  for (const field of STYLE_FIELDS) {
    const value = values[field.key]?.trim();
    if (value) result[field.key] = value;
  }
  return result as CSSProperties;
}

function StyleEditor({
  values,
  onChange,
  onSave,
  busy,
  saveLabel = "Save styles",
}: {
  values: StyleValues;
  onChange: (value: StyleValues) => void;
  onSave: () => void;
  busy: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {STYLE_FIELDS.map((field) => (
          <label
            key={field.key}
            className="block min-w-0 text-xs font-semibold text-slate-600"
          >
            {field.label}
            <input
              value={values[field.key] ?? ""}
              onChange={(event) =>
                onChange({ ...values, [field.key]: event.target.value })
              }
              placeholder={field.placeholder}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-normal text-slate-900"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Save size={15} /> {saveLabel}
      </button>
      <p className="text-xs text-slate-500">
        Preview updates as you type. Save styles to persist them in the draft.
      </p>
    </div>
  );
}

type LayoutValues = {
  layout: "block" | "grid" | "flex";
  columns: number;
  tabletColumns: number;
  mobileColumns: number;
  gap: string;
  rowGap: string;
  columnGap: string;
  flexDirection: "row" | "column";
  justifyContent: "start" | "center" | "end" | "space-between" | "space-around";
  alignItems: "start" | "center" | "end" | "stretch";
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const columns = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 4
    ? v
    : fallback;
const cssLength = (v: unknown, fallback = "16px") =>
  typeof v === "string" &&
  /^(?:0|\d{1,3}(?:\.\d{1,2})?(?:px|rem|em|%))$/.test(v.trim())
    ? v.trim()
    : fallback;

function layoutValues(
  settings: unknown,
  responsive?: unknown,
  styles?: unknown,
): LayoutValues {
  const config = record(settings);
  const saved = record(styles);
  const devices = record(responsive ?? config.responsive);
  const desktop = columns(config.columns ?? saved.columns, 2);
  const tablet = record(devices.tablet);
  const mobile = record(devices.mobile);
  const kind = config.layout ?? saved.layout;
  return {
    layout: kind === "grid" || kind === "flex" ? kind : "block",
    columns: desktop,
    tabletColumns: columns(tablet.columns, Math.min(desktop, 2)),
    mobileColumns: columns(mobile.columns, 1),
    gap: cssLength(saved.gap ?? config.gap),
    rowGap: cssLength(saved.rowGap ?? config.rowGap),
    columnGap: cssLength(saved.columnGap ?? config.columnGap),
    flexDirection: saved.flexDirection === "column" ? "column" : "row",
    justifyContent: [
      "start",
      "center",
      "end",
      "space-between",
      "space-around",
    ].includes(String(saved.justifyContent))
      ? (saved.justifyContent as LayoutValues["justifyContent"])
      : "start",
    alignItems: ["start", "center", "end", "stretch"].includes(
      String(saved.alignItems),
    )
      ? (saved.alignItems as LayoutValues["alignItems"])
      : "stretch",
  };
}

function previewLayout(
  values: LayoutValues,
  device: "desktop" | "tablet" | "mobile",
): CSSProperties {
  if (values.layout === "block") return {};
  const gap = values.gap;
  if (values.layout === "grid")
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${device === "mobile" ? values.mobileColumns : device === "tablet" ? values.tabletColumns : values.columns}, minmax(0, 1fr))`,
      gap,
      rowGap: values.rowGap,
      columnGap: values.columnGap,
      alignItems: values.alignItems,
    };
  return {
    display: "flex",
    flexDirection: device === "mobile" ? "column" : values.flexDirection,
    flexWrap: "wrap",
    gap,
    rowGap: values.rowGap,
    columnGap: values.columnGap,
    justifyContent: values.justifyContent,
    alignItems: values.alignItems,
  };
}

function LayoutEditor({
  value,
  onChange,
  onSave,
  busy,
  title,
}: {
  value: LayoutValues;
  onChange: (v: LayoutValues) => void;
  onSave: () => void;
  busy: boolean;
  title: string;
}) {
  const update = <K extends keyof LayoutValues>(
    key: K,
    next: LayoutValues[K],
  ) => onChange({ ...value, [key]: next });
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-slate-500">
        {title} — preview changes immediately; save to persist.
      </p>
      <label className="block text-xs font-semibold text-slate-600">
        Layout
        <select
          value={value.layout}
          onChange={(e) =>
            update("layout", e.target.value as LayoutValues["layout"])
          }
          className="mt-1 w-full rounded-lg border p-2"
        >
          <option value="block">Standard (block)</option>
          <option value="grid">Grid</option>
          <option value="flex">Flexbox</option>
        </select>
      </label>
      {value.layout === "grid" && (
        <div className="grid grid-cols-3 gap-2">
          {(["columns", "tabletColumns", "mobileColumns"] as const).map(
            (key) => (
              <label key={key} className="text-xs font-semibold text-slate-600">
                {key === "columns"
                  ? "Desktop"
                  : key === "tabletColumns"
                    ? "Tablet"
                    : "Mobile"}
                <select
                  value={value[key]}
                  onChange={(e) => update(key, Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border p-2"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
        </div>
      )}
      {value.layout === "flex" && (
        <label className="block text-xs font-semibold text-slate-600">
          Direction
          <select
            value={value.flexDirection}
            onChange={(e) =>
              update(
                "flexDirection",
                e.target.value as LayoutValues["flexDirection"],
              )
            }
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="row">Row</option>
            <option value="column">Column</option>
          </select>
        </label>
      )}
      {value.layout !== "block" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(["gap", "rowGap", "columnGap"] as const).map((key) => (
              <label
                key={key}
                className="min-w-0 text-xs font-semibold text-slate-600"
              >
                {key}
                <input
                  value={value[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder="16px"
                  className="mt-1 w-full rounded-lg border p-2"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Justify
              <select
                value={value.justifyContent}
                onChange={(e) =>
                  update(
                    "justifyContent",
                    e.target.value as LayoutValues["justifyContent"],
                  )
                }
                className="mt-1 w-full rounded-lg border p-2"
              >
                {[
                  "start",
                  "center",
                  "end",
                  "space-between",
                  "space-around",
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Align
              <select
                value={value.alignItems}
                onChange={(e) =>
                  update(
                    "alignItems",
                    e.target.value as LayoutValues["alignItems"],
                  )
                }
                className="mt-1 w-full rounded-lg border p-2"
              >
                {["start", "center", "end", "stretch"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Save size={15} /> Save layout
      </button>
    </div>
  );
}

type SortableHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};
function SortableCard({
  id,
  disabled,
  as = "div",
  className,
  children,
}: {
  id: string;
  disabled: boolean;
  as?: "section" | "div";
  className: string;
  children: (handle: SortableHandleProps) => ReactNode;
}) {
  const sortable = useSortable({ id, disabled });
  const Tag = as;
  return (
    <Tag
      ref={sortable.setNodeRef}
      className={className}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.55 : 1,
        position: "relative",
        zIndex: sortable.isDragging ? 10 : undefined,
      }}
    >
      {children({
        attributes: sortable.attributes,
        listeners: sortable.listeners,
      })}
    </Tag>
  );
}

/** A visible drop target works even when a destination section has no elements. */
function SectionElementDropZone({
  sectionId,
  disabled,
}: {
  sectionId: number;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop:section:${sectionId}`,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={`mt-3 rounded-xl border-2 border-dashed px-3 py-3 text-center text-xs font-medium transition-colors ${isOver ? "border-blue-500 bg-blue-100 text-blue-800" : "border-slate-200 bg-slate-50/60 text-slate-400"}`}
    >
      Drop an element here to move it into this section
    </div>
  );
}

/** Keep section sorting separate from element targets to avoid nested droppable collisions. */
const editorCollisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  const candidates = args.droppableContainers.filter((container) => {
    const id = String(container.id);
    return activeId.startsWith("section:")
      ? id.startsWith("section:")
      : id.startsWith("element:") || id.startsWith("drop:section:");
  });
  const narrowed = { ...args, droppableContainers: candidates };
  const pointer = pointerWithin(narrowed);
  if (pointer.length) return pointer;
  const intersection = rectIntersection(narrowed);
  return intersection.length ? intersection : closestCenter(narrowed);
};

export default function WebsiteBuilderEditorPage() {
  const params = useParams<{ id: string }>();
  const pageId = Number(params.id);
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
const [templates, setTemplates] = useState<SectionTemplate[]>([]);
const [templateName, setTemplateName] = useState("");
const [templateDescription, setTemplateDescription] = useState("");
const [showReusableSections, setShowReusableSections] = useState(true);
  const [sectionType, setSectionType] =
    useState<(typeof SECTION_TYPES)[number]>("hero");
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null,
  );
  const [elementType, setElementType] =
    useState<(typeof ELEMENT_TYPES)[number]>("heading");
  const [elementValue, setElementValue] = useState("");
  const [editingElementId, setEditingElementId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [buttonNewTab, setButtonNewTab] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoImage, setSeoImage] = useState("");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<number | null>(
    null,
  );
  const [sectionStyleEdits, setSectionStyleEdits] = useState<StyleValues>({});
  const [elementStyleEdits, setElementStyleEdits] = useState<StyleValues>({});
  const [styleDevice, setStyleDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [responsiveStyleEdits, setResponsiveStyleEdits] = useState<StyleValues>(
    {},
  );
  const [sectionLayoutEdits, setSectionLayoutEdits] = useState<LayoutValues>(
    layoutValues(null),
  );
  const [elementLayoutEdits, setElementLayoutEdits] = useState<LayoutValues>(
    layoutValues(null),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(pageId) || pageId <= 0) {
      setError("Invalid page ID");
      setLoading(false);
      return;
    }
    try {
      const result = await api<CmsPage>(
        `/api/admin/website-builder/pages/${pageId}`,
      );
      setPage(result);
      setSeoTitle(result.seoTitle ?? "");
      setSeoDescription(result.seoDescription ?? "");
      setSeoImage(result.seoImage ?? "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load page");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const draft = useMemo(
    () => page?.versions.find((v) => v.status === "DRAFT") ?? null,
    [page],
  );
  const sections = useMemo(
    () =>
      [...(draft?.sections ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
      ),
    [draft],
  );
  const selected = sections.find((s) => s.id === selectedSectionId) ?? null;
  const selectedElement =
    selected?.elements.find((element) => element.id === selectedElementId) ??
    null;
  const selectSection = (section: Section) => {
    setSelectedSectionId(section.id);
    setSectionName(section.name ?? "");
    setSectionStyleEdits(styleValues(section.styles));
    setSectionLayoutEdits(
      layoutValues(section.settings, undefined, section.styles),
    );
    setSelectedElementId(null);
    setElementStyleEdits({});
    setResponsiveStyleEdits({});
    setStyleDevice("desktop");
  };
  const selectElement = (section: Section, element: Element) => {
    selectSection(section);
    setSelectedElementId(element.id);
    setElementStyleEdits(styleValues(element.styles));
    setResponsiveStyleEdits(styleValues(record(element.responsive).desktop));
    setStyleDevice("desktop");
    setElementLayoutEdits(
      layoutValues(undefined, element.responsive, element.styles),
    );
    if (element.type === "button") {
      const action = record(element.action);
      const content = record(element.content);

      setButtonUrl(
        typeof action.href === "string"
          ? action.href
          : typeof content.href === "string"
            ? content.href
            : "",
      );

      setButtonNewTab(action.target === "_blank");
    } else {
      setButtonUrl("");
      setButtonNewTab(false);
    }
  };
  const changeStyleDevice = (device: "desktop" | "tablet" | "mobile") => {
    if (!selectedElement) return;
    setStyleDevice(device);
    setPreviewDevice(device);
    setShowPreview(true);
    setResponsiveStyleEdits(
      device === "desktop"
        ? styleValues(selectedElement.styles)
        : styleValues(record(selectedElement.responsive)[device]),
    );
  };

  const liveUrl = page?.slug === "home" ? "/" : `/${page?.slug ?? ""}`;

  async function mutate(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await load();
      toast.success(success);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveSeoSettings() {
    if (seoTitle.length > 160) {
      toast.error("SEO title cannot exceed 160 characters");
      return;
    }

    if (seoDescription.length > 320) {
      toast.error("SEO description cannot exceed 320 characters");
      return;
    }

    if (seoImage.length > 2048) {
      toast.error("SEO image URL cannot exceed 2048 characters");
      return;
    }

    if (seoImage && !/^(https:\/\/|\/(?!\/))/.test(seoImage)) {
      toast.error(
        "Use an HTTPS image URL or a root-relative path starting with /",
      );
      return;
    }

    await mutate(
      () =>
        api(`/api/admin/website-builder/pages/${pageId}`, {
          method: "PATCH",
          body: JSON.stringify({
            seoTitle,
            seoDescription,
            seoImage,
          }),
        }),
      "SEO settings saved successfully",
    );
  }

  // Native HTML drag-and-drop; changes are persisted to the existing PATCH APIs.
  // Rewrites the complete sibling order to avoid duplicate sortOrder ties.
  async function reorder(
    kind: "section" | "element",
    sourceId: number,
    targetId: number,
    sectionId?: number,
  ) {
    if (busy || sourceId === targetId) return;
    const siblings =
      kind === "section"
        ? sections
        : [
            ...(sections.find((item) => item.id === sectionId)?.elements ?? []),
          ].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const from = siblings.findIndex((item) => item.id === sourceId);
    const to = siblings.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const ordered = [...siblings];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    const base = `/api/admin/website-builder/${kind === "section" ? "sections" : "elements"}`;
    await mutate(
      async () => {
        // Update all siblings sequentially, then reload once via mutate().
        for (let index = 0; index < ordered.length; index++) {
          await api(`${base}/${ordered[index].id}`, {
            method: "PATCH",
            body: JSON.stringify({ sortOrder: index * 10 }),
          });
        }
      },
      kind === "section" ? "Section order saved" : "Element order saved",
    );
  }

  /** Move a leaf element across sections, then normalize destination ordering. */
  async function moveElementToSection(
    sourceId: number,
    destinationSectionId: number,
    beforeId?: number,
  ) {
    if (busy) return;
    const origin = sections.find((section) =>
      section.elements.some((element) => element.id === sourceId),
    );
    const destination = sections.find(
      (section) => section.id === destinationSectionId,
    );
    if (!origin || !destination || origin.id === destination.id) return;
    const moving = origin.elements.find((element) => element.id === sourceId);
    if (!moving) return;
    // The Step 26 API enforces draft-version and leaf-only moves server-side.
    const destinationElements = [...destination.elements].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    );
    const insertionIndex =
      beforeId === undefined
        ? destinationElements.length
        : destinationElements.findIndex((element) => element.id === beforeId);
    const index =
      insertionIndex < 0 ? destinationElements.length : insertionIndex;
    const orderedIds = destinationElements.map((element) => element.id);
    orderedIds.splice(index, 0, sourceId);
    await mutate(async () => {
      await api(`/api/admin/website-builder/elements/${sourceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          sectionId: destinationSectionId,
          sortOrder: index * 10,
        }),
      });
      // Persist a deterministic order. A failed request is reported and reloaded.
      for (let position = 0; position < orderedIds.length; position++) {
        await api(
          `/api/admin/website-builder/elements/${orderedIds[position]}`,
          {
            method: "PATCH",
            body: JSON.stringify({ sortOrder: position * 10 }),
          },
        );
      }
    }, "Element moved to another section");
    setSelectedElementId(null);
    setEditingElementId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || busy || active.id === over.id) return;
    const source = String(active.id);
    const target = String(over.id);
    if (source.startsWith("section:") && target.startsWith("section:")) {
      void reorder("section", Number(source.slice(8)), Number(target.slice(8)));
      return;
    }
    if (!source.startsWith("element:")) return;
    const sourceId = Number(source.slice(8));
    const origin = sections.find((section) =>
      section.elements.some((element) => element.id === sourceId),
    );
    if (!origin) return;
    if (target.startsWith("drop:section:")) {
      const destinationId = Number(target.slice("drop:section:".length));
      if (Number.isSafeInteger(destinationId))
        void moveElementToSection(sourceId, destinationId);
      return;
    }
    if (target.startsWith("element:")) {
      const targetId = Number(target.slice(8));
      const destination = sections.find((section) =>
        section.elements.some((element) => element.id === targetId),
      );
      if (!destination) return;
      if (origin.id === destination.id)
        void reorder("element", sourceId, targetId, origin.id);
      else void moveElementToSection(sourceId, destination.id, targetId);
    }
  }

  async function createDraft() {
    await mutate(
      () =>
        api(`/api/admin/website-builder/pages/${pageId}/versions`, {
          method: "POST",
        }),
      "Draft created",
    );
  }

  async function addSection() {
    await mutate(
      () =>
        api(`/api/admin/website-builder/pages/${pageId}/sections`, {
          method: "POST",
          body: JSON.stringify({ type: sectionType }),
        }),
      "Section added",
    );
  }

  
const loadTemplates = useCallback(async () => {
  try {
    const result = await api<SectionTemplate[]>(
      "/api/admin/website-builder/templates",
    );
    setTemplates(result);
  } catch (cause) {
    toast.error(
      cause instanceof Error
        ? cause.message
        : "Unable to load reusable sections",
    );
  }
}, []);

useEffect(() => {
  void loadTemplates();
}, [loadTemplates]);

async function saveSelectedSectionAsTemplate() {
  if (!selected) {
    toast.error("Select a section before saving it as a template");
    return;
  }

  const name = templateName.trim();

  if (!name) {
    toast.error("Please enter a template name");
    return;
  }

  if (busy) return;

  setBusy(true);

  try {
    await api("/api/admin/website-builder/templates", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: templateDescription.trim() || null,
        sectionId: selected.id,
      }),
    });

    setTemplateName("");
    setTemplateDescription("");

    await loadTemplates();
    toast.success("Reusable section saved successfully");
  } catch (cause) {
    toast.error(
      cause instanceof Error ? cause.message : "Unable to save template",
    );
  } finally {
    setBusy(false);
  }
}

async function insertTemplate(templateId: number) {
  if (busy) return;

  setBusy(true);

  try {
    await api(
      `/api/admin/website-builder/pages/${pageId}/sections/from-template`,
      {
        method: "POST",
        body: JSON.stringify({ templateId }),
      },
    );

    await load();
    toast.success("Reusable section added to this draft");
  } catch (cause) {
    toast.error(
      cause instanceof Error ? cause.message : "Unable to insert template",
    );
  } finally {
    setBusy(false);
  }
}

async function deleteTemplate(template: SectionTemplate) {
  if (busy) return;

  if (
    !window.confirm(
      `Delete the reusable template "${template.name}"? Existing sections created from it will not be deleted.`,
    )
  ) {
    return;
  }

  setBusy(true);

  try {
    await api(`/api/admin/website-builder/templates/${template.id}`, {
      method: "DELETE",
    });

    await loadTemplates();
    toast.success("Reusable template deleted");
  } catch (cause) {
    toast.error(
      cause instanceof Error ? cause.message : "Unable to delete template",
    );
  } finally {
    setBusy(false);
  }
}


  async function patchSection(
    id: number,
    changes: Record<string, unknown>,
    success: string,
  ) {
    await mutate(
      () =>
        api(`/api/admin/website-builder/sections/${id}`, {
          method: "PATCH",
          body: JSON.stringify(changes),
        }),
      success,
    );
  }

  async function removeSection(id: number) {
    if (
      !window.confirm(
        "Delete this section and all of its elements from the draft?",
      )
    )
      return;
    await mutate(
      () =>
        api(`/api/admin/website-builder/sections/${id}`, { method: "DELETE" }),
      "Section removed",
    );
    if (selectedSectionId === id) setSelectedSectionId(null);
  }

  async function addElement() {
    if (!selected) return;
    const value = elementValue.trim();
    const content =
      elementType === "image"
        ? { src: value, alt: "" }
        : { text: value || (elementType === "heading" ? "New heading" : "") };
    await mutate(
      () =>
        api(`/api/admin/website-builder/sections/${selected.id}/elements`, {
          method: "POST",
          body: JSON.stringify({
            type: elementType,
            key: `el_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
            content,
          }),
        }),
      "Element added",
    );
    setElementValue("");
  }

  async function patchElement(
    element: Element,
    changes: Record<string, unknown>,
    success: string,
  ) {
    await mutate(
      () =>
        api(`/api/admin/website-builder/elements/${element.id}`, {
          method: "PATCH",
          body: JSON.stringify(changes),
        }),
      success,
    );
  }

  async function removeElement(element: Element) {
    if (!window.confirm("Delete this element from the draft?")) return;
    await mutate(
      () =>
        api(`/api/admin/website-builder/elements/${element.id}`, {
          method: "DELETE",
        }),
      "Element deleted",
    );
  }

  async function rollbackToVersion(version: number) {
    if (!page || busy || page.publishedVersion === version) return;
    if (
      !window.confirm(
        `Restore published version v${version} as the live website?\n\nThis changes the live page immediately. Your current draft, if any, will remain unchanged.`,
      )
    )
      return;

    await mutate(
      () =>
        api(`/api/admin/website-builder/pages/${pageId}/rollback`, {
          method: "POST",
          body: JSON.stringify({ version }),
        }),
      `Version v${version} is now live`,
    );
  }

  async function publish() {
    if (!window.confirm("Publish this draft to the live website?")) return;
    await mutate(
      () =>
        api(`/api/admin/website-builder/pages/${pageId}/publish`, {
          method: "POST",
        }),
      "Page published",
    );
  }

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin" /> Loading editor...
      </div>
    );
  if (error)
    return (
      <main className="mx-auto max-w-4xl p-8">
        <Link href="/admin/website-builder" className="text-sm text-blue-600">
          ← Back to pages
        </Link>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
        <button
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="mt-4 cursor-pointer rounded-xl border px-4 py-2"
        >
          Retry
        </button>
      </main>
    );
  if (!page) return null;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/website-builder"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={15} /> All pages
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {page.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            /{page.slug === "home" ? "" : page.slug} ·{" "}
            {draft ? `Editing draft v${draft.version}` : "No active draft"} ·{" "}
            {page.publishedVersion
              ? `Live v${page.publishedVersion}`
              : "Not published"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          {page.publishedVersion != null && (
            <Link
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              <ExternalLink size={16} /> Live page
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowVersionHistory((current) => !current)}
            aria-expanded={showVersionHistory}
            aria-controls="website-builder-version-history"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${showVersionHistory ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
          >
            <History size={16} /> Version history
          </button>
          {draft && (
            <button
              onClick={() => void publish()}
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} /> Publish draft
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">SEO Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customize how this page appears in search results and social
            previews. These settings apply to the page metadata, not the page
            content.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="seo-title"
                className="text-sm font-semibold text-slate-700"
              >
                SEO Title
              </label>
              <span className="text-xs text-slate-500">
                {seoTitle.length}/160
              </span>
            </div>
            <input
              id="seo-title"
              type="text"
              value={seoTitle}
              maxLength={160}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder={page.title}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use the page title.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="seo-description"
                className="text-sm font-semibold text-slate-700"
              >
                SEO Description
              </label>
              <span className="text-xs text-slate-500">
                {seoDescription.length}/320
              </span>
            </div>
            <textarea
              id="seo-description"
              value={seoDescription}
              maxLength={320}
              rows={3}
              onChange={(event) => setSeoDescription(event.target.value)}
              placeholder={
                page.description || "Describe this page for search engines..."
              }
              className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use the page description, if available.
            </p>
          </div>

          <div>
            <label
              htmlFor="seo-image"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              SEO / Social Sharing Image URL
            </label>
            <input
              id="seo-image"
              type="text"
              value={seoImage}
              maxLength={2048}
              onChange={(event) => setSeoImage(event.target.value)}
              placeholder="https://example.com/social-preview.jpg"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use an HTTPS URL or a root-relative path such as
              /images/og-image.jpg. Leave blank if no custom image is needed.
            </p>

            {seoImage && (
              <p className="mt-2 break-all text-xs text-slate-600">
                Current image: {seoImage}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => void saveSeoSettings()}
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {busy ? "Saving..." : "Save SEO Settings"}
            </button>
          </div>
        </div>
      </section>

      {showVersionHistory && (
        <section
          id="website-builder-version-history"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <History size={19} /> Version history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Restoring a previously published version changes the live
                website immediately. Existing drafts are not modified.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {page.versions.length} version
              {page.versions.length === 1 ? "" : "s"}
            </span>
          </div>
          {page.versions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              No versions available yet.
            </p>
          ) : (
            <div className="space-y-2">
              {[...page.versions]
                .sort((a, b) => b.version - a.version)
                .map((version) => {
                  const isLive = page.publishedVersion === version.version;
                  const isDraft = version.status === "DRAFT";
                  const canRollback =
                    !isLive &&
                    !isDraft &&
                    version.publishedAt !== null &&
                    page.status !== "ARCHIVED" &&
                    page.publishedVersion !== null;
                  return (
                    <div
                      key={version.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 sm:p-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Version {version.version}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isLive ? "bg-green-100 text-green-700" : isDraft ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {isLive ? "Live" : isDraft ? "Draft" : "Archived"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {version.publishedAt
                            ? `Published ${new Date(version.publishedAt).toLocaleString()}`
                            : isDraft
                              ? "Unpublished draft"
                              : "Previous version"}
                        </p>
                      </div>
                      {canRollback && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void rollbackToVersion(version.version)
                          }
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={15} /> Roll back to v
                          {version.version}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {!draft ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FilePlus2 className="mx-auto text-blue-600" size={36} />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Start a draft
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Create an editable draft. If this page is published, the new draft
            starts from the latest version; your live page stays unchanged until
            you publish.
          </p>
          <button
            disabled={busy || page.status === "ARCHIVED"}
            onClick={() => void createDraft()}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={18} /> Create draft
          </button>
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="font-bold text-slate-900">Draft preview</h2>
                  <p className="text-xs text-slate-500">
                    Only visible draft content is shown. Click a section to edit
                    it.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {(["desktop", "tablet", "mobile"] as const).map((device) => {
                    const Icon =
                      device === "desktop"
                        ? Monitor
                        : device === "tablet"
                          ? Tablet
                          : Smartphone;
                    return (
                      <button
                        key={device}
                        type="button"
                        title={`${device} preview`}
                        aria-label={`${device} preview`}
                        aria-pressed={previewDevice === device}
                        onClick={() => {
                          setPreviewDevice(device);
                          if (selectedElement) {
                            setStyleDevice(device);
                            setResponsiveStyleEdits(
                              device === "desktop"
                                ? styleValues(selectedElement.styles)
                                : styleValues(
                                    record(selectedElement.responsive)[device],
                                  ),
                            );
                          }
                          setShowPreview(true);
                        }}
                        className={`cursor-pointer rounded-lg p-2 ${previewDevice === device ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowPreview((current) => !current)}
                    className="ml-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                  >
                    {showPreview ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {showPreview && (
                <div className="overflow-x-auto bg-slate-100 p-3 sm:p-5">
                  <div
                    className="mx-auto min-h-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[width] duration-200"
                    style={{
                      width:
                        previewDevice === "desktop"
                          ? "100%"
                          : previewDevice === "tablet"
                            ? "768px"
                            : "390px",
                    }}
                  >
                    {sections.filter((section) => section.visible).length ===
                    0 ? (
                      <p className="p-10 text-center text-sm text-slate-500">
                        No visible sections in this draft.
                      </p>
                    ) : (
                      sections
                        .filter((section) => section.visible)
                        .map((section) => (
                          <button
                            type="button"
                            key={section.id}
                            onClick={() => {
                              selectSection(section);
                            }}
                            style={cssStyle(
                              section.styles,
                              selectedSectionId === section.id
                                ? sectionStyleEdits
                                : undefined,
                            )}
                            className={`block w-full cursor-pointer border-b border-slate-100 px-5 py-8 text-left last:border-b-0 hover:bg-blue-50/50 ${selectedSectionId === section.id ? "ring-2 ring-inset ring-blue-400" : ""}`}
                          >
                            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                              {section.name || section.type}
                            </span>
                            <div
                              className="space-y-3"
                              style={previewLayout(
                                selectedSectionId === section.id
                                  ? sectionLayoutEdits
                                  : layoutValues(
                                      section.settings,
                                      undefined,
                                      section.styles,
                                    ),
                                previewDevice,
                              )}
                            >
                              {[...section.elements]
                                .filter((element) => element.visible)
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((element) => (
                                  <DraftElementPreview
                                    key={element.id}
                                    element={element}
                                    styleOverride={
                                      selectedElementId === element.id
                                        ? elementStyleEdits
                                        : undefined
                                    }
                                    layoutOverride={
                                      selectedElementId === element.id
                                        ? elementLayoutEdits
                                        : undefined
                                    }
                                    device={previewDevice}
                                    responsiveOverride={
                                      selectedElementId === element.id &&
                                      styleDevice === previewDevice &&
                                      styleDevice !== "desktop"
                                        ? responsiveStyleEdits
                                        : undefined
                                    }
                                  />
                                ))}
                              {!section.elements.some(
                                (element) => element.visible,
                              ) && (
                                <p className="text-sm italic text-slate-400">
                                  Empty section
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                Editor preview only — your published website remains unchanged
                until publishing.
              </p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Add a section
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Drag sections or elements by their grip icons on desktop or
                touch devices to reorder. Changes save automatically.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <select
                  value={sectionType}
                  onChange={(event) =>
                    setSectionType(event.target.value as typeof sectionType)
                  }
                  className="min-w-44 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy}
                  onClick={() => void addSection()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={17} /> Add section
                </button>
              </div>
              
<div className="mt-5 border-t border-slate-200 pt-5">
  <button
    type="button"
    onClick={() =>
      setShowReusableSections((current) => !current)
    }
    aria-expanded={showReusableSections}
    className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
  >
    <div>
      <h3 className="font-bold text-slate-900">
        Reusable sections
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Save sections once and reuse them across pages.
      </p>
    </div>

    <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold">
      {showReusableSections ? "Hide" : "Show"}
    </span>
  </button>

  {showReusableSections && (
    <div className="mt-4 space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="font-semibold text-slate-800">
          Save selected section
        </h4>

        <p className="mt-1 text-xs text-slate-500">
          Select a section in the editor first. Its content,
          settings, styles and elements will be saved.
        </p>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Template name
          <input
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            maxLength={100}
            placeholder="e.g. Homepage hero"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            value={templateDescription}
            onChange={(event) =>
              setTemplateDescription(event.target.value)
            }
            maxLength={500}
            rows={2}
            placeholder="Describe this reusable section"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          disabled={busy || !draft || !selected}
          onClick={() => void saveSelectedSectionAsTemplate()}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={15} />
          Save as template
        </button>

        {!selected && (
          <p className="mt-2 text-xs text-amber-700">
            Select a section from the preview or section list.
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="font-semibold text-slate-800">
            Saved templates
          </h4>

          <button
            type="button"
            disabled={busy}
            onClick={() => void loadTemplates()}
            className="cursor-pointer text-xs font-semibold text-blue-600 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {templates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            No reusable sections yet. Save a section to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-slate-900">
                    {template.name}
                  </p>

                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {template.type}
                  </p>

                  {template.description && (
                    <p className="mt-1 break-words text-xs text-slate-500">
                      {template.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || !draft}
                    onClick={() => void insertTemplate(template.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Insert
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    title="Delete reusable template"
                    aria-label={`Delete template ${template.name}`}
                    onClick={() => void deleteTemplate(template)}
                    className="cursor-pointer rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</div>

            </section>

            <DndContext
              sensors={sensors}
              collisionDetection={editorCollisionDetection}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((section) => `section:${section.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {sections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                    Your draft is empty. Add a section to get started.
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <SortableCard
                      key={section.id}
                      id={`section:${section.id}`}
                      disabled={busy}
                      as="section"
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${selectedSectionId === section.id ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
                    >
                      {(sectionHandle) => (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <button
                              onClick={() => {
                                selectSection(section);
                              }}
                              className="cursor-pointer text-left"
                            >
                              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                                {section.type} · Section {index + 1}
                              </p>
                              <h3 className="mt-1 font-bold text-slate-900">
                                {section.name || section.type}
                              </h3>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                {...sectionHandle.attributes}
                                {...sectionHandle.listeners}
                                disabled={busy}
                                title="Drag section to reorder"
                                aria-label="Drag section to reorder"
                                className="cursor-grab touch-none rounded-lg p-2 text-slate-400 active:cursor-grabbing"
                              >
                                <GripVertical size={17} />
                              </button>
                              <button
                                title="Move up"
                                aria-label="Move section up"
                                disabled={busy || index === 0}
                                onClick={() =>
                                  void patchSection(
                                    section.id,
                                    {
                                      sortOrder:
                                        sections[index - 1].sortOrder ===
                                        section.sortOrder
                                          ? Math.max(0, section.sortOrder - 1)
                                          : sections[index - 1].sortOrder,
                                    },
                                    "Section order updated",
                                  )
                                }
                                className="cursor-pointer rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                title="Move down"
                                aria-label="Move section down"
                                disabled={busy || index === sections.length - 1}
                                onClick={() =>
                                  void patchSection(
                                    section.id,
                                    {
                                      sortOrder:
                                        sections[index + 1].sortOrder + 1,
                                    },
                                    "Section order updated",
                                  )
                                }
                                className="cursor-pointer rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button
                                title={section.visible ? "Hide" : "Show"}
                                aria-label={
                                  section.visible
                                    ? "Hide section"
                                    : "Show section"
                                }
                                disabled={busy}
                                onClick={() =>
                                  void patchSection(
                                    section.id,
                                    { visible: !section.visible },
                                    "Visibility updated",
                                  )
                                }
                                className="cursor-pointer rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"
                              >
                                {section.visible ? (
                                  <Eye size={16} />
                                ) : (
                                  <EyeOff size={16} />
                                )}
                              </button>
                              <button
                                title="Delete section"
                                aria-label="Delete section"
                                disabled={busy}
                                onClick={() => void removeSection(section.id)}
                                className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <SortableContext
                            items={[...section.elements]
                              .sort(
                                (a, b) =>
                                  a.sortOrder - b.sortOrder || a.id - b.id,
                              )
                              .map((element) => `element:${element.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="mt-4 space-y-2">
                              {[...section.elements]
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((element) => (
                                  <SortableCard
                                    key={element.id}
                                    id={`element:${element.id}`}
                                    disabled={busy}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                  >
                                    {(elementHandle) => (
                                      <>
                                        <div className="flex items-start justify-between gap-2">
                                          <button
                                            type="button"
                                            {...elementHandle.attributes}
                                            {...elementHandle.listeners}
                                            disabled={busy}
                                            title="Drag element to reorder"
                                            aria-label="Drag element to reorder"
                                            className="cursor-grab touch-none p-1 text-slate-400 active:cursor-grabbing"
                                          >
                                            <GripVertical size={16} />
                                          </button>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold uppercase text-slate-400">
                                              {element.type}
                                              {!element.visible
                                                ? " · Hidden"
                                                : ""}
                                            </p>
                                            <p className="mt-1 break-words text-sm text-slate-700">
                                              {elementText(element) ||
                                                "No text content"}
                                            </p>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              disabled={busy}
                                              onClick={() => {
                                                selectElement(section, element);
                                                setEditingElementId(element.id);
                                                setEditValue(
                                                  elementText(element),
                                                );
                                              }}
                                              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              disabled={busy}
                                              title="Toggle element visibility"
                                              onClick={() =>
                                                void patchElement(
                                                  element,
                                                  { visible: !element.visible },
                                                  "Visibility updated",
                                                )
                                              }
                                              className="cursor-pointer rounded-lg p-1 hover:bg-white"
                                            >
                                              {element.visible ? (
                                                <Eye size={15} />
                                              ) : (
                                                <EyeOff size={15} />
                                              )}
                                            </button>
                                            <button
                                              disabled={busy}
                                              title="Delete element"
                                              onClick={() =>
                                                void removeElement(element)
                                              }
                                              className="cursor-pointer rounded-lg p-1 text-red-500 hover:bg-red-50"
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>
                                        </div>

                                        {editingElementId === element.id && (
                                          <div className="mt-3 flex flex-col gap-2">
                                            <textarea
                                              rows={3}
                                              value={editValue}
                                              onChange={(e) =>
                                                setEditValue(e.target.value)
                                              }
                                              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                                            />
                                            <div className="flex gap-2">
                                              <button
                                                disabled={busy}
                                                onClick={async () => {
                                                  const existing =
                                                    element.content &&
                                                    typeof element.content ===
                                                      "object" &&
                                                    !Array.isArray(
                                                      element.content,
                                                    )
                                                      ? (element.content as Record<
                                                          string,
                                                          unknown
                                                        >)
                                                      : {};
                                                  await patchElement(
                                                    element,
                                                    {
                                                      content: {
                                                        ...existing,
                                                        [element.type ===
                                                        "image"
                                                          ? "src"
                                                          : "text"]: editValue,
                                                      },
                                                    },
                                                    "Element saved",
                                                  );
                                                  setEditingElementId(null);
                                                }}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                                              >
                                                <Save size={13} /> Save
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setEditingElementId(null)
                                                }
                                                className="cursor-pointer rounded-lg border px-3 py-2 text-xs"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </SortableCard>
                                ))}
                              {section.elements.length === 0 && (
                                <p className="text-sm italic text-slate-400">
                                  No elements yet. Select this section to add
                                  content.
                                </p>
                              )}
                            </div>
                          </SortableContext>
                          <SectionElementDropZone
                            sectionId={section.id}
                            disabled={busy}
                          />
                        </>
                      )}
                    </SortableCard>
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Section settings
              </h2>
              {selected ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-500">
                    Section name
                  </label>
                  <input
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                  <button
                    disabled={busy || !sectionName.trim()}
                    onClick={() =>
                      void patchSection(
                        selected.id,
                        { name: sectionName.trim() },
                        "Section renamed",
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    <Save size={15} /> Save name
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a section to edit its settings.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Section styling
              </h2>
              {selected ? (
                <StyleEditor
                  values={sectionStyleEdits}
                  onChange={setSectionStyleEdits}
                  busy={busy}
                  onSave={() =>
                    void patchSection(
                      selected.id,
                      {
                        styles: {
                          ...(selected.styles &&
                          typeof selected.styles === "object" &&
                          !Array.isArray(selected.styles)
                            ? selected.styles
                            : {}),
                          ...sectionStyleEdits,
                        },
                      },
                      "Section styles saved",
                    )
                  }
                />
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a section to style it.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Section layout
              </h2>
              {selected ? (
                <LayoutEditor
                  title="Section layout"
                  value={sectionLayoutEdits}
                  onChange={setSectionLayoutEdits}
                  busy={busy}
                  onSave={() =>
                    void patchSection(
                      selected.id,
                      {
                        settings: {
                          ...record(selected.settings),
                          layout: sectionLayoutEdits.layout,
                          columns: sectionLayoutEdits.columns,

                          responsive: {
                            ...record(record(selected.settings).responsive),

                            tablet: {
                              ...record(
                                record(record(selected.settings).responsive)
                                  .tablet,
                              ),
                              columns: sectionLayoutEdits.tabletColumns,
                            },

                            mobile: {
                              ...record(
                                record(record(selected.settings).responsive)
                                  .mobile,
                              ),
                              columns: sectionLayoutEdits.mobileColumns,
                            },
                          },
                        },
                        styles: {
                          ...record(selected.styles),
                          gap: sectionLayoutEdits.gap,
                          rowGap: sectionLayoutEdits.rowGap,
                          columnGap: sectionLayoutEdits.columnGap,
                          flexDirection: sectionLayoutEdits.flexDirection,
                          justifyContent: sectionLayoutEdits.justifyContent,
                          alignItems: sectionLayoutEdits.alignItems,
                        },
                      },
                      "Section layout saved",
                    )
                  }
                />
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a section first.
                </p>
              )}
              <p className="mt-2 text-xs text-amber-700">
                Section responsive columns are preview-only until
                SectionRenderer supports device-specific settings.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Element styling
              </h2>
              {selectedElement ? (
                <>
                  <p className="mt-2 text-xs text-slate-500">
                    Editing {selectedElement.type} #{selectedElement.id}
                  </p>
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Style breakpoint"
                  >
                    {(["desktop", "tablet", "mobile"] as const).map(
                      (device) => (
                        <button
                          key={device}
                          type="button"
                          onClick={() => changeStyleDevice(device)}
                          aria-pressed={styleDevice === device}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold ${styleDevice === device ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                        >
                          {device.charAt(0).toUpperCase() + device.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {styleDevice === "desktop"
                      ? "Base styles apply to all devices unless overridden."
                      : `Override styles for ${styleDevice}. Leave a field blank to inherit desktop.`}
                  </p>
                  <StyleEditor
                    saveLabel={`Save ${styleDevice} element styles`}
                    values={
                      styleDevice === "desktop"
                        ? elementStyleEdits
                        : responsiveStyleEdits
                    }
                    onChange={
                      styleDevice === "desktop"
                        ? setElementStyleEdits
                        : setResponsiveStyleEdits
                    }
                    busy={busy}
                    onSave={() => {
                      const changes: Record<string, unknown> =
                        styleDevice === "desktop"
                          ? {
                              styles: {
                                ...record(selectedElement.styles),
                                ...elementStyleEdits,
                              },
                            }
                          : {
                              responsive: {
                                ...record(selectedElement.responsive),
                                [styleDevice]: {
                                  ...record(
                                    record(selectedElement.responsive)[
                                      styleDevice
                                    ],
                                  ),
                                  ...responsiveStyleEdits,
                                },
                              },
                            };
                      console.info("Website Builder element style save", {
                        device: styleDevice,
                        elementId: selectedElement.id,
                        payload: changes,
                      });
                      void patchElement(
                        selectedElement,
                        changes,
                        `${styleDevice} element styles saved`,
                      );
                    }}
                  />
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Click Edit on an element to style it.
                </p>
              )}
            </div>
            {/* Button Action Settings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <ExternalLink size={18} className="text-blue-600" />
                Button Action
              </h2>

              {selectedElement?.type === "button" ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-500">
                    Configure where this button should navigate when clicked.
                  </p>

                  <label className="block text-xs font-semibold text-slate-600">
                    Action URL
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="/contact or https://example.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={buttonNewTab}
                      onChange={(e) => setButtonNewTab(e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                    />
                    Open in new tab
                  </label>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const url = buttonUrl.trim();

                      if (
                        url &&
                        !(
                          (url.startsWith("/") && !url.startsWith("//")) ||
                          url.startsWith("#") ||
                          /^https?:\/\//i.test(url)
                        )
                      ) {
                        toast.error(
                          "Enter a valid URL starting with /, #, http:// or https://",
                        );
                        return;
                      }

                      void patchElement(
                        selectedElement,
                        {
                          action: {
                            ...record(selectedElement.action),
                            href: url,
                            target: buttonNewTab ? "_blank" : "_self",
                          },
                        },
                        "Button action saved",
                      );
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={15} />
                    Save Button Action
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a Button element to configure its action.
                </p>
              )}
            </div>
            {/* Image Settings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Image Settings
              </h2>

              {selectedElement?.type === "image" ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-500">
                    Manage the image source and alternative text for
                    accessibility and SEO.
                  </p>

                  <label className="block text-xs font-semibold text-slate-600">
                    Image URL
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="/uploads/image.jpg or https://example.com/image.jpg"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-slate-600">
                    Alt Text
                    <textarea
                      rows={3}
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Describe the image for screen readers"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    />
                  </label>

                  <p className="text-xs text-slate-500">
                    Example: A modern office workspace with laptops and
                    monitors. For purely decorative images, leave Alt Text
                    empty.
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const url = imageUrl.trim();

                      if (
                        !url ||
                        !(
                          (url.startsWith("/") && !url.startsWith("//")) ||
                          /^https?:\/\//i.test(url)
                        )
                      ) {
                        toast.error(
                          "Enter a valid image URL starting with /, http:// or https://",
                        );
                        return;
                      }

                      void patchElement(
                        selectedElement,
                        {
                          content: {
                            ...record(selectedElement.content),
                            src: url,
                            alt: imageAlt.trim(),
                          },
                        },
                        "Image settings saved",
                      );
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={15} />
                    Save Image Settings
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select an Image element to edit its settings.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Element layout
              </h2>
              {selectedElement &&
              ["container", "group", "row", "column"].includes(
                selectedElement.type,
              ) ? (
                <LayoutEditor
                  title="Container / group layout"
                  value={elementLayoutEdits}
                  onChange={setElementLayoutEdits}
                  busy={busy}
                  onSave={() =>
                    void patchElement(
                      selectedElement,
                      {
                        styles: {
                          ...record(selectedElement.styles),
                          layout: elementLayoutEdits.layout,
                          columns: elementLayoutEdits.columns,
                          gap: elementLayoutEdits.gap,
                          rowGap: elementLayoutEdits.rowGap,
                          columnGap: elementLayoutEdits.columnGap,
                          flexDirection: elementLayoutEdits.flexDirection,
                          justifyContent: elementLayoutEdits.justifyContent,
                          alignItems: elementLayoutEdits.alignItems,
                        },
                        responsive: {
                          ...record(selectedElement.responsive),
                          tablet: {
                            ...record(
                              record(selectedElement.responsive).tablet,
                            ),
                            columns: elementLayoutEdits.tabletColumns,
                          },
                          mobile: {
                            ...record(
                              record(selectedElement.responsive).mobile,
                            ),
                            columns: elementLayoutEdits.mobileColumns,
                          },
                        },
                      },
                      "Element layout saved",
                    )
                  }
                />
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a container, group, row, or column element to edit its
                  layout.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Add an element
              </h2>
              {selected ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-500">
                    Adding to: <strong>{selected.name || selected.type}</strong>
                  </p>
                  <select
                    value={elementType}
                    onChange={(e) =>
                      setElementType(e.target.value as typeof elementType)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {ELEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={elementValue}
                    onChange={(e) => setElementValue(e.target.value)}
                    rows={3}
                    placeholder={
                      elementType === "image"
                        ? "Image URL or /uploads/..."
                        : "Text or button label"
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                  />
                  <button
                    disabled={busy}
                    onClick={() => void addElement()}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Plus size={16} /> Add element
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select a section on the left first.
                </p>
              )}
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Changes are saved to the draft immediately. The public page is
              only updated when you click Publish. Style changes are previewed
              locally until saved. The preview is approximate; public rendering
              must support the same style keys.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

function DraftElementPreview({
  element,
  styleOverride,
  layoutOverride,
  device,
  responsiveOverride,
}: {
  element: Element;
  styleOverride?: StyleValues;
  layoutOverride?: LayoutValues;
  device: "desktop" | "tablet" | "mobile";
  responsiveOverride?: StyleValues;
}) {
  const deviceStyles =
    device === "desktop" ? {} : styleValues(record(element.responsive)[device]);
  const style = cssStyle(element.styles, {
    ...styleOverride,
    ...deviceStyles,
    ...responsiveOverride,
  });
  if (["container", "group", "row", "column"].includes(element.type)) {
    return (
      <div
        style={{
          ...style,
          ...previewLayout(
            layoutOverride ??
              layoutValues(undefined, element.responsive, element.styles),
            device,
          ),
        }}
        className="min-h-12 rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500"
      >
        {element.type} layout container
      </div>
    );
  }
  const content =
    element.content &&
    typeof element.content === "object" &&
    !Array.isArray(element.content)
      ? (element.content as Record<string, unknown>)
      : {};
  const text = typeof content.text === "string" ? content.text : "";
  if (element.type === "heading")
    return (
      <h3
        style={style}
        className="break-words text-2xl font-bold text-slate-900"
      >
        {text || "Heading"}
      </h3>
    );
  if (element.type === "text")
    return (
      <p
        style={style}
        className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600"
      >
        {text}
      </p>
    );
  if (element.type === "button")
    return (
      <span
        style={style}
        className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {text || "Button"}
      </span>
    );
  if (element.type === "image") {
    const src = typeof content.src === "string" ? content.src : "";
    const alt = typeof content.alt === "string" ? content.alt : "";
    // Only render trusted local or HTTP(S) image URLs; avoid script/data URL injection.
    if (!src.startsWith("/") && !/^https?:\/\//i.test(src))
      return <p className="text-xs text-slate-400">Image URL not set</p>;
    return (
      <img
        src={src}
        alt={alt}
        style={style}
        className="max-h-72 max-w-full rounded-lg object-contain"
      />
    );
  }
  if (element.type === "divider")
    return <hr style={style} className="border-slate-200" />;
  if (element.type === "spacer")
    return <div style={style} className="h-8" aria-hidden="true" />;
  return (
    <p style={style} className="text-xs text-slate-500">
      {text || element.type}
    </p>
  );
}
