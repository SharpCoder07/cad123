import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseProductId(id: string) {
  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    return null;
  }

  return productId;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id } = await params;
    const productId = parseProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    const faqs = await prisma.fAQ.findMany({
      where: {
        productId: product.id,
      },

      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        productId: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product FAQs GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load FAQs.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id } = await params;
    const productId = parseProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    // Product ownership must be established server-side.
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
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
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

    const sortOrder = Number(body.sortOrder);

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question is required.",
        },
        { status: 400 },
      );
    }

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer is required.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sort order must be a non-negative integer.",
        },
        { status: 400 },
      );
    }

    const faq = await prisma.fAQ.create({
      data: {
        productId: product.id,
        question,
        answer,
        sortOrder,
      },

      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        productId: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "FAQ created successfully.",
        faq,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product FAQ POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create FAQ.",
      },
      { status: 500 },
    );
  }
}