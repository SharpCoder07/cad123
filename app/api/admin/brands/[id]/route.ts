
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

// Validate a brand ID from the URL.
function parseBrandId(id: string): number | null {
  const brandId = Number(id);

  if (
    !Number.isSafeInteger(brandId) ||
    brandId <= 0
  ) {
    return null;
  }

  return brandId;
}

// GET /api/admin/brands/[id]
// Permission: brands.view OR brands.edit
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    // Allow editors to load brand details even if they
    // don't separately have brands.view.
    const canRead =
      admin.permissions.includes("brands.view") ||
      admin.permissions.includes("brands.edit");

    if (!canRead) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view this brand.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const brandId = parseBrandId(id);

    if (brandId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand ID.",
        },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
    });

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get brand error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load brand.",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/brands/[id]
// Permission: brands.edit
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("brands.edit");

    const { id } = await context.params;
    const brandId = parseBrandId(id);

    if (brandId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand ID.",
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
        throw new Error("Invalid request body");
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
      website,
      logo,
    } = body;

    const brandName =
      typeof name === "string" ? name.trim() : "";

    const brandSlug =
      typeof slug === "string" ? slug.trim() : "";

    if (!brandName || !brandSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand name and slug are required.",
        },
        { status: 400 }
      );
    }

    // Validate optional fields before calling trim().
    const optionalFields = {
      description,
      website,
      logo,
    };

    for (const [field, value] of Object.entries(optionalFields)) {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} must be a string.`,
          },
          { status: 400 }
        );
      }
    }

    const currentBrand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
      select: {
        id: true,
      },
    });

    if (!currentBrand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found.",
        },
        { status: 404 }
      );
    }

    const existingBrand = await prisma.brand.findFirst({
      where: {
        slug: brandSlug,
        NOT: {
          id: brandId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingBrand) {
      return NextResponse.json(
        {
          success: false,
          message: "A brand with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const brand = await prisma.brand.update({
      where: {
        id: brandId,
      },
      data: {
        name: brandName,
        slug: brandSlug,
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
        website:
          typeof website === "string"
            ? website.trim() || null
            : null,
        logo:
          typeof logo === "string"
            ? logo.trim() || null
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Brand updated successfully.",
      brand,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Update brand error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update brand.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/brands/[id]
// Permission: brands.delete
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("brands.delete");

    const { id } = await context.params;
    const brandId = parseBrandId(id);

    if (brandId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand ID.",
        },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
    });

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found.",
        },
        { status: 404 }
      );
    }

    const productCount = await prisma.product.count({
      where: {
        brandId,
      },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this brand because products are linked to it.",
        },
        { status: 409 }
      );
    }

    await prisma.brand.delete({
      where: {
        id: brandId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Delete brand error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete brand.",
      },
      { status: 500 }
    );
  }
}
