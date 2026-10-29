import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ elementId: string }>;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return invalid(error.message, 401);
  if (error instanceof ForbiddenError) return invalid(error.message, 403);
  if (error instanceof GlobalSectionSizeError) {
    return invalid(error.message, 409);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return invalid(
        "An element with this key already exists in the destination section.",
        409,
      );
    if (error.code === "P2025") return invalid("Element not found.", 404);
  }
  console.error("Website element API error:", error);
  return invalid("Unable to process element request.", 500);
}

function validId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validJson(value: unknown): value is Prisma.InputJsonValue {
  if (value === null) return false;
  try {
    const serialized = JSON.stringify(value);
    return serialized !== undefined && serialized.length <= 200_000;
  } catch {
    return false;
  }
}

const MAX_GLOBAL_SECTION_BYTES = 32_000;

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
    throw new Error("Source section not found.");
  }

  const data = {
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

  const serialized = JSON.stringify(data);

  if (
    new TextEncoder().encode(serialized).byteLength > MAX_GLOBAL_SECTION_BYTES
  ) {
    throw new GlobalSectionSizeError();
  }

  await tx.websiteGlobalSection.update({
    where: { id: globalSectionId },
    data: {
      data: data as Prisma.InputJsonValue,
      type: section.type,
    },
  });
}

