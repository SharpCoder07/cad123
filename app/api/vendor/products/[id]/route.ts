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

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return productId;
}

/*
|--------------------------------------------------------------------------
| GET vendor product
|--------------------------------------------------------------------------
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
        {
          status: 400,
        },
      );
    }

    /*
     * SECURITY:
     * We deliberately use findFirst with BOTH id and vendorId.
     *
     * Knowing another product's ID is not enough to access it.
     */
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
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
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        {
          status: 404,
        },
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

    console.error("Vendor product GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE vendor product
|--------------------------------------------------------------------------
*/
export async function PUT(
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
        {
          status: 400,
        },
      );
    }

    /*
     * Verify ownership BEFORE doing anything with the product.
     */
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },

      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        {
          status: 404,
        },
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
      brandId,
      categoryId,
    } = body;

    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    const normalizedSlug =
      typeof slug === "string"
        ? slug.trim().toLowerCase()
        : "";

    if (
      !normalizedName ||
      !normalizedSlug ||
      !brandId ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, slug, brand and category are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        normalizedSlug,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Slug can only contain lowercase letters, numbers and hyphens.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedBrandId = Number(brandId);
    const normalizedCategoryId = Number(categoryId);

    if (
      !Number.isInteger(normalizedBrandId) ||
      normalizedBrandId <= 0 ||
      !Number.isInteger(normalizedCategoryId) ||
      normalizedCategoryId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand or category.",
        },
        {
          status: 400,
        },
      );
    }

    const [duplicateSlug, brand, category] =
      await Promise.all([
        prisma.product.findFirst({
          where: {
            slug: normalizedSlug,
            id: {
              not: productId,
            },
          },

          select: {
            id: true,
          },
        }),

        prisma.brand.findUnique({
          where: {
            id: normalizedBrandId,
          },

          select: {
            id: true,
          },
        }),

        prisma.category.findUnique({
          where: {
            id: normalizedCategoryId,
          },

          select: {
            id: true,
          },
        }),
      ]);

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected brand does not exist.",
        },
        {
          status: 400,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category does not exist.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Important:
     *
     * vendorId is NOT accepted from the browser.
     * status is NOT accepted from the browser.
     *
     * The vendor can edit content, but cannot transfer ownership
     * or self-publish by modifying the PUT request.
     */
    const product = await prisma.product.update({
      where: {
        id: productId,
      },

      data: {
        name: normalizedName,
        slug: normalizedSlug,

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

        freeTrial:
          typeof freeTrial === "boolean"
            ? freeTrial
            : false,

        brandId: normalizedBrandId,
        categoryId: normalizedCategoryId,
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor product PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product.",
      },
      {
        status: 500,
      },
    );
  }
}