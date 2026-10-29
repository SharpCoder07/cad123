import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export async function GET() {
  try {
    // Verify that the current user is an authenticated admin.
    const admin = await requireAdmin();

    // Allow access when the admin has at least one relevant permission.
    const allowedPermissions = [
      "products.view",
      "products.create",
      "products.edit",
      "brands.view",
      "categories.view",
    ];

    const hasPermission = allowedPermissions.some((permission) =>
      admin.permissions.includes(permission)
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to view product options.",
        },
        { status: 403 }
      );
    }

    // Fetch brand and category options.
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
      brands,
      categories,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    console.error("Product options error:", error);

    return NextResponse.json(
      {
        message: "Failed to load product options",
      },
      { status: 500 }
    );
  }
}