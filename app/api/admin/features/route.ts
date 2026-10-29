
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";

import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

// Handle authentication and authorization errors.
function handleAuthError(error: unknown) {
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
        message: "You do not have permission to perform this action.",
      },
      { status: 403 }
    );
  }

  return null;
}

// GET /api/admin/features
export async function GET() {
  try {
    // RBAC: features.view
    await requireAdminPermission("features.view");

    const features = await prisma.feature.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      features,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get features error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch features.",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/features
export async function POST(request: Request) {
  try {
    // RBAC: features.create
    await requireAdminPermission("features.create");

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const name =
      typeof payload.name === "string"
        ? payload.name.trim()
        : "";

    const description =
      typeof payload.description === "string"
        ? payload.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Feature name is required.",
        },
        { status: 400 }
      );
    }

    const existingFeature = await prisma.feature.findUnique({
      where: {
        name,
      },
    });

    if (existingFeature) {
      return NextResponse.json(
        {
          success: false,
          message: "A feature with this name already exists.",
        },
        { status: 409 }
      );
    }

    const feature = await prisma.feature.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature created successfully.",
      feature,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    // Handles concurrent requests that create the same feature.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A feature with this name already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Create feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create feature.",
      },
      { status: 500 }
    );
  }
}
