import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        products: [],
        brands: [],
        categories: [],
      });
    }

    const [products, brands, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "PUBLISHED",

          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              shortDescription: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              brand: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              category: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          ],
        },

        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          rating: true,

          brand: {
            select: {
              name: true,
            },
          },

          category: {
            select: {
              name: true,
            },
          },

          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
            select: {
              url: true,
              altText: true,
            },
          },
        },

        orderBy: [
          {
            rating: "desc",
          },
          {
            reviewCount: "desc",
          },
        ],

        take: 5,
      }),

      prisma.brand.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },

        orderBy: {
          name: "asc",
        },

        take: 3,
      }),

      prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          name: true,
          slug: true,
        },

        orderBy: {
          name: "asc",
        },

        take: 3,
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      brands,
      categories,
    });
  } catch (error) {
    console.error("Public search failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search software.",
      },
      {
        status: 500,
      },
    );
  }
}
