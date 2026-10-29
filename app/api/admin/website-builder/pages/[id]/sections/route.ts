import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

const SECTION_TYPES = [
  "blank",
  "hero",
  "features",
  "testimonials",
  "faq",
  "footer",
  "header",
  "cta",
  "text",
  "gallery",
  "pricing",
  "stats",
  "contact",
] as const;
type SectionType = (typeof SECTION_TYPES)[number];

const SECTION_DEFAULTS: Record<
  SectionType,
  { name: string; settings: Record<string, unknown> }
> = {
  blank: { name: "Blank section", settings: { layout: "container" } },
  hero: {
    name: "Hero",
    settings: { layout: "container", alignment: "center" },
  },
  features: { name: "Features", settings: { layout: "grid", columns: 3 } },
  testimonials: {
    name: "Testimonials",
    settings: { layout: "grid", columns: 3 },
  },
  faq: { name: "FAQ", settings: { layout: "stack" } },
  footer: { name: "Footer", settings: { layout: "columns" } },
  header: { name: "Header", settings: { layout: "row" } },
  cta: {
    name: "Call to action",
    settings: { layout: "container", alignment: "center" },
  },
  text: { name: "Text", settings: { layout: "container" } },
  gallery: { name: "Gallery", settings: { layout: "grid", columns: 3 } },
  pricing: { name: "Pricing", settings: { layout: "grid", columns: 3 } },
  stats: { name: "Statistics", settings: { layout: "grid", columns: 4 } },
  contact: { name: "Contact", settings: { layout: "container" } },
};

function respondToError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 },
    );
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 },
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A section with this key already exists in this version",
      },
      { status: 409 },
    );
  }
  console.error("Website sections API error:", error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSafeJson(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value))
    return value.every((entry) => isSafeJson(entry, depth + 1));
  if (isPlainObject(value)) {
    return Object.entries(value).every(
      ([key, entry]) =>
        key !== "__proto__" &&
        key !== "constructor" &&
        key !== "prototype" &&
        isSafeJson(entry, depth + 1),
    );
  }
  return false;
}

