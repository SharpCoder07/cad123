
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

const MAX_JSON_BYTES = 32_000;

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) return fail(error.message, 401);
  if (error instanceof ForbiddenError) return fail(error.message, 403);

  console.error("Website section templates API error:", error);
  return fail("Unable to process section templates", 500);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    await requireAdminPermission("website_builder.view");

    const templates = await prisma.websiteSectionTemplate.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission("website_builder.edit");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON request body", 400);
    }

    if (!isObject(body)) {
      return fail("Request body must be an object", 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const sectionId = body.sectionId;

    if (!name || name.length > 100) {
      return fail("Template name must be 1–100 characters", 400);
    }

    if (description !== null && description.length > 500) {
      return fail("Description cannot exceed 500 characters", 400);
    }

    if (
      typeof sectionId !== "number" ||
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0
    ) {
      return fail("A valid section ID is required", 400);
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        type: true,
        name: true,
        visible: true,
        settings: true,
        styles: true,
        version: {
          select: { status: true },
        },
        elements: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            key: true,
            parentId: true,
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
      return fail("Section not found", 404);
    }

    if (section.version.status !== "DRAFT") {
      return fail("Only sections from a draft can be saved as templates", 409);
    }

    const elementKeysById = new Map<number, string>();

    // Resolve element parent references to stable keys for future copying.
    const fullElements = await prisma.websiteElement.findMany({
      where: { sectionId },
      select: { id: true, key: true },
    });

    for (const element of fullElements) {
      elementKeysById.set(element.id, element.key);
    }

    const data = {
      section: {
        type: section.type,
        name: section.name,
        visible: section.visible,
        settings: section.settings,
        styles: section.styles,
      },
      elements: section.elements.map((element) => ({
        key: element.key,
        parentKey:
          element.parentId === null
            ? null
            : elementKeysById.get(element.parentId) ?? null,
        type: element.type,
        sortOrder: element.sortOrder,
        visible: element.visible,
        content: element.content,
        styles: element.styles,
        responsive: element.responsive,
        action: element.action,
      })),
    };

    if (JSON.stringify(data).length > MAX_JSON_BYTES) {
      return fail("Section is too large to save as a template", 400);
    }

    const template = await prisma.websiteSectionTemplate.create({
      data: {
        name,
        description,
        type: section.type,
        data: data as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
