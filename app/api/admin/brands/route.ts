
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

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

// GET /api/admin/brands
// Permission: brands.view
export async function GET() {
  try {
    await requireAdminPermission("brands.view");

    const brands = await prisma.brand.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get brands error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load brands.",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/brands
// Permission: brands.create
export async function POST(request: Request) {
  try {
    await requireAdminPermission("brands.create");

    let body: Record<string, unknown>;

    try {
      body = await request.json();

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        throw new Error("Invalid request body");
      }
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

    const existingBrand = await prisma.brand.findUnique({
      where: {
        slug: brandSlug,
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

    const brand = await prisma.brand.create({
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

    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully.",
        brand,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Brand creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create brand.",
      },
      { status: 500 }
    );
  }
}
