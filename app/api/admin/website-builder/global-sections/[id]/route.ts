import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type JsonObject = Record<string, unknown>;

const MAX_JSON_BYTES = 32_000;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401);
  }

  if (error instanceof ForbiddenError) {
    return fail(error.message, 403);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return fail("Global section not found.", 404);
    }
  }

  console.error("Global section API error:", error);

  return fail("Unable to process global section request.", 500);
}

function validJson(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || value === undefined) return false;

  try {
    const serialized = JSON.stringify(value);

    return (
      serialized !== undefined &&
      new TextEncoder().encode(serialized).byteLength <= MAX_JSON_BYTES
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/website-builder/global-sections/[id]
 * Retrieve one global section.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.view");

    const id = parseId((await params).id);

    if (id === null) {
      return fail("Invalid global section ID.");
    }

    const globalSection = await prisma.websiteGlobalSection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        data: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    if (!globalSection) {
      return fail("Global section not found.", 404);
    }

    return NextResponse.json({
      success: true,
      data: globalSection,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/website-builder/global-sections/[id]
 * Update global section metadata or its shared content.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.edit");

    const id = parseId((await params).id);

    if (id === null) {
      return fail("Invalid global section ID.");
    }

    const body: unknown = await request.json().catch(() => null);

    if (!isObject(body)) {
      return fail("Request body must be a JSON object.");
    }

    const allowedFields = new Set(["name", "type", "description", "data"]);

    const fields = Object.keys(body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.has(field))
    ) {
      return fail(
        "No editable fields supplied or unsupported fields included.",
      );
    }

    const update: Prisma.WebsiteGlobalSectionUpdateInput = {};

    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 120
      ) {
        return fail("Name must be between 1 and 120 characters.");
      }

      update.name = body.name.trim();
    }

    if ("type" in body) {
      if (
        typeof body.type !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_-]{0,49}$/.test(body.type)
      ) {
        return fail("Invalid global section type.");
      }

      update.type = body.type;
    }

    if ("description" in body) {
      if (
        body.description !== null &&
        (typeof body.description !== "string" || body.description.length > 500)
      ) {
        return fail(
          "Description must be a string of at most 500 characters or null.",
        );
      }

      update.description = body.description;
    }

    if ("data" in body) {
      if (!validJson(body.data) || !isObject(body.data)) {
        return fail(
          `Data must be a JSON object within ${MAX_JSON_BYTES} bytes.`,
        );
      }

      const globalData = body.data as Record<string, unknown>;

      if (
        !isObject(globalData["section"]) ||
        !Array.isArray(globalData["elements"])
      ) {
        return fail(
          "Data must contain a section object and an elements array.",
        );
      }

      update.data = body.data as Prisma.InputJsonValue;
    }

    const existing = await prisma.websiteGlobalSection.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return fail("Global section not found.", 404);
    }

    const globalSection = await prisma.websiteGlobalSection.update({
      where: { id },
      data: update,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        data: true,
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
      message: "Global section updated successfully.",
      data: globalSection,
    });
  } catch (error) {
    return handleError(error);
  }
}


/**
 * DELETE /api/admin/website-builder/global-sections/[id]
 * Delete a global section only when it is not in use.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdminPermission("website_builder.delete");

    const id = parseId((await params).id);

    if (id === null) {
      return fail("Invalid global section ID.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const globalSection = await tx.websiteGlobalSection.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      if (!globalSection) {
        return { kind: "missing" as const };
      }

      if (globalSection._count.sections > 0) {
        return {
          kind: "in-use" as const,
          name: globalSection.name,
          usages: globalSection._count.sections,
        };
      }

      await tx.websiteGlobalSection.delete({
        where: { id },
      });

      return { kind: "deleted" as const };
    });

    if (result.kind === "missing") {
      return fail("Global section not found.", 404);
    }

    if (result.kind === "in-use") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete "${result.name}" because it is used by ${result.usages} page section(s). Unlink those sections first.`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Global Section deleted successfully.",
    });
  } catch (error) {
    return handleError(error);
  }
}

