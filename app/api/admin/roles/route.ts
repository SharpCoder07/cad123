import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

function errorResponse(error: unknown) {
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

  console.error("Roles API error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    await requireAdminPermission("roles.view");

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission("roles.create");

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const name = typeof input.name === "string" ? input.name.trim() : "";

    const description =
      typeof input.description === "string" ? input.description.trim() : "";

    const permissionIds = input.permissionIds;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Role name is required." },
        { status: 400 },
      );
    }

    if (name.length > 100 || description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Role name or description is too long.",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(permissionIds) ||
      !permissionIds.every((id) => Number.isSafeInteger(id) && id > 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid permission IDs are required.",
        },
        { status: 400 },
      );
    }

    const uniqueIds = [...new Set(permissionIds as number[])];

    const existingPermissions = await prisma.permission.findMany({
      where: {
        id: { in: uniqueIds },
      },
      select: {
        id: true,
        key: true,
      },
    });

    if (existingPermissions.length !== uniqueIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more permissions are invalid.",
        },
        { status: 400 },
      );
    }

    const isSuperAdmin =
      admin.adminRole.isSystem && admin.adminRole.name === "Super Admin";

    if (!isSuperAdmin) {
      const allowedPermissions = new Set(admin.permissions);

      const hasUnauthorizedPermissions = existingPermissions.some(
        (permission) => !allowedPermissions.has(permission.key),
      );

      if (hasUnauthorizedPermissions) {
        return NextResponse.json(
          {
            success: false,
            message: "You cannot assign permissions that you do not have.",
          },
          { status: 403 },
        );
      }
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        isSystem: false,
        permissions: {
          create: uniqueIds.map((permissionId) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Role created successfully.",
        role,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A role with this name already exists.",
        },
        { status: 409 },
      );
    }

    return errorResponse(error);
  }
}
