import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    // Ensures only an ACTIVE authenticated vendor can use this endpoint.
    await requireVendor();

    const [brands, categories] = await Promise.all([
      prisma.brand.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      brands,
      categories,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor product options error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product options.",
      },
      {
        status: 500,
      },
    );
  }
}