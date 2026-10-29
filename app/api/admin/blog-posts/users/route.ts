
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdmin,
} from "@/lib/auth-guards";

export async function GET() {
  try {
    // RBAC: Verify authenticated admin.
    const admin = await requireAdmin();

    // Authors are needed by both create and edit forms.
    const canCreate = admin.permissions.includes(
      "blog_posts.create"
    );

    const canEdit = admin.permissions.includes(
      "blog_posts.edit"
    );

    // RBAC: Require at least one relevant permission.
    if (!canCreate && !canEdit) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access blog authors.",
        },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access blog authors.",
        },
        { status: 403 }
      );
    }

    console.error("Load blog authors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users.",
      },
      { status: 500 }
    );
  }
}
