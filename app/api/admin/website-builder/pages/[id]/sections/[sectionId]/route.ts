import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type Context = { params: Promise<{ sectionId: string }> };

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
  console.error("Website section API error:", error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

async function parseSectionId(context: Context) {
  const { sectionId } = await context.params;
  if (!/^[1-9]\d*$/.test(sectionId)) return null;
  const id = Number(sectionId);
  return Number.isSafeInteger(id) ? id : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validJson(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 500 && value.every((item) => validJson(item, depth + 1));
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 200 && entries.every(([key, item]) =>
    key.length <= 100 && !["__proto__", "constructor", "prototype"].includes(key) && validJson(item, depth + 1)
  );
}

async function findSection(id: number) {
  return prisma.websiteSection.findUnique({
    where: { id },
    include: {
      elements: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      version: { select: { id: true, pageId: true, version: true, status: true, page: { select: { id: true, slug: true, status: true, publishedVersion: true } } } },
    },
  });
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.view");
    const id = await parseSectionId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid section ID" }, { status: 400 });
    const section = await findSection(id);
    if (!section) return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: section });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.edit");
    const id = await parseSectionId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid section ID" }, { status: 400 });
    const section = await findSection(id);
    if (!section) return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 });
    if (section.version.status !== "DRAFT" || section.version.page.status !== "ACTIVE" || section.version.page.publishedVersion === section.version.version) {
      return NextResponse.json({ success: false, message: "Only sections in an active, unpublished draft version can be edited" }, { status: 409 });
    }

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 }); }
    if (!isPlainObject(body)) return NextResponse.json({ success: false, message: "Expected a JSON object" }, { status: 400 });
    const allowed = ["name", "sortOrder", "visible", "settings", "styles"];
    const keys = Object.keys(body);
    if (keys.length === 0 || keys.some((key) => !allowed.includes(key))) {
      return NextResponse.json({ success: false, message: `Provide only: ${allowed.join(", ")}` }, { status: 400 });
    }
    const data: {
      name?: string | null;
      sortOrder?: number;
      visible?: boolean;
      settings?: object;
      styles?: object;
    } = {};
    if ("name" in body) {
      if (body.name !== null && (typeof body.name !== "string" || body.name.trim().length > 120 || !body.name.trim())) {
        return NextResponse.json({ success: false, message: "name must be null or 1–120 characters" }, { status: 400 });
      }
      data.name = typeof body.name === "string" ? body.name.trim() : null;
    }
    if ("sortOrder" in body) {
      if (!Number.isSafeInteger(body.sortOrder) || (body.sortOrder as number) < 0 || (body.sortOrder as number) > 100000) {
        return NextResponse.json({ success: false, message: "sortOrder must be an integer from 0 to 100000" }, { status: 400 });
      }
      data.sortOrder = body.sortOrder as number;
    }
    if ("visible" in body) {
      if (typeof body.visible !== "boolean") return NextResponse.json({ success: false, message: "visible must be boolean" }, { status: 400 });
      data.visible = body.visible;
    }
    for (const field of ["settings", "styles"] as const) {
      if (field in body) {
        const value = body[field];
        if (!isPlainObject(value) || !validJson(value) || JSON.stringify(value).length > 30000) {
          return NextResponse.json({ success: false, message: `${field} must be a valid JSON object of at most 30 KB` }, { status: 400 });
        }
        data[field] = value;
      }
    }
    // Conditional update prevents changing a section after its version is published.
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.websiteSection.findUnique({
        where: { id },
        select: { version: { select: { status: true, version: true, page: { select: { status: true, publishedVersion: true } } } } },
      });
      if (!current || current.version.status !== "DRAFT" || current.version.page.status !== "ACTIVE" || current.version.page.publishedVersion === current.version.version) return null;
      return tx.websiteSection.update({ where: { id }, data });
    });
    if (!result) return NextResponse.json({ success: false, message: "Section is no longer editable" }, { status: 409 });
    return NextResponse.json({ success: true, data: result, message: "Section updated" });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.delete");
    const id = await parseSectionId(context);
    if (id === null) return NextResponse.json({ success: false, message: "Invalid section ID" }, { status: 400 });
    const section = await findSection(id);
    if (!section) return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 });
    if (section.version.status !== "DRAFT" || section.version.page.status !== "ACTIVE" || section.version.page.publishedVersion === section.version.version) {
      return NextResponse.json({ success: false, message: "Only sections in an active, unpublished draft version can be deleted" }, { status: 409 });
    }
    const deleted = await prisma.$transaction(async (tx) => {
      const current = await tx.websiteSection.findUnique({
        where: { id },
        select: { version: { select: { status: true, version: true, page: { select: { status: true, publishedVersion: true } } } } },
      });
      if (!current || current.version.status !== "DRAFT" || current.version.page.status !== "ACTIVE" || current.version.page.publishedVersion === current.version.version) return false;
      await tx.websiteSection.delete({ where: { id } });
      return true;
    });
    if (!deleted) return NextResponse.json({ success: false, message: "Section is no longer editable" }, { status: 409 });
    return NextResponse.json({ success: true, message: "Draft section deleted" });
  } catch (error) { return errorResponse(error); }
}