/**
 * PATCH /api/admin/website-builder/elements/[elementId]
 * Updates draft element content, styles, responsive overrides, action,
 * visibility, ordering, or moves a leaf element to another draft section.
 *
 * Example responsive payload:
 * { "responsive": { "mobile": { "fontSize": "28px" } } }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.edit");
    const id = validId((await params).elementId);
    if (id === null) return invalid("Invalid element ID.");

    const body: unknown = await request.json().catch(() => null);
    if (!isObject(body)) return invalid("Expected a JSON object.");

    const allowed = new Set([
      "key",
      "type",
      "sortOrder",
      "visible",
      "content",
      "styles",
      "responsive",
      "action",
      "sectionId",
    ]);
    const fields = Object.keys(body);
    if (fields.length === 0 || fields.some((field) => !allowed.has(field))) {
      return invalid(
        "Request has no editable fields or includes unsupported fields.",
      );
    }

    const update: Prisma.WebsiteElementUncheckedUpdateInput = {};

    if ("key" in body) {
      if (
        typeof body.key !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(body.key)
      ) {
        return invalid("Invalid element key.");
      }
      update.key = body.key;
    }
    if ("type" in body) {
      if (
        typeof body.type !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_-]{0,49}$/.test(body.type)
      ) {
        return invalid("Invalid element type.");
      }
      update.type = body.type;
    }
    if ("visible" in body) {
      if (typeof body.visible !== "boolean")
        return invalid("visible must be a boolean.");
      update.visible = body.visible;
    }
    if ("sortOrder" in body) {
      if (
        !Number.isSafeInteger(body.sortOrder) ||
        (body.sortOrder as number) < 0 ||
        (body.sortOrder as number) > 100000
      ) {
        return invalid("sortOrder must be a nonnegative integer.");
      }
      update.sortOrder = body.sortOrder as number;
    }

    for (const field of [
      "content",
      "styles",
      "responsive",
      "action",
    ] as const) {
      if (!(field in body)) continue;
      const value = body[field];
      if (value !== null && !validJson(value))
        return invalid(`Invalid ${field} JSON.`);
      if (field === "responsive" && value !== null) {
        if (!isObject(value))
          return invalid("responsive must be an object or null.");
        for (const [device, overrides] of Object.entries(value)) {
          if (
            !["desktop", "tablet", "mobile"].includes(device) ||
            !isObject(overrides)
          ) {
            return invalid(
              "responsive must contain desktop, tablet, or mobile style objects.",
            );
          }
        }
      }
      update[field] =
        value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
    }

    let destinationId: number | undefined;
    if ("sectionId" in body) {
      if (
        !Number.isSafeInteger(body.sectionId) ||
        (body.sectionId as number) <= 0
      ) {
        return invalid("sectionId must be a positive integer.");
      }
      destinationId = body.sectionId as number;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.websiteElement.findUnique({
        where: { id },
        include: {
          section: {
            select: {
              id: true,
              globalSectionId: true,
              versionId: true,
              version: true,
            },
          },
          children: { select: { id: true } },
        },
      });
      if (!existing)
        return { status: 404, message: "Element not found." } as const;
      if (existing.section.version.status !== "DRAFT") {
        return {
          status: 409,
          message: "Only draft elements can be edited.",
        } as const;
      }

      // Preserve other breakpoint overrides when a client sends only one device.
      if ("responsive" in body && isObject(body.responsive)) {
        const previous = isObject(existing.responsive)
          ? existing.responsive
          : {};
        const merged: JsonObject = { ...previous };
        for (const [device, overrides] of Object.entries(body.responsive)) {
          const priorDevice = isObject(previous[device])
            ? previous[device]
            : {};
          merged[device] = { ...priorDevice, ...(overrides as JsonObject) };
        }
        update.responsive = merged as Prisma.InputJsonValue;
      }

      if (destinationId !== undefined && destinationId !== existing.sectionId) {
        const destination = await tx.websiteSection.findUnique({
          where: { id: destinationId },
          include: { version: true },
        });
        if (!destination)
          return {
            status: 404,
            message: "Destination section not found.",
          } as const;
        if (
          destination.versionId !== existing.section.versionId ||
          destination.version.status !== "DRAFT"
        ) {
          return {
            status: 409,
            message:
              "Elements can only move between sections in the same draft version.",
          } as const;
        }
        if (existing.children.length > 0) {
          return {
            status: 409,
            message:
              "Move child elements individually before moving their parent.",
          } as const;
        }
        const nextKey = typeof body.key === "string" ? body.key : existing.key;
        const collision = await tx.websiteElement.findUnique({
          where: { sectionId_key: { sectionId: destinationId, key: nextKey } },
          select: { id: true },
        });
        if (collision && collision.id !== id) {
          return {
            status: 409,
            message:
              "The destination section already has an element with this key.",
          } as const;
        }
        update.sectionId = destinationId;
        update.parentId = null;
        if (!("sortOrder" in body)) {
          const last = await tx.websiteElement.aggregate({
            where: { sectionId: destinationId },
            _max: { sortOrder: true },
          });
          update.sortOrder = (last._max.sortOrder ?? -1) + 1;
        }
      }

      const element = await tx.websiteElement.update({
        where: { id },
        data: update,
      });

      // Sync the source Global Section after editing or moving the element.
      if (existing.section.globalSectionId !== null) {
        await syncGlobalSection(
          tx,
          existing.sectionId,
          existing.section.globalSectionId,
        );
      }

      // If the element moved, also sync the destination Global Section.
      if (destinationId !== undefined && destinationId !== existing.sectionId) {
        const destination = await tx.websiteSection.findUnique({
          where: { id: destinationId },
          select: {
            id: true,
            globalSectionId: true,
          },
        });

        if (
          destination?.globalSectionId !== null &&
          destination?.globalSectionId !== undefined
        ) {
          await syncGlobalSection(
            tx,
            destination.id,
            destination.globalSectionId,
          );
        }
      }

      return { element } as const;
    });

    if ("status" in result) {
      return invalid(
        result.message ?? "Unable to update element.",
        result.status,
      );
    }
    return NextResponse.json({
      success: true,
      data: result.element,
      message: "Element updated.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/admin/website-builder/elements/[elementId] */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.delete");
    const id = validId((await params).elementId);
    if (id === null) return invalid("Invalid element ID.");

    const result = await prisma.$transaction(async (tx) => {
      const element = await tx.websiteElement.findUnique({
        where: { id },
        include: {
          section: {
            select: {
              id: true,
              globalSectionId: true,
              versionId: true,
              version: true,
            },
          },
        },
      });
      if (!element)
        return { status: 404, message: "Element not found." } as const;
      if (element.section.version.status !== "DRAFT") {
        return {
          status: 409,
          message: "Only draft elements can be deleted.",
        } as const;
      }
      await tx.websiteElement.delete({
        where: { id },
      });

      if (element.section.globalSectionId !== null) {
        await syncGlobalSection(
          tx,
          element.section.id,
          element.section.globalSectionId,
        );
      }

      return { success: true } as const;
    });

    if ("status" in result) {
      return invalid(
        result.message ?? "Unable to delete element.",
        result.status,
      );
    }
    return NextResponse.json({ success: true, message: "Element deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
