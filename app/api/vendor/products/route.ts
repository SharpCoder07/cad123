import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    const { vendorId } = await requireVendor();

    const products = await prisma.product.findMany({
      where: {
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

      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { vendorId } = await requireVendor();

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

    const normalizedName = typeof name === "string" ? name.trim() : "";

    const normalizedSlug =
      typeof slug === "string" ? slug.trim().toLowerCase() : "";

    if (!normalizedName || !normalizedSlug || !brandId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, brand and category are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
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

    const [existingProduct, brand, category] = await Promise.all([
      prisma.product.findUnique({
        where: {
          slug: normalizedSlug,
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

    if (existingProduct) {
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

    const product = await prisma.product.create({
      data: {
        name: normalizedName,
        slug: normalizedSlug,

        shortDescription:
          typeof shortDescription === "string"
            ? shortDescription.trim() || null
            : null,

        description:
          typeof description === "string" ? description.trim() || null : null,

        website: typeof website === "string" ? website.trim() || null : null,

        pricing: typeof pricing === "string" ? pricing.trim() || null : null,

        freeTrial: typeof freeTrial === "boolean" ? freeTrial : false,

        brandId: normalizedBrandId,
        categoryId: normalizedCategoryId,

        /*
         * SECURITY:
         * Never accept either of these from request.body.
         */
        vendorId,
        status: "DRAFT",
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

    return NextResponse.json(
      {
        success: true,
        message: "Product draft created successfully.",
        product,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Create vendor product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product.",
      },
      {
        status: 500,
      },
    );
  }
}
