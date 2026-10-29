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
 * Load specifications assigned to this
 * vendor-owned product.
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

    const specifications =
      await prisma.productSpecification.findMany({
        where: {
          productId: product.id,
        },

        select: {
          id: true,
          value: true,
          specificationId: true,
          productId: true,

          specification: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          id: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      specifications,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product specifications GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load product specifications.",
      },
      { status: 500 },
    );
  }
}

/*
 * DELETE
 * Remove a specification from this product.
 *
 * The reusable Specification itself is
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

    /*
     * Verify ownership first.
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

    const specificationId = Number(
      body.specificationId,
    );

    if (
      !Number.isInteger(specificationId) ||
      specificationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 },
      );
    }

    /*
     * Verify the association belongs to this
     * exact vendor-owned product.
     */
    const productSpecification =
      await prisma.productSpecification.findFirst({
        where: {
          productId: product.id,
          specificationId,
        },

        select: {
          id: true,
        },
      });

    if (!productSpecification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Specification is not assigned to this product.",
        },
        { status: 404 },
      );
    }

    await prisma.productSpecification.delete({
      where: {
        id: productSpecification.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Specification removed successfully.",
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product specification DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to remove specification.",
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

    const specificationId = Number(
      body.specificationId,
    );

    const value =
      typeof body.value === "string"
        ? body.value.trim()
        : "";

    if (
      !Number.isInteger(specificationId) ||
      specificationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 },
      );
    }

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification value is required.",
        },
        { status: 400 },
      );
    }

    /*
     * Verify the reusable specification exists.
     */
    const specification =
      await prisma.specification.findUnique({
        where: {
          id: specificationId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!specification) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Prevent duplicate specification assignment.
     */
    const existing =
      await prisma.productSpecification.findFirst({
        where: {
          productId: product.id,
          specificationId: specification.id,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This specification is already assigned to the product.",
        },
        { status: 409 },
      );
    }

    const productSpecification =
      await prisma.productSpecification.create({
        data: {
          productId: product.id,
          specificationId: specification.id,
          value,
        },
        select: {
          id: true,
          productId: true,
          specificationId: true,
          value: true,

          specification: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Product specification added successfully.",
        specification: productSpecification,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product specification POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to add product specification.",
      },
      { status: 500 },
    );
  }
}