import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    pricingId: string;
  }>;
};

function parseIds(
  id: string,
  pricingId: string,
) {
  const productId = Number(id);
  const planId = Number(pricingId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(planId) ||
    planId <= 0
  ) {
    return null;
  }

  return {
    productId,
    planId,
  };
}

/*
 * GET
 * Load one pricing plan.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, pricingId } = await params;

    const parsed = parseIds(id, pricingId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 },
      );
    }

    const { productId, planId } = parsed;

    /*
     * Verify the product belongs to the
     * authenticated vendor.
     */
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
      select: {
        id: true,
        name: true,
        status: true,
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

    /*
     * Pricing plan must belong to that product.
     */
    const pricingPlan =
      await prisma.pricingPlan.findFirst({
        where: {
          id: planId,
          productId: product.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          billing: true,
        },
      });

    if (!pricingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      pricingPlan,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor pricing GET single error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load pricing plan.",
      },
      { status: 500 },
    );
  }
}

/*
 * PUT
 * Update one pricing plan.
 */
export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, pricingId } = await params;

    const parsed = parseIds(id, pricingId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 },
      );
    }

    const { productId, planId } = parsed;

    /*
     * Verify product ownership.
     */
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
      select: {
        id: true,
        status: true,
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

    /*
     * Verify pricing plan belongs to
     * this exact product.
     */
    const existingPlan =
      await prisma.pricingPlan.findFirst({
        where: {
          id: planId,
          productId: product.id,
        },
        select: {
          id: true,
        },
      });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const {
      name,
      price,
      billing,
      description,
    } = body;

    const normalizedName =
      typeof name === "string"
        ? name.trim()
        : "";

    const normalizedBilling =
      typeof billing === "string"
        ? billing.trim()
        : "";

    const normalizedDescription =
      typeof description === "string"
        ? description.trim()
        : "";

    if (!normalizedName) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
        },
        { status: 400 },
      );
    }

    let normalizedPrice: number | null = null;

    if (
      price !== "" &&
      price !== null &&
      price !== undefined
    ) {
      normalizedPrice = Number(price);

      if (
        !Number.isFinite(normalizedPrice) ||
        normalizedPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Price must be a valid non-negative number.",
          },
          { status: 400 },
        );
      }
    }

    const allowedBillingCycles = [
      "Monthly",
      "Yearly",
      "One-time",
    ];

    if (
      normalizedBilling &&
      !allowedBillingCycles.includes(
        normalizedBilling,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid billing cycle.",
        },
        { status: 400 },
      );
    }

    const pricingPlan =
      await prisma.pricingPlan.update({
        where: {
          id: existingPlan.id,
        },
        data: {
          name: normalizedName,
          price: normalizedPrice,
          billing:
            normalizedBilling || null,
          description:
            normalizedDescription || null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          billing: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Pricing plan updated successfully.",
      pricingPlan,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor pricing PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update pricing plan.",
      },
      { status: 500 },
    );
  }
}

/*
 * DELETE
 */
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, pricingId } = await params;

    const parsed = parseIds(id, pricingId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or pricing plan ID.",
        },
        { status: 400 },
      );
    }

    const { productId, planId } = parsed;

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

    const pricingPlan =
      await prisma.pricingPlan.findFirst({
        where: {
          id: planId,
          productId: product.id,
        },
        select: {
          id: true,
        },
      });

    if (!pricingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pricing plan not found.",
        },
        { status: 404 },
      );
    }

    await prisma.pricingPlan.delete({
      where: {
        id: pricingPlan.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Pricing plan deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor pricing DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete pricing plan.",
      },
      { status: 500 },
    );
  }
}