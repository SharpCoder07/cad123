import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validStatuses = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "PUBLISHED",
] as const;

type ProductStatus = (typeof validStatuses)[number];

function handleError(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action.",
      },
      { status: 403 },
    );
  }

  console.error(fallbackMessage, error);

  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
    },
    { status: 500 },
  );
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

// GET: View a single product
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    // RBAC: View permission required
    await requireAdminPermission("products.view");

    const { id } = await context.params;
    const productId = parseProductId(id);

    if (productId === null) {
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
    deletedAt: null,
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
    return handleError(error, "Failed to load product.");
  }
}

// PUT: Update a product
export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    // RBAC: Edit permission required
    const admin = await requireAdminPermission("products.edit");

    const { id } = await context.params;
    const productId = parseProductId(id);

    if (productId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const {
  name,
  slug,
  shortDescription,
  description,
  website,
  pricing,
  freeTrial,
  isFeatured,
  brandId,
  categoryId,
  vendorId,
  status,
} = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !brandId ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, brand and category are required.",
        },
        { status: 400 },
      );
    }

    const numericBrandId = Number(brandId);
    const numericCategoryId = Number(categoryId);

    if (
      !Number.isSafeInteger(numericBrandId) ||
      numericBrandId <= 0 ||
      !Number.isSafeInteger(numericCategoryId) ||
      numericCategoryId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand or category.",
        },
        { status: 400 },
      );
    }

    if (
      !validStatuses.includes(status as ProductStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product status.",
        },
        { status: 400 },
      );
    }

    let normalizedVendorId: number | null = null;

    if (
      vendorId !== null &&
      vendorId !== undefined &&
      vendorId !== ""
    ) {
      normalizedVendorId = Number(vendorId);

      if (
        !Number.isSafeInteger(normalizedVendorId) ||
        normalizedVendorId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid vendor.",
          },
          { status: 400 },
        );
      }
    }

    const currentProduct = await prisma.product.findFirst({
  where: {
    id: productId,
    deletedAt: null,
  },
  select: {
    id: true,
    status: true,
  },
});

    if (!currentProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    // RBAC: Publishing a product requires approval permission.
    // An admin with products.edit alone cannot publish it.
    if (
      status === "PUBLISHED" &&
      currentProduct.status !== "PUBLISHED" &&
      !admin.permissions.includes("products.approve")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to approve or publish products.",
        },
        { status: 403 },
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: slug.trim(),
        NOT: {
          id: productId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const [brand, category, vendor] = await Promise.all([
      prisma.brand.findUnique({
        where: {
          id: numericBrandId,
        },
        select: {
          id: true,
        },
      }),

      prisma.category.findUnique({
        where: {
          id: numericCategoryId,
        },
        select: {
          id: true,
        },
      }),

      normalizedVendorId
        ? prisma.vendor.findUnique({
            where: {
              id: normalizedVendorId,
            },
            select: {
              id: true,
              name: true,
              status: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected brand does not exist.",
        },
        { status: 400 },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category does not exist.",
        },
        { status: 400 },
      );
    }

    if (normalizedVendorId && !vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected vendor does not exist.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: name.trim(),
        slug: slug.trim(),

        shortDescription:
          typeof shortDescription === "string"
            ? shortDescription.trim() || null
            : null,

        description:
          typeof description === "string"
            ? description.trim() || null
            : null,

        website:
          typeof website === "string"
            ? website.trim() || null
            : null,

        pricing:
          typeof pricing === "string"
            ? pricing.trim() || null
            : null,

        freeTrial: Boolean(freeTrial),
        ...(isFeatured !== undefined
  ? { isFeatured: isFeatured === true }
  : {}),

        brandId: numericBrandId,
        categoryId: numericCategoryId,
        vendorId: normalizedVendorId,
        status: status as ProductStatus,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    return handleError(error, "Failed to update product.");
  }
}

// DELETE: Delete a product
export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    // RBAC: Delete permission required
    await requireAdminPermission("products.delete");

    const { id } = await context.params;
    const productId = parseProductId(id);

    if (productId === null) {
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
    deletedAt: null,
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

    await prisma.product.update({
  where: {
    id: productId,
  },
  data: {
    deletedAt: new Date(),
  },
});

    return NextResponse.json({
      success: true,
      message: "Product moved to Removed Products successfully.",
    });
  } catch (error) {
    return handleError(error, "Failed to delete product.");
  }
}