import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
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

    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const billing = String(body.billingCycle || "").trim();
    const description = String(body.description || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid price.",
        },
        { status: 400 }
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
        { status: 404 }
      );
    }

    const pricingPlan = await prisma.pricingPlan.create({
      data: {
        name,
        price,
        billing: billing || null,
        description: description || null,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pricing plan created successfully.",
      pricingPlan,
    });
  } catch (error) {
    console.error("Create pricing plan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create pricing plan.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
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
      select: {
        id: true,
        name: true,
        pricingPlans: {
          orderBy: {
            price: "asc",
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get pricing plans error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch pricing plans.",
      },
      { status: 500 }
    );
  }
}