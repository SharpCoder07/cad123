
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";

import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

// Handle authentication and permission errors.
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

// GET /api/admin/specifications
export async function GET() {
  try {
    // RBAC: specifications.view
    await requireAdminPermission("specifications.view");

    const specifications = await prisma.specification.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
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

    console.error("Get specifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch specifications.",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/specifications
export async function POST(request: Request) {
  try {
    // RBAC: specifications.create
    await requireAdminPermission("specifications.create");

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

    const existingSpecification =
      await prisma.specification.findUnique({
        where: {
          name,
        },
      });

    if (existingSpecification) {
      return NextResponse.json(
        {
          success: false,
          message: "A specification with this name already exists.",
        },
        { status: 409 }
      );
    }

    const specification = await prisma.specification.create({
      data: {
        name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        specification,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    // Handles duplicate names in concurrent requests.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A specification with this name already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Create specification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create specification.",
      },
      { status: 500 }
    );
  }
}
