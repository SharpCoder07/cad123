
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";

import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// Shared authentication and authorization error handler.
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
        message:
          "You do not have permission to perform this action.",
      },
      { status: 403 }
    );
  }

  return null;
}

// Validate positive integer feature IDs.
function parseFeatureId(id: string): number | null {
  const featureId = Number(id);

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(featureId)
  ) {
    return null;
  }

  return featureId;
}

function invalidFeatureIdResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid feature ID.",
    },
    { status: 400 }
  );
}

function featureNotFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Feature not found.",
    },
    { status: 404 }
  );
}

// GET /api/admin/features/[id]
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // Admin must have view OR edit permission.
    const admin = await requireAdmin();

    const canAccessFeature =
      admin.permissions.includes("features.view") ||
      admin.permissions.includes("features.edit");

    if (!canAccessFeature) {
      throw new ForbiddenError();
    }

    const { id } = await params;
    const featureId = parseFeatureId(id);

    if (featureId === null) {
      return invalidFeatureIdResponse();
    }

    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
    });

    if (!feature) {
      return featureNotFoundResponse();
    }

    return NextResponse.json({
      success: true,
      feature,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch feature.",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/features/[id]
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    // RBAC: features.edit
    await requireAdminPermission("features.edit");

    const { id } = await params;
    const featureId = parseFeatureId(id);

    if (featureId === null) {
      return invalidFeatureIdResponse();
    }

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

    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
    });

    if (!feature) {
      return featureNotFoundResponse();
    }

    const existingFeature = await prisma.feature.findFirst({
      where: {
        name,
        NOT: {
          id: featureId,
        },
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

    const updatedFeature = await prisma.feature.update({
      where: {
        id: featureId,
      },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature updated successfully.",
      feature: updatedFeature,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "A feature with this name already exists.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return featureNotFoundResponse();
      }
    }

    console.error("Update feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update feature.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/features/[id]
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // RBAC: features.delete
    await requireAdminPermission("features.delete");

    const { id } = await params;
    const featureId = parseFeatureId(id);

    if (featureId === null) {
      return invalidFeatureIdResponse();
    }

    const feature = await prisma.feature.findUnique({
      where: {
        id: featureId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!feature) {
      return featureNotFoundResponse();
    }

    // Prevent deleting features assigned to products.
    if (feature._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This feature is assigned to products. Remove its product associations before deleting it.",
        },
        { status: 409 }
      );
    }

    await prisma.feature.delete({
      where: {
        id: featureId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully.",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2025") {
        return featureNotFoundResponse();
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This feature is referenced by other records and cannot be deleted.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete feature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete feature.",
      },
      { status: 500 }
    );
  }
}
