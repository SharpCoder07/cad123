import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    // Only admins with product delete permission can restore
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
        deletedAt: {
          not: null,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Removed product not found or already restored.",
        },
        { status: 404 },
      );
    }

    const restoredProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        deletedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product restored successfully.",
      product: restoredProduct,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      );
    }

    console.error("Restore product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to restore product.",
      },
      { status: 500 },
    );
  }
}