
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

// GET /api/admin/reviews
export async function GET() {
  try {
    // RBAC: reviews.view
    await requireAdminPermission("reviews.view");

    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
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
          message:
            "You do not have permission to view reviews.",
        },
        { status: 403 }
      );
    }

    console.error("Get admin reviews error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch reviews.",
      },
      { status: 500 }
    );
  }
}
