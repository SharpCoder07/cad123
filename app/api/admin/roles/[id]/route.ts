import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  console.error("Role detail API error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error." },
    { status: 500 },
  );
}

function parseId(value: string) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminPermission("roles.view");

    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid role ID." },
        { status: 400 },
      );
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      role,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminPermission("roles.edit");

    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid role ID." },
        { status: 400 },
      );
    }

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
      !permissionIds.every((value) => Number.isSafeInteger(value) && value > 0)
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

    const result = await prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: { id },
        select: { id: true, isSystem: true },
      });

      if (!existingRole) {
        return { status: "not_found" as const };
      }

      if (existingRole.isSystem) {
        return { status: "protected" as const };
      }

      const validPermissions = await tx.permission.findMany({
        where: {
          id: { in: uniqueIds },
        },
        select: {
          id: true,
          key: true,
        },
      });

      if (validPermissions.length !== uniqueIds.length) {
        return { status: "invalid_permissions" as const };
      }

      const isSuperAdmin =
        admin.adminRole.isSystem && admin.adminRole.name === "Super Admin";

      if (!isSuperAdmin) {
        const allowedPermissions = new Set(admin.permissions);

        const hasUnauthorizedPermissions = validPermissions.some(
          (permission) => !allowedPermissions.has(permission.key),
        );

        if (hasUnauthorizedPermissions) {
          return { status: "forbidden_permissions" as const };
        }
      }

      const role = await tx.role.update({
        where: { id },
        data: {
          name,
          description: description || null,
          permissions: {
            deleteMany: {},
            create: uniqueIds.map((permissionId) => ({
              permission: {
                connect: { id: permissionId },
              },
            })),
          },
        },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      return { status: "ok" as const, role };
    });

    if (result.status === "not_found") {
      return NextResponse.json(
        { success: false, message: "Role not found." },
        { status: 404 },
      );
    }

    if (result.status === "protected") {
      return NextResponse.json(
        {
          success: false,
          message: "System roles cannot be modified.",
        },
        { status: 403 },
      );
    }

    if (result.status === "invalid_permissions") {
      return NextResponse.json(
        {
          success: false,
          message: "One or more permissions are invalid.",
        },
        { status: 400 },
      );
    }

    if (result.status === "forbidden_permissions") {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot assign permissions that you do not have.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully.",
      role: result.role,
    });
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

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminPermission("roles.delete");

    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid role ID." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id },
        select: {
          id: true,
          isSystem: true,
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role) {
        return "not_found" as const;
      }

      if (role.isSystem) {
        return "protected" as const;
      }

      if (role._count.users > 0) {
        return "assigned" as const;
      }

      await tx.role.delete({ where: { id } });

      return "deleted" as const;
    });

    if (result === "not_found") {
      return NextResponse.json(
        { success: false, message: "Role not found." },
        { status: 404 },
      );
    }

    if (result === "protected") {
      return NextResponse.json(
        {
          success: false,
          message: "System roles cannot be deleted.",
        },
        { status: 403 },
      );
    }

    if (result === "assigned") {
      return NextResponse.json(
        {
          success: false,
          message: "Reassign users before deleting this role.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
