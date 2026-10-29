import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
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
     * SECURITY:
     * Product must belong to the authenticated vendor.
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
        brandId: true,
        categoryId: true,
        shortDescription: true,
        description: true,
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
     * Only these workflow transitions are allowed:
     *
     * DRAFT -> SUBMITTED
     * CHANGES_REQUESTED -> SUBMITTED
     */
    if (product.status !== "DRAFT" && product.status !== "CHANGES_REQUESTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            product.status === "SUBMITTED"
              ? "This product has already been submitted for review."
              : "Published products cannot be submitted again.",
        },
        { status: 409 },
      );
    }

    /*
     * Basic completeness check before submission.
     *
     * We can make this stricter later when pricing,
     * images, features, etc. are implemented.
     */
    if (!product.name.trim() || !product.brandId || !product.categoryId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Complete the required product information before submitting.",
        },
        { status: 400 },
      );
    }

    const result = await prisma.product.updateMany({
      where: {
        id: product.id,
        vendorId,
        status: {
          in: ["DRAFT", "CHANGES_REQUESTED"],
        },
      },

      data: {
        status: "SUBMITTED",
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The product status changed. Refresh the page and try again.",
        },
        { status: 409 },
      );
    }

    const updatedProduct = await prisma.product.findFirst({
      where: {
        id: product.id,
        vendorId,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product submitted for review.",
      product: updatedProduct,
    });

    return NextResponse.json({
      success: true,
      message: "Product submitted for review.",
      product: updatedProduct,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor product submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit product for review.",
      },
      { status: 500 },
    );
  }
}
