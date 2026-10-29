import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    faqId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id, faqId } = await context.params;

    const productId = Number(id);
    const parsedFaqId = Number(faqId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedFaqId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.findFirst({
      where: {
        id: parsedFaqId,
        productId,
      },
    });

    if (!faq) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error) {
    console.error("Get product FAQ error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch FAQ.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id, faqId } = await context.params;

    const productId = Number(id);
    const parsedFaqId = Number(faqId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedFaqId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const answer =
      typeof body.answer === "string"
        ? body.answer.trim()
        : "";

    const sortOrder =
      body.sortOrder === undefined ||
      body.sortOrder === null ||
      body.sortOrder === ""
        ? 0
        : Number(body.sortOrder);

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question is required.",
        },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(sortOrder)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a valid integer.",
        },
        { status: 400 }
      );
    }

    const existingFaq = await prisma.fAQ.findFirst({
      where: {
        id: parsedFaqId,
        productId,
      },
    });

    if (!existingFaq) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 }
      );
    }

    const updatedFaq = await prisma.fAQ.update({
      where: {
        id: parsedFaqId,
      },
      data: {
        question,
        answer,
        sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      faq: updatedFaq,
    });
  } catch (error) {
    console.error("Update product FAQ error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update FAQ.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id, faqId } = await context.params;

    const productId = Number(id);
    const parsedFaqId = Number(faqId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedFaqId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 }
      );
    }

    const existingFaq = await prisma.fAQ.findFirst({
      where: {
        id: parsedFaqId,
        productId,
      },
    });

    if (!existingFaq) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 }
      );
    }

    await prisma.fAQ.delete({
      where: {
        id: parsedFaqId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product FAQ error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete FAQ.",
      },
      { status: 500 }
    );
  }
}