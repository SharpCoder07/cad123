import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

function handleError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action.",
      },
      { status: 403 },
    );
  }

  console.error(fallbackMessage, error);

  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
    },
    { status: 500 },
  );
}

export async function GET() {
  try {
    // RBAC: Only admins with products.view can fetch products.
    await requireAdminPermission("products.view");

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    return handleError(error, "Failed to fetch products.");
  }
}

export async function POST(request: Request) {
  try {
    // RBAC: Only admins with products.create can add products.
    await requireAdminPermission("products.create");

    const body = await request.json();

    const {
      name,
      slug,
      shortDescription,
      description,
      website,
      pricing,
      freeTrial,
      isFeatured,
      brandId,
      categoryId,
    } = body;

    if (!name?.trim() || !slug?.trim() || !brandId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, brand and category are required.",
        },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: slug.trim(),
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription?.trim() || null,
        description: description?.trim() || null,
        website: website?.trim() || null,
        pricing: pricing?.trim() || null,
        freeTrial: Boolean(freeTrial),
        isFeatured: isFeatured === true,
        brandId: Number(brandId),
        categoryId: Number(categoryId),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error, "Failed to create product.");
  }
}
