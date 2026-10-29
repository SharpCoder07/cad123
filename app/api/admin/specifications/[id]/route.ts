
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";

import { prisma } from "@/lib/prisma";

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

function getSpecificationId(id: string): number | null {
  const specificationId = Number(id);

  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(specificationId) ||
    specificationId <= 0
  ) {
    return null;
  }

  return specificationId;
}

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

// GET /api/admin/specifications/[id]
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    // Allow viewing a specification or loading it for editing.
    const admin = await requireAdmin();

    const canView = admin.permissions.includes(
      "specifications.view"
    );

    const canEdit = admin.permissions.includes(
      "specifications.edit"
    );

    if (!canView && !canEdit) {
      throw new ForbiddenError();
    }

    const { id } = await context.params;
    const specificationId = getSpecificationId(id);

    if (specificationId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 }
      );
    }

    const specification = await prisma.specification.findUnique({
      where: {
        id: specificationId,
      },
    });

    if (!specification) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      specification,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch specification.",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/specifications/[id]
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    // RBAC: specifications.edit
    await requireAdminPermission("specifications.edit");

    const { id } = await context.params;
    const specificationId = getSpecificationId(id);

    if (specificationId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 }
      );
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

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification name is required.",
        },
        { status: 400 }
      );
    }

    const specification = await prisma.specification.findUnique({
      where: {
        id: specificationId,
      },
    });

    if (!specification) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification not found.",
        },
        { status: 404 }
      );
    }

    const duplicate = await prisma.specification.findFirst({
      where: {
        name,
        NOT: {
          id: specificationId,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "A specification with this name already exists.",
        },
        { status: 409 }
      );
    }

    const updatedSpecification =
      await prisma.specification.update({
        where: {
          id: specificationId,
        },
        data: {
          name,
        },
      });

    return NextResponse.json({
      success: true,
      specification: updatedSpecification,
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
            message: "A specification with this name already exists.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Specification not found.",
          },
          { status: 404 }
        );
      }
    }

    console.error("Update specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update specification.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/specifications/[id]
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    // RBAC: specifications.delete
    await requireAdminPermission("specifications.delete");

    const { id } = await context.params;
    const specificationId = getSpecificationId(id);

    if (specificationId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid specification ID.",
        },
        { status: 400 }
      );
    }

    const specification = await prisma.specification.findUnique({
      where: {
        id: specificationId,
      },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    });

    if (!specification) {
      return NextResponse.json(
        {
          success: false,
          message: "Specification not found.",
        },
        { status: 404 }
      );
    }

    // Prevent deleting specifications that still have values.
    if (specification._count.values > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This specification has associated values and cannot be deleted. Remove the values first.",
        },
        { status: 409 }
      );
    }

    await prisma.specification.delete({
      where: {
        id: specificationId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Specification deleted successfully.",
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
        return NextResponse.json(
          {
            success: false,
            message: "Specification not found.",
          },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This specification is being used by other records and cannot be deleted.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete specification.",
      },
      { status: 500 }
    );
  }
}
