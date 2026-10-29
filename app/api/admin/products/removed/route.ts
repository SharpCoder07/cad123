import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export async function GET() {
  try {
    await requireAdminPermission("products.delete");

    const products = await prisma.product.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        isFeatured: true,
        deletedAt: true,
        createdAt: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
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

    console.error("Get removed products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load removed products.",
      },
      { status: 500 },
    );
  }
}