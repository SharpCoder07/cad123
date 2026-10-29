import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type Context = { params: Promise<{ sectionId: string }> };

type ElementInput = {
  type?: unknown;
  key?: unknown;
  sortOrder?: unknown;
  visible?: unknown;
  parentId?: unknown;
  content?: unknown;
  styles?: unknown;
  responsive?: unknown;
  action?: unknown;
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) return fail(error.message, 401);
  if (error instanceof ForbiddenError) return fail(error.message, 403);
  if (error instanceof GlobalSectionSizeError) {
    return fail(error.message, 409);
  }
  console.error("Website Builder section elements API error:", error);
  return fail("Unable to process section elements", 500);
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null)
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

class GlobalSectionSizeError extends Error {
  constructor() {
    super("Global section data exceeds the 32 KB limit.");
    this.name = "GlobalSectionSizeError";
  }
}

async function syncGlobalSection(
  tx: Prisma.TransactionClient,
  sectionId: number,
  globalSectionId: number,
) {
  const section = await tx.websiteSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      key: true,
      type: true,
      name: true,
      settings: true,
      styles: true,
      elements: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          parentId: true,
          key: true,
          type: true,
          sortOrder: true,
          visible: true,
          content: true,
          styles: true,
          responsive: true,
          action: true,
        },
      },
    },
  });

  if (!section) {
    throw new Error("Global section source could not be loaded.");
  }

  const globalData = {
    section: {
      id: section.id,
      key: section.key,
      type: section.type,
      name: section.name,
      settings: section.settings,
      styles: section.styles,
    },
    elements: section.elements,
  };

  const serialized = JSON.stringify(globalData);

  if (new TextEncoder().encode(serialized).byteLength > 32_000) {
    throw new GlobalSectionSizeError();
  }

  await tx.websiteGlobalSection.update({
    where: { id: globalSectionId },
    data: {
      data: globalData as Prisma.InputJsonValue,
      type: section.type,
    },
  });
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission("website_builder.view");
    const { sectionId: rawId } = await params;
    const sectionId = Number(rawId);
    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
      return fail("Invalid section ID", 400);
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });
    if (!section) return fail("Section not found", 404);

    const elements = await prisma.websiteElement.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ success: true, data: elements });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission("website_builder.edit");
    const { sectionId: rawId } = await params;
    const sectionId = Number(rawId);
    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
      return fail("Invalid section ID", 400);
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        globalSectionId: true,
        version: { select: { status: true } },
      },
    });
    if (!section) return fail("Section not found", 404);
    if (section.version.status !== "DRAFT") {
      return fail("Elements can only be added to draft versions", 409);
    }

    let body: ElementInput;
    try {
      body = (await request.json()) as ElementInput;
    } catch {
      return fail("Invalid JSON request body", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail("Request body must be an object", 400);
    }

    const type = typeof body.type === "string" ? body.type.trim() : "";
    if (!type || type.length > 80)
      return fail("Valid element type is required", 400);

    const key =
      typeof body.key === "string" && body.key.trim()
        ? body.key.trim()
        : `element-${crypto.randomUUID()}`;
    if (key.length > 150) return fail("Element key is too long", 400);

    let parentId: number | null = null;
    if (body.parentId !== undefined && body.parentId !== null) {
      if (
        typeof body.parentId !== "number" ||
        !Number.isSafeInteger(body.parentId) ||
        body.parentId <= 0
      ) {
        return fail("Invalid parent element ID", 400);
      }
      const parent = await prisma.websiteElement.findFirst({
        where: { id: body.parentId, sectionId },
        select: { id: true },
      });
      if (!parent)
        return fail("Parent element must belong to this section", 400);
      parentId = parent.id;
    }

    if (
      body.sortOrder !== undefined &&
      (!Number.isSafeInteger(body.sortOrder) || (body.sortOrder as number) < 0)
    ) {
      return fail("sortOrder must be a non-negative integer", 400);
    }
    if (body.visible !== undefined && typeof body.visible !== "boolean") {
      return fail("visible must be a boolean", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.websiteElement.aggregate({
        where: { sectionId },
        _max: { sortOrder: true },
      });
      const nextSortOrder = (last._max.sortOrder ?? -1) + 1;
      const createdElement = await tx.websiteElement.create({
        data: {
          sectionId,
          parentId,
          key,
          type,
          sortOrder:
            typeof body.sortOrder === "number" ? body.sortOrder : nextSortOrder,
          visible: typeof body.visible === "boolean" ? body.visible : true,
          ...(body.content !== undefined
            ? { content: asJson(body.content) }
            : {}),
          ...(body.styles !== undefined ? { styles: asJson(body.styles) } : {}),
          ...(body.responsive !== undefined
            ? { responsive: asJson(body.responsive) }
            : {}),
          ...(body.action !== undefined ? { action: asJson(body.action) } : {}),
        },
      });

      if (section.globalSectionId !== null) {
        await syncGlobalSection(tx, sectionId, section.globalSectionId);
      }

      return createdElement;
    });

    return NextResponse.json(
      { success: true, data: result, message: "Element created" },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "An element with this key already exists in this section",
        409,
      );
    }
    return handleError(error);
  }
}
