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

    const questions =
      await prisma.productQuestion.findMany({
        where: {
          productId: product.id,
        },

        select: {
          id: true,
          question: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          answers: {
            select: {
              id: true,
              answer: true,
              createdAt: true,

              user: {
  select: {
    id: true,
    name: true,
    email: true,
    vendorId: true,
  },
},
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
  success: true,
  vendorId,
  questions,
});
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor product questions GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load product questions.",
      },
      { status: 500 },
    );
  }
}