import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

function parseIds(id: string, imageId: string) {
  const productId = Number(id);
  const parsedImageId = Number(imageId);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(parsedImageId) ||
    parsedImageId <= 0
  ) {
    return null;
  }

  return {
    productId,
    imageId: parsedImageId,
  };
}

async function getOwnedImage(
  productId: number,
  imageId: number,
  vendorId: number,
) {
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
    return null;
  }

  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
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
  });

  if (!image) {
    return null;
  }

  return {
    product,
    image,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, imageId } = await params;

    const parsed = parseIds(id, imageId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedImage(
      parsed.productId,
      parsed.imageId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Image not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      image: result.image,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product image GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load image.",
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

    const { id, imageId } = await params;

    const parsed = parseIds(id, imageId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedImage(
      parsed.productId,
      parsed.imageId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Image not found.",
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
        : "";

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

    const image = await prisma.productImage.update({
      where: {
        id: result.image.id,
      },

      data: {
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

    return NextResponse.json({
      success: true,
      message: "Image updated successfully.",
      image,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product image PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update image.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } = await requireVendor();

    const { id, imageId } = await params;

    const parsed = parseIds(id, imageId);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 },
      );
    }

    const result = await getOwnedImage(
      parsed.productId,
      parsed.imageId,
      vendorId,
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Image not found.",
        },
        { status: 404 },
      );
    }

    await prisma.productImage.delete({
      where: {
        id: result.image.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product image DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete image.",
      },
      { status: 500 },
    );
  }
}