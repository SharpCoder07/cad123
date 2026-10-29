import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireVendor();

    const specifications =
      await prisma.specification.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      specifications,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor specification library GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load specifications.",
      },
      { status: 500 },
    );
  }
}