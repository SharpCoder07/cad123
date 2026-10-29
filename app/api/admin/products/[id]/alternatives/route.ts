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

    const alternatives = await prisma.productAlternative.findMany({
      where: {
        productId,
      },
      include: {
        alternative: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            shortDescription: true,
            rating: true,
          },
        },
      },
      orderBy: {
        alternative: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({
      success: true,
      alternatives,
    });
  } catch (error) {
    console.error("Get product alternatives error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product alternatives.",
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
    const alternativeId = Number(body.alternativeId);

    if (!Number.isInteger(alternativeId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid alternative product ID.",
        },
        { status: 400 }
      );
    }

    if (productId === alternativeId) {
      return NextResponse.json(
        {
          success: false,
          message: "A product cannot be added as its own alternative.",
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

    const alternativeProduct = await prisma.product.findUnique({
      where: {
        id: alternativeId,
      },
    });

    if (!alternativeProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Alternative product not found.",
        },
        { status: 404 }
      );
    }

    const existing =
      await prisma.productAlternative.findUnique({
        where: {
          productId_alternativeId: {
            productId,
            alternativeId,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "This product is already assigned as an alternative.",
        },
        { status: 409 }
      );
    }

    const productAlternative =
      await prisma.productAlternative.create({
        data: {
          productId,
          alternativeId,
        },
        include: {
          alternative: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              shortDescription: true,
              rating: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        productAlternative,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product alternative error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product alternative.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const alternativeId = Number(body.alternativeId);

    if (!Number.isInteger(alternativeId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid alternative product ID.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.productAlternative.findUnique({
        where: {
          productId_alternativeId: {
            productId,
            alternativeId,
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Alternative product assignment not found.",
        },
        { status: 404 }
      );
    }

    await prisma.productAlternative.delete({
      where: {
        productId_alternativeId: {
          productId,
          alternativeId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product alternative removed successfully.",
    });
  } catch (error) {
    console.error("Delete product alternative error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove product alternative.",
      },
      { status: 500 }
    );
  }
}