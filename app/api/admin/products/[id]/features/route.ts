import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        features: {
          include: {
            feature: true,
          },
          orderBy: {
            feature: {
              name: "asc",
            },
          },
        },
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

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product features error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product features.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const featureId = Number(body.featureId);

    if (!Number.isInteger(featureId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feature ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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

    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
      select: {
        id: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        {
          success: false,
          message: "Feature not found.",
        },
        { status: 404 },
      );
    }

    const existingAssignment = await prisma.productFeature.findUnique({
      where: {
        productId_featureId: {
          productId,
          featureId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          message: "This feature is already assigned to the product.",
        },
        { status: 409 },
      );
    }

    const productFeature = await prisma.productFeature.create({
      data: {
        productId,
        featureId,
      },
      include: {
        feature: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature assigned successfully.",
      productFeature,
    });
  } catch (error) {
    console.error("Assign feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to assign feature.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const featureId = Number(body.featureId);

    if (!Number.isInteger(featureId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feature ID.",
        },
        { status: 400 },
      );
    }

    const productFeature = await prisma.productFeature.findUnique({
      where: {
        productId_featureId: {
          productId,
          featureId,
        },
      },
    });

    if (!productFeature) {
      return NextResponse.json(
        {
          success: false,
          message: "Feature is not assigned to this product.",
        },
        { status: 404 },
      );
    }

    await prisma.productFeature.delete({
      where: {
        productId_featureId: {
          productId,
          featureId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature removed successfully.",
    });
  } catch (error) {
    console.error("Remove feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove feature.",
      },
      { status: 500 },
    );
  }
}
