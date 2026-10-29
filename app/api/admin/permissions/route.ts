
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export async function GET() {
  try {
    await requireAdminPermission("roles.view");

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: "asc" },
        { action: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 },
      );
    }

    console.error("Permissions API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch permissions.",
      },
      { status: 500 },
    );
  }
}
