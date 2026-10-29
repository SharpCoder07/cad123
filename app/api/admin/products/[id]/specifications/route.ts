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

    const specifications =
      await prisma.productSpecification.findMany({
        where: {
          productId,
        },
        include: {
          specification: true,
        },
        orderBy: {
          specification: {
            name: "asc",
          },
        },
      });

    return NextResponse.json({
      success: true,
      specifications,
    });
  } catch (error) {
    console.error("Get product specifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product specifications.",
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

    const specificationId = Number(body.specificationId);
    const value =
      typeof body.value === "string" ? body.value.trim() : "";

    if (!Number.isInteger(specificationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 }
      );
    }

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification value is required.",
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

    const specification =
      await prisma.specification.findUnique({
        where: {
          id: specificationId,
        },
      });

    if (!specification) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification not found.",
        },
        { status: 404 }
      );
    }

    const existing =
      await prisma.productSpecification.findUnique({
        where: {
          productId_specificationId: {
            productId,
            specificationId,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "This specification is already assigned to the product.",
        },
        { status: 409 }
      );
    }

    const productSpecification =
      await prisma.productSpecification.create({
        data: {
          productId,
          specificationId,
          value,
        },
        include: {
          specification: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        productSpecification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product specification.",
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
    const specificationId = Number(body.specificationId);

    if (!Number.isInteger(specificationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 }
      );
    }

    const productSpecification =
      await prisma.productSpecification.findUnique({
        where: {
          productId_specificationId: {
            productId,
            specificationId,
          },
        },
      });

    if (!productSpecification) {
      return NextResponse.json(
        {
          success: false,
          message: "Product specification assignment not found.",
        },
        { status: 404 }
      );
    }

    await prisma.productSpecification.delete({
      where: {
        productId_specificationId: {
          productId,
          specificationId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product specification removed successfully.",
    });
  } catch (error) {
    console.error("Delete product specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove product specification.",
      },
      { status: 500 }
    );
  }
}