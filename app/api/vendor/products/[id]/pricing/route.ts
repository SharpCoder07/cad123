import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
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
        name: true,
        status: true,

        pricingPlans: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billing: true,
          },

          orderBy: {
            id: "asc",
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
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor pricing GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load pricing plans.",
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
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

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

    const body = await request.json();

    const {
      name,
      price,
      billingCycle,
      description,
    } = body;

    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    const normalizedBillingCycle =
      typeof billingCycle === "string"
        ? billingCycle.trim()
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

    /*
     * Empty price is allowed.
     * Otherwise it must be a valid non-negative number.
     */
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
      normalizedBillingCycle &&
      !allowedBillingCycles.includes(
        normalizedBillingCycle,
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
      await prisma.pricingPlan.create({
        data: {
          name: normalizedName,
          price: normalizedPrice,

          /*
           * Your PricingPlan model uses "billing",
           * while the form sends "billingCycle".
           */
          billing:
            normalizedBillingCycle || null,

          description:
            normalizedDescription || null,

          productId: product.id,
        },

        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          billing: true,
          productId: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Pricing plan created successfully.",
        pricingPlan,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor pricing POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create pricing plan.",
      },
      { status: 500 },
    );
  }
}