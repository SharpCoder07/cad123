
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Please sign in.",
      },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action.",
      },
      { status: 403 }
    );
  }

  return null;
}

function parseCategoryId(id: string): number | null {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const categoryId = Number(id);

  return Number.isSafeInteger(categoryId) ? categoryId : null;
}

function parseParentId(
  value: unknown
): { valid: true; id: number | null } | { valid: false } {
  if (value === null || value === undefined || value === "") {
    return { valid: true, id: null };
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return { valid: false };
  }

  if (
    typeof value === "string" &&
    !/^[1-9]\d*$/.test(value)
  ) {
    return { valid: false };
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return { valid: false };
  }

  return { valid: true, id };
}

async function createsCircularHierarchy(
  categoryId: number,
  proposedParentId: number
): Promise<boolean> {
  const visited = new Set<number>();
  let currentId: number | null = proposedParentId;

  while (currentId !== null) {
    if (currentId === categoryId || visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    const current: { parentId: number | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

    if (!current) {
      return false;
    }

    currentId = current.parentId;
  }

  return false;
}

// GET /api/admin/categories/[id]
// Permission: categories.view OR categories.edit
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    const canRead =
      admin.permissions.includes("categories.view") ||
      admin.permissions.includes("categories.edit");

    if (!canRead) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view this category.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const categoryId = parseCategoryId(id);

    if (categoryId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Get category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load category.",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id]
// Permission: categories.edit
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("categories.edit");

    const { id } = await context.params;
    const categoryId = parseCategoryId(id);

    if (categoryId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("Invalid request body.");
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const { name, slug, description, parentId } = body;

    const categoryName =
      typeof name === "string" ? name.trim() : "";

    const categorySlug =
      typeof slug === "string" ? slug.trim() : "";

    if (!categoryName) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required.",
        },
        { status: 400 }
      );
    }

    if (!categorySlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug is required.",
        },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Description must be a string.",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
        NOT: { id: categoryId },
      },
      select: { id: true },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const parsedParent = parseParentId(parentId);

    if (!parsedParent.valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid parent category.",
        },
        { status: 400 }
      );
    }

    const validParentId = parsedParent.id;

    if (validParentId === categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "A category cannot be its own parent.",
        },
        { status: 400 }
      );
    }

    if (validParentId !== null) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validParentId },
        select: { id: true },
      });

      if (!parentCategory) {
        return NextResponse.json(
          {
            success: false,
            message: "Parent category not found.",
          },
          { status: 404 }
        );
      }

      const circular = await createsCircularHierarchy(
        categoryId,
        validParentId
      );

      if (circular) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid hierarchy. A category cannot be placed under one of its descendants.",
          },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: categoryName,
        slug: categorySlug,
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
        parentId: validParentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Update category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id]
// Permission: categories.delete
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("categories.delete");

    const { id } = await context.params;
    const categoryId = parseCategoryId(id);

    if (categoryId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID.",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this category because products are linked to it.",
        },
        { status: 409 }
      );
    }

    const childCount = await prisma.category.count({
      where: { parentId: categoryId },
    });

    if (childCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this category because subcategories are linked to it.",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this category because related records still exist.",
        },
        { status: 409 }
      );
    }

    console.error("Delete category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category.",
      },
      { status: 500 }
    );
  }
}
