import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    specificationId: string;
  }>;
};

function parseIds(
  id: string,
  specificationId: string,
) {
  const productId = Number(id);
  const specId = Number(specificationId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(specId) ||
    specId <= 0
  ) {
    return null;
  }

  return {
    productId,
    specificationId: specId,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, specificationId } = await params;

    const parsed = parseIds(
      id,
      specificationId,
    );

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product or specification ID.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: parsed.productId,
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

    const productSpecification =
      await prisma.productSpecification.findFirst({
        where: {
          productId: product.id,
          specificationId:
            parsed.specificationId,
        },

        select: {
          id: true,
          value: true,
          productId: true,
          specificationId: true,

          specification: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!productSpecification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product specification not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      productSpecification,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product specification GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load product specification.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, specificationId } = await params;

    const parsed = parseIds(
      id,
      specificationId,
    );

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product or specification ID.",
        },
        { status: 400 },
      );
    }

    /*
     * First verify the product belongs to the
     * authenticated vendor.
     */
    const product = await prisma.product.findFirst({
      where: {
        id: parsed.productId,
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

    /*
     * Then verify this exact specification
     * association belongs to that product.
     */
    const existing =
      await prisma.productSpecification.findFirst({
        where: {
          productId: product.id,
          specificationId:
            parsed.specificationId,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product specification not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const value =
      typeof body.value === "string"
        ? body.value.trim()
        : "";

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Specification value is required.",
        },
        { status: 400 },
      );
    }

    /*
     * Only the value can be changed.
     *
     * productId, specificationId and vendorId
     * are deliberately ignored from the request.
     */
    const productSpecification =
      await prisma.productSpecification.update({
        where: {
          id: existing.id,
        },

        data: {
          value,
        },

        select: {
          id: true,
          value: true,
          productId: true,
          specificationId: true,

          specification: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Product specification updated successfully.",
      productSpecification,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product specification PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update product specification.",
      },
      { status: 500 },
    );
  }
}