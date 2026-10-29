
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export async function GET() {
  try {
    // Verify the user is an authenticated admin.
    const admin = await requireAdmin();

    // Allow category options for viewing, creating, or editing.
    const allowedPermissions = [
      "categories.view",
      "categories.create",
      "categories.edit",
    ];

    const hasPermission = allowedPermissions.some((permission) =>
      admin.permissions.includes(permission)
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access category options.",
        },
        { status: 403 }
      );
    }

    const categories = await prisma.category.findMany({
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
      categories,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access category options.",
        },
        { status: 403 }
      );
    }

    console.error("Category options error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories.",
      },
      { status: 500 }
    );
  }
}
