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

/*
 * GET
 * Load features assigned to the vendor's product.
 */
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
        name: true,
        status: true,

        features: {
          select: {
            id: true,

            feature: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
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
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product features GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load product features.",
      },
      { status: 500 },
    );
  }
}

/*
 * DELETE
 * Remove an existing feature association
 * from the vendor's product.
 *
 * The reusable Feature record itself is
 * NOT deleted.
 */
export async function DELETE(
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

    const featureId = Number(body.featureId);

    if (
      !Number.isInteger(featureId) ||
      featureId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feature ID.",
        },
        { status: 400 },
      );
    }

    /*
     * Verify this feature is actually assigned
     * to this vendor-owned product.
     */
    const productFeature =
      await prisma.productFeature.findFirst({
        where: {
          productId: product.id,
          featureId,
        },

        select: {
          id: true,
        },
      });

    if (!productFeature) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Feature is not assigned to this product.",
        },
        { status: 404 },
      );
    }

    await prisma.productFeature.delete({
      where: {
        id: productFeature.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Feature removed successfully.",
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product feature DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove feature.",
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

    /*
     * Product must belong to the authenticated vendor.
     */
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

    const featureId = Number(body.featureId);

    if (
      !Number.isInteger(featureId) ||
      featureId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feature ID.",
        },
        { status: 400 },
      );
    }

    /*
     * The selected reusable Feature must actually exist.
     */
    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
      select: {
        id: true,
        name: true,
        description: true,
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

    /*
     * Prevent duplicate assignment.
     */
    const existingAssignment =
      await prisma.productFeature.findFirst({
        where: {
          productId: product.id,
          featureId: feature.id,
        },
        select: {
          id: true,
        },
      });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This feature is already assigned to the product.",
        },
        { status: 409 },
      );
    }

    const productFeature =
      await prisma.productFeature.create({
        data: {
          productId: product.id,
          featureId: feature.id,
        },
        select: {
          id: true,
          feature: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Feature assigned successfully.",
        productFeature,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product feature POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to assign feature.",
      },
      { status: 500 },
    );
  }
}