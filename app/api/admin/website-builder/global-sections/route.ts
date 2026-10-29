
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

const MAX_JSON_BYTES = 32_000;

type CreateGlobalSectionInput = {
  name?: unknown;
  description?: unknown;
  sectionId?: unknown;
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status },
  );
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401);
  }

  if (error instanceof ForbiddenError) {
    return fail(error.message, 403);
  }

  console.error("Global sections API error:", error);
  return fail("Unable to process global section request", 500);
}

function parseId(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isSafeJson(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every((item) => isSafeJson(item, depth + 1));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).every(
      ([key, item]) =>
        key !== "__proto__" &&
        key !== "constructor" &&
        key !== "prototype" &&
        isSafeJson(item, depth + 1),
    );
  }

  return false;
}

export async function GET() {
  try {
    await requireAdminPermission("website_builder.view");

    const sections = await prisma.websiteGlobalSection.findMany({
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission("website_builder.edit");

    const rawBody = await request.text();

    if (rawBody.length > 50_000) {
      return fail("Request body is too large", 400);
    }

    let body: CreateGlobalSectionInput;

    try {
      body = JSON.parse(rawBody) as CreateGlobalSectionInput;
    } catch {
      return fail("Invalid JSON request body", 400);
    }

    if (!isPlainObject(body)) {
      return fail("Request body must be an object", 400);
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length > 120) {
      return fail(
        "Name is required and must be at most 120 characters",
        400,
      );
    }

    const description =
      body.description === undefined || body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim()
          : undefined;

    if (
      description === undefined ||
      (description !== null && description.length > 500)
    ) {
      return fail("Description must be at most 500 characters", 400);
    }

    const sectionId = parseId(body.sectionId);

    if (sectionId === null) {
      return fail("A valid sectionId is required", 400);
    }

    const source = await prisma.websiteSection.findUnique({
      where: { id: sectionId },
      include: {
        version: {
          select: {
            status: true,
            page: {
              select: {
                status: true,
              },
            },
          },
        },
        elements: {
          orderBy: [
            { sortOrder: "asc" },
            { id: "asc" },
          ],
        },
      },
    });

    if (!source) {
      return fail("Source section not found", 404);
    }

    if (source.version.status !== "DRAFT") {
      return fail(
        "Only sections in a draft version can become global",
        409,
      );
    }

    if (source.version.page.status !== "ACTIVE") {
      return fail("The source page is not active", 409);
    }

    if (source.globalSectionId !== null) {
      return fail(
        "This section is already linked to a global section",
        409,
      );
    }

    const data = {
      section: {
        key: source.key,
        name: source.name,
        type: source.type,
        visible: source.visible,
        settings: source.settings,
        styles: source.styles,
      },
      elements: source.elements.map((element) => ({
        key: element.key,
        parentId: element.parentId,
        type: element.type,
        sortOrder: element.sortOrder,
        visible: element.visible,
        content: element.content,
        styles: element.styles,
        responsive: element.responsive,
        action: element.action,
      })),
    };

    if (
      !isSafeJson(data) ||
      JSON.stringify(data).length > MAX_JSON_BYTES
    ) {
      return fail(
        "Section data is too large or contains unsupported values",
        400,
      );
    }

    const globalSection = await prisma.$transaction(async (tx) => {
      const created = await tx.websiteGlobalSection.create({
        data: {
          name,
          description,
          type: source.type,
          data: data as Prisma.InputJsonValue,
        },
      });

      await tx.websiteSection.update({
        where: { id: source.id },
        data: {
          globalSectionId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Global section created successfully",
        data: globalSection,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