function invalid(message: string) {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminPermission("website_builder.view");
    const pageId = parseId((await context.params).id);
    if (pageId === null) return invalid("Invalid page ID");

    const page = await prisma.websitePage.findUnique({
      where: { id: pageId },
      select: { id: true, slug: true, title: true, status: true },
    });
    if (!page)
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );

    const versionParam = request.nextUrl.searchParams.get("versionId");
    const versionId = versionParam === null ? null : parseId(versionParam);
    if (versionParam !== null && versionId === null)
      return invalid("Invalid versionId");

    // Default to the working draft; never silently return published content as editable.
    const version = await prisma.websitePageVersion.findFirst({
      where: {
        pageId,
        ...(versionId !== null ? { id: versionId } : { status: "DRAFT" }),
      },
      orderBy: versionId === null ? { version: "desc" } : undefined,
      select: { id: true, version: true, status: true },
    });
    if (!version) {
      return NextResponse.json(
        { success: false, message: "Version not found; create a draft first" },
        { status: 404 },
      );
    }

    const sections = await prisma.websiteSection.findMany({
      where: { versionId: version.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        elements: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    });
    return NextResponse.json({
      success: true,
      data: { page, version, sections },
    });
  } catch (error) {
    return respondToError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminPermission("website_builder.edit");
    const pageId = parseId((await context.params).id);
    if (pageId === null) return invalid("Invalid page ID");

    const raw = await request.text();
    if (raw.length > 50_000) return invalid("Request body is too large");
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return invalid("Invalid JSON body");
    }
    if (!isPlainObject(body)) return invalid("Expected a JSON object");

    const allowed = new Set([
      "type",
      "key",
      "name",
      "visible",
      "sortOrder",
      "settings",
      "styles",
    ]);
    if (Object.keys(body).some((key) => !allowed.has(key)))
      return invalid("Unsupported section field");

    const type = body.type;
    if (
      typeof type !== "string" ||
      !SECTION_TYPES.includes(type as SectionType)
    ) {
      return invalid(
        `Invalid section type. Allowed: ${SECTION_TYPES.join(", ")}`,
      );
    }
    if (
      body.key !== undefined &&
      (typeof body.key !== "string" ||
        !/^[a-z][a-z0-9_-]{0,79}$/.test(body.key))
    ) {
      return invalid(
        "key must start with a lowercase letter and contain only lowercase letters, numbers, _ or - (max 80)",
      );
    }
    if (
      body.name !== undefined &&
      body.name !== null &&
      (typeof body.name !== "string" || body.name.trim().length > 120)
    ) {
      return invalid("name must be a string of at most 120 characters");
    }
    if (body.visible !== undefined && typeof body.visible !== "boolean") {
      return invalid("visible must be a boolean");
    }

    if (body.sortOrder !== undefined) {
      if (
        typeof body.sortOrder !== "number" ||
        !Number.isSafeInteger(body.sortOrder) ||
        body.sortOrder < 0 ||
        body.sortOrder > 100_000
      ) {
        return invalid("sortOrder must be an integer between 0 and 100000");
      }
    }
    for (const field of ["settings", "styles"] as const) {
      if (body[field] !== undefined && body[field] !== null) {
        if (
          !isPlainObject(body[field]) ||
          !isSafeJson(body[field]) ||
          JSON.stringify(body[field]).length > 20_000
        ) {
          return invalid(
            `${field} must be a JSON object of at most 20000 characters`,
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize edits to a page and recheck its state inside the transaction.
      const rows = await tx.$queryRaw<Array<{ id: number; status: string }>>`
        SELECT id, status::text AS status FROM "WebsitePage" WHERE id = ${pageId} FOR UPDATE
      `;
      if (rows.length === 0) return { kind: "missing" as const };
      if (rows[0].status !== "ACTIVE") return { kind: "archived" as const };

      const draft = await tx.websitePageVersion.findFirst({
        where: { pageId, status: "DRAFT" },
        orderBy: { version: "desc" },
        select: { id: true },
      });
      if (!draft) return { kind: "no-draft" as const };

      const max = await tx.websiteSection.aggregate({
        where: { versionId: draft.id },
        _max: { sortOrder: true },
      });
      const key =
        typeof body.key === "string"
          ? body.key
          : `${type}-${crypto.randomUUID().slice(0, 8)}`;
      const defaults = SECTION_DEFAULTS[type as SectionType];
      const section = await tx.websiteSection.create({
        data: {
          versionId: draft.id,
          type,
          key,
          name:
            body.name === null
              ? null
              : typeof body.name === "string"
                ? body.name.trim()
                : defaults.name,
          visible: typeof body.visible === "boolean" ? body.visible : true,
          sortOrder:
            typeof body.sortOrder === "number"
              ? body.sortOrder
              : (max._max.sortOrder ?? -1) + 1,
          settings:
            body.settings === null
              ? Prisma.JsonNull
              : body.settings === undefined
                ? (defaults.settings as Prisma.InputJsonValue)
                : (body.settings as Prisma.InputJsonValue),
          styles:
            body.styles === undefined || body.styles === null
              ? Prisma.JsonNull
              : (body.styles as Prisma.InputJsonValue),
        },
        include: { elements: true },
      });
      return { kind: "created" as const, section };
    });

    if (result.kind === "missing")
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    if (result.kind === "archived")
      return NextResponse.json(
        { success: false, message: "Archived pages cannot be edited" },
        { status: 409 },
      );
    if (result.kind === "no-draft")
      return NextResponse.json(
        {
          success: false,
          message: "Create a draft version before adding sections",
        },
        { status: 409 },
      );
    return NextResponse.json(
      { success: true, message: "Section created", data: result.section },
      { status: 201 },
    );
  } catch (error) {
    return respondToError(error);
  }
}
