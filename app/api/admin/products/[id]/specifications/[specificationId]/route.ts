import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    specificationId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id, specificationId } = await context.params;

    const productId = Number(id);
    const parsedSpecificationId = Number(specificationId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedSpecificationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or specification ID.",
        },
        { status: 400 }
      );
    }

    const productSpecification =
      await prisma.productSpecification.findUnique({
        where: {
          productId_specificationId: {
            productId,
            specificationId: parsedSpecificationId,
          },
        },
        include: {
          specification: true,
        },
      });

    if (!productSpecification) {
      return NextResponse.json(
        {
          success: false,
          message: "Product specification not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      productSpecification,
    });
  } catch (error) {
    console.error("Get product specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product specification.",
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
    const { id, specificationId } = await context.params;

    const productId = Number(id);
    const parsedSpecificationId = Number(specificationId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedSpecificationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or specification ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const value =
      typeof body.value === "string" ? body.value.trim() : "";

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification value is required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.productSpecification.findUnique({
        where: {
          productId_specificationId: {
            productId,
            specificationId: parsedSpecificationId,
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Product specification not found.",
        },
        { status: 404 }
      );
    }

    const updated =
      await prisma.productSpecification.update({
        where: {
          productId_specificationId: {
            productId,
            specificationId: parsedSpecificationId,
          },
        },
        data: {
          value,
        },
        include: {
          specification: true,
        },
      });

    return NextResponse.json({
      success: true,
      productSpecification: updated,
    });
  } catch (error) {
    console.error("Update product specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product specification.",
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
    const { id, specificationId } = await context.params;

    const productId = Number(id);
    const parsedSpecificationId = Number(specificationId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(parsedSpecificationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or specification ID.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.productSpecification.findUnique({
        where: {
          productId_specificationId: {
            productId,
            specificationId: parsedSpecificationId,
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Product specification not found.",
        },
        { status: 404 }
      );
    }

    await prisma.productSpecification.delete({
      where: {
        productId_specificationId: {
          productId,
          specificationId: parsedSpecificationId,
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