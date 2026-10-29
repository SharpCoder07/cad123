import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type Context = { params: Promise<{ elementId: string }> };
const JSON_FIELDS = ["content", "styles", "responsive", "action"] as const;
const ALLOWED_FIELDS = new Set(["key", "sortOrder", "visible", "parentId", ...JSON_FIELDS]);
const MAX_JSON_BYTES = 32_000;

function responseError(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  console.error("Website element API error:", error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

async function getId(context: Context): Promise<number | null> {
  const { elementId } = await context.params;
  if (!/^[1-9]\d*$/.test(elementId)) return null;
  const id = Number(elementId);
  return Number.isSafeInteger(id) ? id : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validJsonTree(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 500 && value.every((v) => validJsonTree(v, depth + 1));
  if (!isObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 200 && entries.every(([key, v]) =>
    key.length <= 100 && !["__proto__", "prototype", "constructor"].includes(key) && validJsonTree(v, depth + 1)
  );
}

function validJsonObject(value: unknown): value is Prisma.InputJsonObject {
  if (!isObject(value) || !validJsonTree(value)) return false;
  try { return Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_JSON_BYTES; }
  catch { return false; }
}

async function findElement(id: number) {
  return prisma.websiteElement.findUnique({
    where: { id },
    include: {
      children: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      section: {
        select: {
          id: true, key: true, versionId: true,
          version: {
            select: {
              id: true, version: true, status: true, pageId: true,
              page: { select: { status: true, publishedVersion: true } },
            },
          },
        },
      },
    },
  });
}

function editable(element: NonNullable<Awaited<ReturnType<typeof findElement>>>) {
  const version = element.section.version;
  return version.status === "DRAFT" && version.page.status === "ACTIVE" && version.page.publishedVersion !== version.version;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.view");
    const id = await getId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid element ID" }, { status: 400 });
    const element = await findElement(id);
    if (!element) return NextResponse.json({ success: false, message: "Element not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: element });
  } catch (error) { return responseError(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.edit");
    const id = await getId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid element ID" }, { status: 400 });
    const element = await findElement(id);
    if (!element) return NextResponse.json({ success: false, message: "Element not found" }, { status: 404 });
    if (!editable(element)) return NextResponse.json({ success: false, message: "Only active, unpublished drafts may be edited" }, { status: 409 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 }); }
    if (!isObject(body) || Object.keys(body).length === 0 || Object.keys(body).some((k) => !ALLOWED_FIELDS.has(k))) {
      return NextResponse.json({ success: false, message: "Provide only editable fields: key, sortOrder, visible, parentId, content, styles, responsive, action" }, { status: 400 });
    }

    const data: Prisma.WebsiteElementUpdateInput = {};
    if ("key" in body) {
      if (typeof body.key !== "string" || !/^[a-z][a-z0-9_-]{0,79}$/.test(body.key)) {
        return NextResponse.json({ success: false, message: "Invalid element key" }, { status: 400 });
      }
      data.key = body.key;
    }
    if ("sortOrder" in body) {
      if (!Number.isSafeInteger(body.sortOrder) || (body.sortOrder as number) < 0 || (body.sortOrder as number) > 100000) {
        return NextResponse.json({ success: false, message: "sortOrder must be between 0 and 100000" }, { status: 400 });
      }
      data.sortOrder = body.sortOrder as number;
    }
    if ("visible" in body) {
      if (typeof body.visible !== "boolean") return NextResponse.json({ success: false, message: "visible must be boolean" }, { status: 400 });
      data.visible = body.visible;
    }
    if ("parentId" in body) {
      if (body.parentId === null) {
        data.parent = { disconnect: true };
      } else {
        if (typeof body.parentId !== "number" || !Number.isSafeInteger(body.parentId) || body.parentId <= 0 || body.parentId === id) {
          return NextResponse.json({ success: false, message: "Invalid parentId" }, { status: 400 });
        }
        const parent = await prisma.websiteElement.findUnique({ where: { id: body.parentId }, select: { id: true, sectionId: true, parentId: true, type: true } });
        if (!parent || parent.sectionId !== element.sectionId || !["container", "row", "column"].includes(parent.type)) {
          return NextResponse.json({ success: false, message: "Parent must be a container, row or column in the same section" }, { status: 400 });
        }
        // Walk ancestry to prevent cycles (including indirect self-parenting).
        const seen = new Set<number>([id]);
        let cursor: number | null = parent.id;
        while (cursor !== null) {
          if (seen.has(cursor)) return NextResponse.json({ success: false, message: "Parent relationship would create a cycle" }, { status: 400 });
          seen.add(cursor);
          const ancestor: { parentId: number | null } | null = await prisma.websiteElement.findUnique({ where: { id: cursor }, select: { parentId: true } });
          cursor = ancestor?.parentId ?? null;
        }
        data.parent = { connect: { id: parent.id } };
      }
    }
    for (const field of JSON_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field];
      if (value === null) {
        data[field] = Prisma.DbNull;
      } else {
        if (!validJsonObject(value)) return NextResponse.json({ success: false, message: `${field} must be a valid JSON object up to ${MAX_JSON_BYTES} bytes` }, { status: 400 });
        data[field] = value;
      }
    }
    try {
      const updated = await prisma.websiteElement.update({ where: { id }, data });
      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ success: false, message: "An element with that key already exists in this section" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) { return responseError(error); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.delete");
    const id = await getId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid element ID" }, { status: 400 });
    const element = await findElement(id);
    if (!element) return NextResponse.json({ success: false, message: "Element not found" }, { status: 404 });
    if (!editable(element)) return NextResponse.json({ success: false, message: "Only active, unpublished drafts may be edited" }, { status: 409 });
    // Schema's parent relation uses onDelete: Cascade, so children are deleted too.
    await prisma.websiteElement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Element and nested children deleted" });
  } catch (error) { return responseError(error); }
}
