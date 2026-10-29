import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    const { vendorId } = await requireVendor();

    const questions =
      await prisma.productQuestion.findMany({
        where: {
          product: {
            vendorId,
          },
        },

        select: {
          id: true,
          question: true,
          createdAt: true,
          productId: true,

          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

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
      "Vendor global questions GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load questions.",
      },
      { status: 500 },
    );
  }
}