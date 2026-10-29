import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    faqId: string;
  }>;
};

function parseIds(id: string, faqId: string) {
  const productId = Number(id);
  const parsedFaqId = Number(faqId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(parsedFaqId) ||
    parsedFaqId <= 0
  ) {
    return null;
  }

  return {
    productId,
    faqId: parsedFaqId,
  };
}

async function getOwnedFaq(
  productId: number,
  faqId: number,
  vendorId: number,
) {
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

  const faq = await prisma.fAQ.findFirst({
    where: {
      id: faqId,
      productId: product.id,
    },
    select: {
      id: true,
      question: true,
      answer: true,
      sortOrder: true,
      productId: true,
    },
  });

  if (!faq) {
    return null;
  }

  return {
    product,
    faq,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, faqId } = await params;
    const parsed = parseIds(id, faqId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedFaq(
      parsed.productId,
      parsed.faqId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      faq: result.faq,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product FAQ GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load FAQ.",
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

    const { id, faqId } = await params;
    const parsed = parseIds(id, faqId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedFaq(
      parsed.productId,
      parsed.faqId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
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

    const faq = await prisma.fAQ.update({
      where: {
        id: result.faq.id,
      },
      data: {
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

    return NextResponse.json({
      success: true,
      message: "FAQ updated successfully.",
      faq,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product FAQ PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update FAQ.",
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

    const { id, faqId } = await params;
    const parsed = parseIds(id, faqId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or FAQ ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedFaq(
      parsed.productId,
      parsed.faqId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "FAQ not found.",
        },
        { status: 404 },
      );
    }

    await prisma.fAQ.delete({
      where: {
        id: result.faq.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product FAQ DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete FAQ.",
      },
      { status: 500 },
    );
  }
}