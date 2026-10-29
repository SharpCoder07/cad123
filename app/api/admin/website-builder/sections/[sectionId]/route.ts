import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ sectionId: string }>;
};

class GlobalSectionSizeError extends Error {
  constructor() {
    super("Global section data exceeds the 32 KB limit.");
    this.name = "GlobalSectionSizeError";
  }
}

function errorResponse(error: unknown) {
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

  if (error instanceof GlobalSectionSizeError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 409 },
    );
  }

  console.error("Website Builder section error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}

function parseId(value: string): number | null {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// PATCH — Update section
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.edit");

    const { sectionId } = await params;
    const id = parseId(sectionId);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid section ID" },
        { status: 400 },
      );
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, message: "Section not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim();
    }

    if (typeof body.visible === "boolean") {
      data.visible = body.visible;
    }

    if (
      typeof body.sortOrder === "number" &&
      Number.isInteger(body.sortOrder) &&
      body.sortOrder >= 0
    ) {
      data.sortOrder = body.sortOrder;
    }

    if (
      body.styles &&
      typeof body.styles === "object" &&
      !Array.isArray(body.styles)
    ) {
      data.styles = body.styles;
    }

    if (
      body.settings &&
      typeof body.settings === "object" &&
      !Array.isArray(body.settings)
    ) {
      data.settings = body.settings;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Update the section and its canonical global data atomically.
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.websiteSection.findUnique({
        where: { id },
        select: {
          globalSectionId: true,
          version: {
            select: {
              status: true,
              version: true,
              page: {
                select: {
                  status: true,
                  publishedVersion: true,
                },
              },
            },
          },
        },
      });

      if (
        !current ||
        current.version.status !== "DRAFT" ||
        current.version.page.status !== "ACTIVE" ||
        current.version.page.publishedVersion === current.version.version
      ) {
        return null;
      }

      const updatedSection = await tx.websiteSection.update({
        where: { id },
        data,
      });

      if (current.globalSectionId !== null) {
        const sectionData = await tx.websiteSection.findUnique({
          where: { id },
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

        if (!sectionData) {
          throw new Error("Updated section could not be loaded.");
        }

        const globalData = {
          section: {
            id: sectionData.id,
            key: sectionData.key,
            type: sectionData.type,
            name: sectionData.name,
            settings: sectionData.settings,
            styles: sectionData.styles,
          },
          elements: sectionData.elements,
        };

        const serialized = JSON.stringify(globalData);

        if (new TextEncoder().encode(serialized).byteLength > 32_000) {
          throw new GlobalSectionSizeError();
        }

        await tx.websiteGlobalSection.update({
          where: { id: current.globalSectionId },
          data: {
            data: globalData as Prisma.InputJsonValue,
            type: sectionData.type,
          },
        });
      }

      return updatedSection;
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE — Delete section
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.delete");

    const { sectionId } = await params;
    const id = parseId(sectionId);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid section ID" },
        { status: 400 },
      );
    }

    const section = await prisma.websiteSection.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, message: "Section not found" },
        { status: 404 },
      );
    }

    await prisma.websiteSection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
