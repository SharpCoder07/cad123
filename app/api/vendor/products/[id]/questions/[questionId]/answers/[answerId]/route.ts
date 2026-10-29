import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    questionId: string;
    answerId: string;
  }>;
};

function parseIds(
  id: string,
  questionId: string,
  answerId: string,
) {
  const productId = Number(id);
  const parsedQuestionId = Number(questionId);
  const parsedAnswerId = Number(answerId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(parsedQuestionId) ||
    parsedQuestionId <= 0 ||
    !Number.isInteger(parsedAnswerId) ||
    parsedAnswerId <= 0
  ) {
    return null;
  }

  return {
    productId,
    questionId: parsedQuestionId,
    answerId: parsedAnswerId,
  };
}

async function getOwnedAnswer(
  productId: number,
  questionId: number,
  answerId: number,
  vendorId: number,
) {
  /*
   * 1. Product must belong to vendor.
   */
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return null;
  }

  /*
   * 2. Question must belong to product.
   */
  const question =
    await prisma.productQuestion.findFirst({
      where: {
        id: questionId,
        productId: product.id,
      },
      select: {
        id: true,
        question: true,
      },
    });

  if (!question) {
    return null;
  }

  /*
   * 3. Answer must belong to question.
   *
   * 4. Answer author must belong to the same
   *    vendor before the vendor can modify it.
   */
  const answer =
    await prisma.productAnswer.findFirst({
      where: {
        id: answerId,
        questionId: question.id,

        user: {
          vendorId,
        },
      },

      select: {
        id: true,
        answer: true,
        createdAt: true,
        questionId: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorId: true,
          },
        },
      },
    });

  if (!answer) {
    return null;
  }

  return {
    product,
    question,
    answer,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const {
      id,
      questionId,
      answerId,
    } = await params;

    const parsed = parseIds(
      id,
      questionId,
      answerId,
    );

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product, question or answer ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedAnswer(
      parsed.productId,
      parsed.questionId,
      parsed.answerId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Answer not found or you do not have permission to edit it.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      answer: result.answer,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor answer GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load answer.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const {
      id,
      questionId,
      answerId,
    } = await params;

    const parsed = parseIds(
      id,
      questionId,
      answerId,
    );

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product, question or answer ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedAnswer(
      parsed.productId,
      parsed.questionId,
      parsed.answerId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Answer not found or you do not have permission to edit it.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const answer =
      typeof body.answer === "string"
        ? body.answer.trim()
        : "";

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer is required.",
        },
        { status: 400 },
      );
    }

    const updatedAnswer =
      await prisma.productAnswer.update({
        where: {
          id: result.answer.id,
        },

        data: {
          answer,
        },

        select: {
          id: true,
          answer: true,
          createdAt: true,
          questionId: true,

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
      message: "Answer updated successfully.",
      answer: updatedAnswer,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor answer PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update answer.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const {
      id,
      questionId,
      answerId,
    } = await params;

    const parsed = parseIds(
      id,
      questionId,
      answerId,
    );

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product, question or answer ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedAnswer(
      parsed.productId,
      parsed.questionId,
      parsed.answerId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Answer not found or you do not have permission to delete it.",
        },
        { status: 404 },
      );
    }

    await prisma.productAnswer.delete({
      where: {
        id: result.answer.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Answer deleted successfully.",
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor answer DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete answer.",
      },
      { status: 500 },
    );
  }
}