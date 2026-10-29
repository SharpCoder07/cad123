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

    /*
     * Never load images until product ownership
     * has been verified.
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

    const images = await prisma.productImage.findMany({
      where: {
        productId: product.id,
      },

      select: {
        id: true,
        url: true,
        altText: true,
        type: true,
        sortOrder: true,
        productId: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product images GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load product images.",
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
     * Verify that the product belongs to
     * the authenticated vendor.
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

    const url =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    const altText =
      typeof body.altText === "string"
        ? body.altText.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim().toLowerCase()
        : "gallery";

    const sortOrder = Number(body.sortOrder);

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          message: "Image URL is required.",
        },
        { status: 400 },
      );
    }

    /*
     * Validate URL server-side as well.
     */
    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        throw new Error("Unsupported protocol");
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid image URL.",
        },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "gallery",
      "hero",
      "thumbnail",
      "logo",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image type.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sort order must be a non-negative integer.",
        },
        { status: 400 },
      );
    }

    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        altText: altText || null,
        type,
        sortOrder,
      },

      select: {
        id: true,
        url: true,
        altText: true,
        type: true,
        sortOrder: true,
        productId: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Image added successfully.",
        image,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product image POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add image.",
      },
      { status: 500 },
    );
  }
}