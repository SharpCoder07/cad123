import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = { params: Promise<{ sectionId: string }> };

const ELEMENT_TYPES = new Set([
  "container", "row", "column", "heading", "text", "button", "image",
  "link", "icon", "divider", "spacer", "list", "video", "embed",
]);
const JSON_FIELDS = ["content", "styles", "responsive", "action"] as const;
const MAX_JSON_BYTES = 32_000;

function respondToError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
  console.error("Website elements API error:", error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateJson(value: unknown): value is Prisma.InputJsonValue {
  if (!isPlainObject(value)) return false;
  try {
    return JSON.stringify(value).length <= MAX_JSON_BYTES;
  } catch {
    return false;
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminPermission("website_builder.view");
    const { sectionId } = await context.params;
    const id = parseId(sectionId);
    if (id === null) {
      return NextResponse.json({ success: false, message: "Invalid section ID" }, { status: 400 });
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id },
      select: {
        id: true, key: true, name: true, type: true, versionId: true,
        version: { select: { id: true, version: true, status: true, pageId: true } },
        elements: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    });
    if (!section) {
      return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    return respondToError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminPermission("website_builder.edit");
    const { sectionId } = await context.params;
    const id = parseId(sectionId);
    if (id === null) {
      return NextResponse.json({ success: false, message: "Invalid section ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
    }
    if (!isPlainObject(body)) {
      return NextResponse.json({ success: false, message: "Body must be an object" }, { status: 400 });
    }

    const { key, type, parentId, sortOrder, visible } = body;
    if (typeof key !== "string" || !/^[a-z][a-z0-9_-]{0,79}$/.test(key)) {
      return NextResponse.json({ success: false, message: "key must be 1–80 lowercase letters, digits, underscores or hyphens, beginning with a letter" }, { status: 400 });
    }
    if (typeof type !== "string" || !ELEMENT_TYPES.has(type)) {
      return NextResponse.json({ success: false, message: "Unsupported element type" }, { status: 400 });
    }
    if (parentId !== undefined && parentId !== null && (typeof parentId !== "number" || !Number.isSafeInteger(parentId) || parentId <= 0)) {
      return NextResponse.json({ success: false, message: "Invalid parentId" }, { status: 400 });
    }
    if (sortOrder !== undefined && (!Number.isSafeInteger(sortOrder) || (sortOrder as number) < 0)) {
      return NextResponse.json({ success: false, message: "sortOrder must be a nonnegative integer" }, { status: 400 });
    }
    if (visible !== undefined && typeof visible !== "boolean") {
      return NextResponse.json({ success: false, message: "visible must be a boolean" }, { status: 400 });
    }
    for (const field of JSON_FIELDS) {
      if (body[field] !== undefined && body[field] !== null && !validateJson(body[field])) {
        return NextResponse.json({ success: false, message: `${field} must be a JSON object of at most ${MAX_JSON_BYTES} characters` }, { status: 400 });
      }
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id },
      select: {
        versionId: true,
        version: { select: { status: true, page: { select: { publishedVersion: true, status: true } }, version: true } },
      },
    });
    if (!section) {
      return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 });
    }
    if (section.version.status !== "DRAFT" || section.version.page.publishedVersion === section.version.version || section.version.page.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "Only an active page's unpublished draft can be edited" }, { status: 409 });
    }

    const parent = parentId == null ? null : await prisma.websiteElement.findUnique({
      where: { id: parentId as number },
      select: { id: true, sectionId: true, type: true },
    });
    if (parentId != null && (!parent || parent.sectionId !== id || !["container", "row", "column"].includes(parent.type))) {
      return NextResponse.json({ success: false, message: "Parent must be a container, row or column in this section" }, { status: 400 });
    }

    try {
      const element = await prisma.websiteElement.create({
        data: {
          sectionId: id,
          key,
          type,
          parentId: parent?.id ?? null,
          sortOrder: (sortOrder as number | undefined) ?? 0,
          visible: (visible as boolean | undefined) ?? true,
          ...(body.content != null ? { content: body.content as Prisma.InputJsonValue } : {}),
          ...(body.styles != null ? { styles: body.styles as Prisma.InputJsonValue } : {}),
          ...(body.responsive != null ? { responsive: body.responsive as Prisma.InputJsonValue } : {}),
          ...(body.action != null ? { action: body.action as Prisma.InputJsonValue } : {}),
        },
      });
      return NextResponse.json({ success: true, data: element }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ success: false, message: "An element with this key already exists in the section" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    return respondToError(error);
  }
}
