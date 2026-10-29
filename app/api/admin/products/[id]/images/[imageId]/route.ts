
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

const ALLOWED_IMAGE_TYPES = [
  "gallery",
  "hero",
  "thumbnail",
  "logo",
];

function isValidImageUrl(value: string): boolean {
  if (/^\/uploads\/products\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(value)) {
    return true;
  }

  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function getLocalFilePath(imageUrl: string): string | null {
  const match = imageUrl.match(
    /^\/uploads\/products\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/
  );

  if (!match) return null;

  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "products",
    match[1]
  );
}

async function removeUnusedLocalImage(imageUrl: string) {
  const filePath = getLocalFilePath(imageUrl);

  if (!filePath) return;

  const referenceCount = await prisma.productImage.count({
    where: {
      url: imageUrl,
    },
  });

  if (referenceCount > 0) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    console.error("Local image cleanup error:", error);
  }
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        message: "Please log in to continue.",
      },
      { status: 401 }
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to manage product images.",
      },
      { status: 403 }
    );
  }

  return null;
}

function parseIds(id: string, imageId: string) {
  const productId = Number(id);
  const parsedImageId = Number(imageId);

  if (
    !Number.isSafeInteger(productId) ||
    productId <= 0 ||
    !Number.isSafeInteger(parsedImageId) ||
    parsedImageId <= 0
  ) {
    return null;
  }

  return {
    productId,
    parsedImageId,
  };
}

// GET - Fetch one product image
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();

    if (authError) return authError;

    const { id, imageId } = await context.params;
    const ids = parseIds(id, imageId);

    if (!ids) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 }
      );
    }

    const image = await prisma.productImage.findFirst({
      where: {
        id: ids.parsedImageId,
        productId: ids.productId,
      },
    });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "Product image not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error("Get product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product image.",
      },
      { status: 500 }
    );
  }
}

// PUT - Update product image
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();

    if (authError) return authError;

    const { id, imageId } = await context.params;
    const ids = parseIds(id, imageId);

    if (!ids) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 }
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
        : null;

    const type =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim()
        : "gallery";

    const sortOrder =
      body.sortOrder === undefined ||
      body.sortOrder === null ||
      body.sortOrder === ""
        ? 0
        : Number(body.sortOrder);

    if (!url || !isValidImageUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid image URL.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image type.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: ids.parsedImageId,
        productId: ids.productId,
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        {
          success: false,
          message: "Product image not found.",
        },
        { status: 404 }
      );
    }

    const oldImageUrl = existingImage.url;

    const updatedImage = await prisma.productImage.update({
      where: {
        id: ids.parsedImageId,
      },
      data: {
        url,
        altText: altText || null,
        type,
        sortOrder,
      },
    });

    // Remove the previous local file only when no image
    // record references it anymore.
    if (oldImageUrl !== url) {
      try {
        await removeUnusedLocalImage(oldImageUrl);
      } catch (error) {
        console.error("Image cleanup error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error) {
    console.error("Update product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product image.",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product image
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();

    if (authError) return authError;

    const { id, imageId } = await context.params;
    const ids = parseIds(id, imageId);

    if (!ids) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product or image ID.",
        },
        { status: 400 }
      );
    }

    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: ids.parsedImageId,
        productId: ids.productId,
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        {
          success: false,
          message: "Product image not found.",
        },
        { status: 404 }
      );
    }

    await prisma.productImage.delete({
      where: {
        id: ids.parsedImageId,
      },
    });

    // Clean up the associated local file if unused.
    try {
      await removeUnusedLocalImage(existingImage.url);
    } catch (error) {
      console.error("Image cleanup error:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Product image deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product image.",
      },
      { status: 500 }
    );
  }
}
