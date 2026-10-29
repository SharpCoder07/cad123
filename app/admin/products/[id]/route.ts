import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

function permissionErrorResponse(error: unknown) {
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

  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    const permissionResponse = permissionErrorResponse(error);
    if (permissionResponse) return permissionResponse;
    console.error("Get product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const {
      name,
      slug,
      shortDescription,
      description,
      website,
      pricing,
      freeTrial,
      brandId,
      categoryId,
    } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name and slug are required.",
        },
        { status: 400 },
      );
    }

    if (!brandId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand and category are required.",
        },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    const duplicateSlug = await prisma.product.findFirst({
      where: {
        slug: slug.trim(),
        NOT: {
          id: productId,
        },
      },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const brand = await prisma.brand.findUnique({
      where: {
        id: Number(brandId),
      },
    });

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found.",
        },
        { status: 404 },
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 },
      );
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription?.trim() || null,
        description: description?.trim() || null,
        website: website?.trim() || null,
        pricing: pricing?.trim() || null,
        freeTrial: Boolean(freeTrial),
        brandId: Number(brandId),
        categoryId: Number(categoryId),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    const permissionResponse = permissionErrorResponse(error);
    if (permissionResponse) return permissionResponse;
    console.error("Update product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminPermission("products.delete");

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or already removed.",
        },
        { status: 404 },
      );
    }

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product moved to Removed Products successfully.",
    });
  } catch (error) {
    const permissionResponse = permissionErrorResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error("Remove product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove product.",
      },
      { status: 500 },
    );
  }
}
