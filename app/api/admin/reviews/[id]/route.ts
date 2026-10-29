
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";

import { prisma } from "@/lib/prisma";

import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// Validate a positive integer review ID.
function getReviewId(id: string): number | null {
  const reviewId = Number(id);

  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(reviewId) ||
    reviewId <= 0
  ) {
    return null;
  }

  return reviewId;
}

// Handle authentication and authorization errors.
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

// GET /api/admin/reviews/[id]
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    // RBAC: reviews.view
    await requireAdminPermission("reviews.view");

    const { id } = await context.params;
    const reviewId = getReviewId(id);

    if (reviewId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review ID.",
        },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
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

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Review not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get admin review error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch review.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id]
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    // RBAC: reviews.delete
    await requireAdminPermission("reviews.delete");

    const { id } = await context.params;
    const reviewId = getReviewId(id);

    if (reviewId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review ID.",
        },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Review not found.",
        },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Review not found.",
          },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This review is referenced by other records and cannot be deleted.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete admin review error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete review.",
      },
      { status: 500 }
    );
  }
}
