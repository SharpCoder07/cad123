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

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId, userId } =
      await requireVendor();

    const { id, questionId } = await params;

    const productId = Number(id);
    const parsedQuestionId = Number(questionId);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(parsedQuestionId) ||
      parsedQuestionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product or question ID.",
        },
        { status: 400 },
      );
    }

    // Verify that the product belongs
    // to the logged-in vendor.
    const product =
      await prisma.product.findFirst({
        where: {
          id: productId,
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
          message:
            "Product not found or access denied.",
        },
        { status: 404 },
      );
    }

    // Verify that the question belongs
    // to this vendor-owned product.
    const question =
      await prisma.productQuestion.findFirst({
        where: {
          id: parsedQuestionId,
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

    // IMPORTANT:
    // userId comes from requireVendor().
    // Never accept userId/vendorId from browser.
    const createdAnswer =
      await prisma.productAnswer.create({
        data: {
          answer,
          questionId: question.id,
          userId,
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

    return NextResponse.json(
      {
        success: true,
        message: "Answer added successfully.",
        answer: createdAnswer,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor add answer error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add answer.",
      },
      { status: 500 },
    );
  }
}