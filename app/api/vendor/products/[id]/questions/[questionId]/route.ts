import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
};

function parseIds(id: string, questionId: string) {
  const productId = Number(id);
  const parsedQuestionId = Number(questionId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(parsedQuestionId) ||
    parsedQuestionId <= 0
  ) {
    return null;
  }

  return {
    productId,
    questionId: parsedQuestionId,
  };
}

async function getOwnedQuestion(
  productId: number,
  questionId: number,
  vendorId: number,
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!product) {
    return null;
  }

  const question = await prisma.productQuestion.findFirst({
    where: {
      id: questionId,
      productId: product.id,
    },
    select: {
      id: true,
      question: true,
      createdAt: true,
      productId: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      answers: {
        select: {
          id: true,
          answer: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              vendorId: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!question) {
    return null;
  }

  return {
    product,
    question,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { vendorId } = await requireVendor();

    const { id, questionId } = await params;

    const parsed = parseIds(id, questionId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or question ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedQuestion(
      parsed.productId,
      parsed.questionId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      vendorId,
      question: result.question,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor product question GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load question.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { vendorId } = await requireVendor();

    const { id, questionId } = await params;

    const parsed = parseIds(id, questionId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or question ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: parsed.productId,
        vendorId,
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

    const question = await prisma.productQuestion.findFirst({
      where: {
        id: parsed.questionId,
        productId: product.id,
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
        { status: 404 },
      );
    }

    /*
     * If ProductAnswer has onDelete: Cascade
     * for questionId, this single delete is enough.
     *
     * If your schema does not cascade, use the
     * transaction version shown below instead.
     */
    await prisma.productQuestion.delete({
      where: {
        id: question.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor product question DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete question.",
      },
      { status: 500 },
    );
  }
}
