
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";
import { Prisma } from "@/prisma/generated/client";

// Handle authentication and permission errors.
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

// GET /api/admin/categories
// Permission: categories.view
export async function GET() {
  try {
    await requireAdminPermission("categories.view");

    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories.",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories
// Permission: categories.create
export async function POST(request: Request) {
  try {
    await requireAdminPermission("categories.create");

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

    const {
      name,
      slug,
      description,
      parentId,
    } = body;

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

    const existingCategory = await prisma.category.findUnique({
      where: {
        slug: categorySlug,
      },
      select: {
        id: true,
      },
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

    let validParentId: number | null = null;

    if (
      parentId !== null &&
      parentId !== undefined &&
      parentId !== ""
    ) {
      // Accept numeric IDs and numeric strings from forms.
      if (
        (typeof parentId !== "string" &&
          typeof parentId !== "number") ||
        (typeof parentId === "string" &&
          parentId.trim() === "")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid parent category.",
          },
          { status: 400 }
        );
      }

      const parsedParentId = Number(parentId);

      if (
        !Number.isSafeInteger(parsedParentId) ||
        parsedParentId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid parent category.",
          },
          { status: 400 }
        );
      }

      const parentCategory = await prisma.category.findUnique({
        where: {
          id: parsedParentId,
        },
        select: {
          id: true,
        },
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

      validParentId = parsedParentId;
    }

    const category = await prisma.category.create({
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

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully.",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    // Handle duplicate slugs caused by concurrent requests.
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

    console.error("Create category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category.",
      },
      { status: 500 }
    );
  }
}
