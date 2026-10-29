import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type Context = { params: Promise<{ id: string }> };

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
  console.error("Website Builder page API error:", error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}

async function pageId(context: Context) {
  const { id } = await context.params;
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 && /^\d+$/.test(id)
    ? value
    : null;
}

const pageInclude = {
  versions: {
    orderBy: { version: "desc" as const },
    include: {
      sections: {
        orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
        include: {
          elements: {
            orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
          },
        },
      },
    },
  },
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.view");
    const id = await pageId(context);
    if (!id)
      return NextResponse.json(
        { success: false, message: "Invalid page ID" },
        { status: 400 },
      );
    const page = await prisma.websitePage.findUnique({
      where: { id },
      include: pageInclude,
    });
    if (!page)
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.edit");
    const id = await pageId(context);
    if (!id)
      return NextResponse.json(
        { success: false, message: "Invalid page ID" },
        { status: 400 },
      );

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Expected a JSON object" },
        { status: 400 },
      );
    }
    const input = body as Record<string, unknown>;
    const allowed = [
      "title",
      "slug",
      "description",
      "seoTitle",
      "seoDescription",
      "seoImage",
    ] as const;
    if (
      Object.keys(input).length === 0 ||
      Object.keys(input).some(
        (key) => !allowed.includes(key as (typeof allowed)[number]),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No editable fields supplied, or unsupported fields provided",
        },
        { status: 400 },
      );
    }

    const data: Prisma.WebsitePageUpdateInput = {};
    for (const field of allowed) {
      if (!(field in input)) continue;
      const value = input[field];
      if (field === "title" || field === "slug") {
        if (typeof value !== "string" || !value.trim()) {
          return NextResponse.json(
            { success: false, message: `${field} must be a non-empty string` },
            { status: 400 },
          );
        }
        const trimmed = value.trim();
        if (field === "title") {
          if (trimmed.length > 160)
            return NextResponse.json(
              { success: false, message: "Title is too long" },
              { status: 400 },
            );
          data.title = trimmed;
        } else {
          if (
            trimmed.length > 120 ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Slug must use lowercase letters, numbers and single hyphens",
              },
              { status: 400 },
            );
          }
          // Prevent collisions with built-in application routes.
          const reserved = new Set([
            "admin",
            "api",
            "vendor",
            "login",
            "register",
            "auth",
            "_next",
            "products",
            "blog",
            "contact",
          ]);
          if (reserved.has(trimmed))
            return NextResponse.json(
              { success: false, message: "This slug is reserved" },
              { status: 400 },
            );
          data.slug = trimmed;
        }
      } else {
        const maxLength =
          field === "seoTitle"
            ? 160
            : field === "seoDescription"
              ? 320
              : field === "seoImage"
                ? 2048
                : 1000;

        if (
          value !== null &&
          (typeof value !== "string" || value.length > maxLength)
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `${field} must be a string or null within ${maxLength} characters`,
            },
            { status: 400 },
          );
        }

        if (
          field === "seoImage" &&
          typeof value === "string" &&
          value &&
          !/^(https:\/\/|\/(?!\/))/.test(value)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "SEO image must use an HTTPS URL or a root-relative path",
            },
            { status: 400 },
          );
        }

        (data as Record<string, unknown>)[field] = value;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.websitePage.findUnique({
        where: { id },
        select: { id: true, publishedVersion: true, status: true },
      });
      if (!existing) return { kind: "missing" as const };

      const seoFields = new Set(["seoTitle", "seoDescription", "seoImage"]);

      const hasNonSeoChanges = Object.keys(data).some(
        (field) => !seoFields.has(field),
      );

      if (existing.publishedVersion !== null && hasNonSeoChanges) {
        return { kind: "published" as const };
      }

      const page = await tx.websitePage.update({
        where: { id },
        data,
        include: pageInclude,
      });
      return { kind: "ok" as const, page };
    });
    if (result.kind === "missing")
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    if (result.kind === "published")
      return NextResponse.json(
        {
          success: false,
          message:
            "This page is published. Unpublish it before changing page-level metadata.",
        },
        { status: 409 },
      );
    return NextResponse.json({ success: true, data: result.page });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, message: "A page with this slug already exists" },
        { status: 409 },
      );
    }
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    await requireAdminPermission("website_builder.delete");
    const id = await pageId(context);
    if (!id)
      return NextResponse.json(
        { success: false, message: "Invalid page ID" },
        { status: 400 },
      );
    const result = await prisma.$transaction(async (tx) => {
      const page = await tx.websitePage.findUnique({
        where: { id },
        select: {
          publishedVersion: true,
          versions: { select: { status: true } },
        },
      });
      if (!page) return "missing" as const;
      if (
        page.publishedVersion !== null ||
        page.versions.some((v) => v.status === "PUBLISHED")
      )
        return "published" as const;
      await tx.websitePage.delete({ where: { id } });
      return "deleted" as const;
    });
    if (result === "missing")
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    if (result === "published")
      return NextResponse.json(
        {
          success: false,
          message:
            "Published pages cannot be deleted. Unpublish and archive them first.",
        },
        { status: 409 },
      );
    return NextResponse.json({ success: true, message: "Draft page deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
