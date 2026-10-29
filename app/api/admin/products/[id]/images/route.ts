
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_IMAGE_TYPES = [
  "gallery",
  "hero",
  "thumbnail",
  "logo",
];

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

function parseProductId(id: string): number | null {
  const productId = Number(id);

  if (
    !Number.isSafeInteger(productId) ||
    productId <= 0
  ) {
    return null;
  }

  return productId;
}

function isValidImageUrl(value: string): boolean {
  // Accept locally uploaded product images.
  if (
    /^\/uploads\/products\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
      value
    )
  ) {
    return true;
  }

  // Accept external image URLs.
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

// GET - List product images
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();

    if (authError) return authError;

    const { id } = await context.params;
    const productId = parseProductId(id);

    if (productId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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
        { status: 404 }
      );
    }

    const images = await prisma.productImage.findMany({
      where: {
        productId,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Get product images error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product images.",
      },
      { status: 500 }
    );
  }
}

// POST - Add product image
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();

    if (authError) return authError;

    const { id } = await context.params;
    const productId = parseProductId(id);

    if (productId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const url =
      typeof payload.url === "string"
        ? payload.url.trim()
        : "";

    const altText =
      typeof payload.altText === "string"
        ? payload.altText.trim()
        : null;

    const type =
      typeof payload.type === "string" &&
      payload.type.trim()
        ? payload.type.trim()
        : "gallery";

    const sortOrder =
      payload.sortOrder === undefined ||
      payload.sortOrder === null ||
      payload.sortOrder === ""
        ? 0
        : Number(payload.sortOrder);

    // Validate image URL.
    if (!url || !isValidImageUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid image URL.",
        },
        { status: 400 }
      );
    }

    // Validate image type.
    if (!ALLOWED_IMAGE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image type.",
        },
        { status: 400 }
      );
    }

    // Validate sort order.
    if (
      !Number.isSafeInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sort order must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    // Check whether product exists.
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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
        { status: 404 }
      );
    }

    // Create product image record.
    const image = await prisma.productImage.create({
      data: {
        productId,
        url,
        altText: altText || null,
        type,
        sortOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        image,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product image.",
      },
      { status: 500 }
    );
  }
}
