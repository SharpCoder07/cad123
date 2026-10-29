
import { NextResponse } from "next/server";
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

// POST /api/admin/products/[id]/questions/[questionId]/answers
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    // RBAC: Only admins with questions.answer can add answers.
    const admin = await requireAdminPermission("questions.answer");

    const { id, questionId } = await context.params;

    const productId = parseId(id);
    const parsedQuestionId = parseId(questionId);
    const userId = Number(admin.userId);

    if (
      productId === null ||
      parsedQuestionId === null ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product, question, or user ID.",
        },
        { status: 400 }
      );
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
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const answer =
      typeof payload.answer === "string"
        ? payload.answer.trim()
        : "";

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer is required.",
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

    // Create the answer using the authenticated admin's user ID.
    const createdAnswer = await prisma.productAnswer.create({
      data: {
        answer,
        userId,
        questionId: parsedQuestionId,
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

    return NextResponse.json(
      {
        success: true,
        answer: createdAnswer,
      },
      { status: 201 }
    );
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
          message: "You do not have permission to answer questions.",
        },
        { status: 403 }
      );
    }

    console.error("Create product answer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create answer.",
      },
      { status: 500 }
    );
  }
}
