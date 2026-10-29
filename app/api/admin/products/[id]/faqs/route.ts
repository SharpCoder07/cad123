import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    const faqs = await prisma.fAQ.findMany({
      where: {
        productId,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error("Get product FAQs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product FAQs.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
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

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    const faq = await prisma.fAQ.create({
      data: {
        productId,
        question,
        answer,
        sortOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        faq,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product FAQ error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product FAQ.",
      },
      { status: 500 }
    );
  }
}