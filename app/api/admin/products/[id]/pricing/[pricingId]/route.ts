import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
    pricingId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id, pricingId } = await params;

    const productId = Number(id);
    const planId = Number(pricingId);

    if (!Number.isInteger(productId) || !Number.isInteger(planId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 }
      );
    }

    const pricingPlan = await prisma.pricingPlan.findFirst({
      where: {
        id: planId,
        productId,
      },
    });

    if (!pricingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pricingPlan,
    });
  } catch (error) {
    console.error("Get pricing plan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch pricing plan.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id, pricingId } = await params;

    const productId = Number(id);
    const planId = Number(pricingId);

    if (!Number.isInteger(productId) || !Number.isInteger(planId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const billing = String(body.billing || "").trim();
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

    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        id: planId,
        productId,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 }
      );
    }

    const pricingPlan = await prisma.pricingPlan.update({
      where: {
        id: planId,
      },
      data: {
        name,
        price,
        billing: billing || null,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pricing plan updated successfully.",
      pricingPlan,
    });
  } catch (error) {
    console.error("Update pricing plan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update pricing plan.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id, pricingId } = await params;

    const productId = Number(id);
    const planId = Number(pricingId);

    if (!Number.isInteger(productId) || !Number.isInteger(planId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 }
      );
    }

    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        id: planId,
        productId,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 }
      );
    }

    await prisma.pricingPlan.delete({
      where: {
        id: planId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pricing plan deleted successfully.",
    });
  } catch (error) {
    console.error("Delete pricing plan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete pricing plan.",
      },
      { status: 500 }
    );
  }
}