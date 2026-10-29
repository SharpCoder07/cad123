
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
    questionId: string;
  }>;
};

// Validate positive integer IDs.
function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

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

// GET /api/admin/products/[id]/questions/[questionId]
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    // RBAC: questions.view
    await requireAdminPermission("questions.view");

    const { id, questionId } = await context.params;

    const productId = parseId(id);
    const parsedQuestionId = parseId(questionId);

    if (productId === null || parsedQuestionId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or question ID.",
        },
        { status: 400 }
      );
    }

    const question = await prisma.productQuestion.findFirst({
      where: {
        id: parsedQuestionId,
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
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    const authError = handleAuthError(error);

    if (authError) {
      return authError;
    }

    console.error("Get product question error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch question.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]/questions/[questionId]
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    // RBAC: questions.delete
    await requireAdminPermission("questions.delete");

    const { id, questionId } = await context.params;

    const productId = parseId(id);
    const parsedQuestionId = parseId(questionId);

    if (productId === null || parsedQuestionId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or question ID.",
        },
        { status: 400 }
      );
    }

    // Ensure the question belongs to this product.
    const question = await prisma.productQuestion.findFirst({
      where: {
        id: parsedQuestionId,
        productId,
      },
      select: {
        id: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    await prisma.productQuestion.delete({
      where: {
        id: parsedQuestionId,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    const authError = handleAuthError(error);

    if (authError) {
      return authError;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Question not found.",
          },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot delete this question because related records exist.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete product question error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete question.",
      },
      { status: 500 }
    );
  }
}
