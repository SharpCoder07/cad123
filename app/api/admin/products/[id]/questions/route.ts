import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/admin/products/[id]/questions
export async function GET(_request: Request, context: RouteContext) {
  try {
    // RBAC: questions.view
    const admin = await requireAdmin();

    if (
      !admin.permissions.includes("questions.view") &&
      !admin.permissions.includes("questions.answer")
    ) {
      throw new ForbiddenError();
    }

    const { id } = await context.params;

    // Validate product ID.
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

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

    // Check whether the product exists.
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
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

    // Fetch product questions and their answers.
    const questions = await prisma.productQuestion.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view product questions.",
        },
        { status: 403 },
      );
    }

    console.error("Get product questions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product questions.",
      },
      { status: 500 },
    );
  }
}
