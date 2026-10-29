import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";

import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
    questionId: string;
    answerId: string;
  }>;
};

type ParsedIds = {
  productId: number;
  questionId: number;
  answerId: number;
};

// Validate positive, safe integer IDs.
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

function parseRouteIds(params: {
  id: string;
  questionId: string;
  answerId: string;
}): ParsedIds | null {
  const productId = parseId(params.id);
  const questionId = parseId(params.questionId);
  const answerId = parseId(params.answerId);

  if (productId === null || questionId === null || answerId === null) {
    return null;
  }

  return {
    productId,
    questionId,
    answerId,
  };
}

function invalidIdResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid product, question, or answer ID.",
    },
    { status: 400 },
  );
}

function answerNotFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Answer not found.",
    },
    { status: 404 },
  );
}

function handleAuthError(error: unknown) {
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
        message: "You do not have permission to perform this action.",
      },
      { status: 403 },
    );
  }

  return null;
}

// GET /api/admin/products/[id]/questions/[questionId]/answers/[answerId]
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

    const params = await context.params;
    const ids = parseRouteIds(params);

    if (!ids) {
      return invalidIdResponse();
    }

    const answer = await prisma.productAnswer.findFirst({
      where: {
        id: ids.answerId,
        questionId: ids.questionId,
        question: {
          productId: ids.productId,
        },
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
    });

    if (!answer) {
      return answerNotFoundResponse();
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    const authError = handleAuthError(error);

    if (authError) {
      return authError;
    }

    console.error("Get product answer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch answer.",
      },
      { status: 500 },
    );
  }
}

// PUT /api/admin/products/[id]/questions/[questionId]/answers/[answerId]
export async function PUT(request: Request, context: RouteContext) {
  try {
    // RBAC: questions.answer
    await requireAdminPermission("questions.answer");

    const params = await context.params;
    const ids = parseRouteIds(params);

    if (!ids) {
      return invalidIdResponse();
    }

    // Validate JSON body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body.",
        },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;

    const answerText =
      typeof payload.answer === "string" ? payload.answer.trim() : "";

    if (!answerText) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer is required.",
        },
        { status: 400 },
      );
    }

    // Verify the answer belongs to the specified question and product.
    const existingAnswer = await prisma.productAnswer.findFirst({
      where: {
        id: ids.answerId,
        questionId: ids.questionId,
        question: {
          productId: ids.productId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingAnswer) {
      return answerNotFoundResponse();
    }

    const updatedAnswer = await prisma.productAnswer.update({
      where: {
        id: ids.answerId,
        questionId: ids.questionId,
        question: {
          productId: ids.productId,
        },
      },
      data: {
        answer: answerText,
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
    });

    return NextResponse.json({
      success: true,
      answer: updatedAnswer,
    });
  } catch (error) {
    const authError = handleAuthError(error);

    if (authError) {
      return authError;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return answerNotFoundResponse();
      }
    }

    console.error("Update product answer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update answer.",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/products/[id]/questions/[questionId]/answers/[answerId]
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    // RBAC: questions.delete
    await requireAdminPermission("questions.delete");

    const params = await context.params;
    const ids = parseRouteIds(params);

    if (!ids) {
      return invalidIdResponse();
    }

    // Verify the answer belongs to the specified question and product.
    const existingAnswer = await prisma.productAnswer.findFirst({
      where: {
        id: ids.answerId,
        questionId: ids.questionId,
        question: {
          productId: ids.productId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingAnswer) {
      return answerNotFoundResponse();
    }

    await prisma.productAnswer.delete({
      where: {
        id: ids.answerId,
        questionId: ids.questionId,
        question: {
          productId: ids.productId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Answer deleted successfully.",
    });
  } catch (error) {
    const authError = handleAuthError(error);

    if (authError) {
      return authError;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return answerNotFoundResponse();
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot delete this answer because related records exist.",
          },
          { status: 409 },
        );
      }
    }

    console.error("Delete product answer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete answer.",
      },
      { status: 500 },
    );
  }
}
