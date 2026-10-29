import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import bcrypt from "bcryptjs";
import { Prisma } from "@/prisma/generated/client";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

function handleError(error: unknown) {
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

  console.error("Admin users API error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Internal server error.",
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    await requireAdminPermission("users.view");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRoleId: true,
        adminRole: {
          select: {
            id: true,
            name: true,
            isSystem: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    return handleError(error);
  }
}


export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission("users.create");

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const allowedFields = new Set([
      "name",
      "email",
      "password",
      "role",
      "adminRoleId",
    ]);

    if (Object.keys(input).some((key) => !allowedFields.has(key))) {
      return NextResponse.json(
        { success: false, message: "Unsupported user fields." },
        { status: 400 },
      );
    }

    const name =
      typeof input.name === "string" ? input.name.trim() : "";

    const email =
      typeof input.email === "string"
        ? input.email.trim().toLowerCase()
        : "";

    const password = input.password;
    const role = input.role;
    const adminRoleId = input.adminRoleId;

    if (!name || name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be between 1 and 100 characters.",
        },
        { status: 400 },
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters and at most 72 UTF-8 bytes.",
        },
        { status: 400 },
      );
    }

    if (role !== "USER" && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Invalid platform role." },
        { status: 400 },
      );
    }

    if (
      role === "ADMIN" &&
      (typeof adminRoleId !== "number" ||
        !Number.isSafeInteger(adminRoleId) ||
        adminRoleId <= 0)
    ) {
      return NextResponse.json(
        { success: false, message: "Select an administrator role." },
        { status: 400 },
      );
    }

    if (
      role === "USER" &&
      adminRoleId !== undefined &&
      adminRoleId !== null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Regular users cannot have an administrator role.",
        },
        { status: 400 },
      );
    }

    // Verify role-assignment permission separately from user creation.
    if (role === "ADMIN" && !admin.adminRole.isSystem) {
      await requireAdminPermission("roles.assign");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      let selectedRoleName: string | null = null;

      if (role === "ADMIN") {
        const selectedRole = await tx.role.findUnique({
          where: { id: adminRoleId as number },
          select: {
            id: true,
            name: true,
            isSystem: true,
            permissions: {
              select: {
                permission: {
                  select: { key: true },
                },
              },
            },
          },
        });

        if (!selectedRole) {
          return { status: "invalid_role" as const };
        }

        if (selectedRole.isSystem && !admin.adminRole.isSystem) {
          return { status: "forbidden_system_role" as const };
        }

        if (
          !admin.adminRole.isSystem &&
          selectedRole.permissions.some(
            (item) => !admin.permissions.includes(item.permission.key),
          )
        ) {
          return { status: "permission_escalation" as const };
        }

        selectedRoleName = selectedRole.name;
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role,
          adminRoleId: role === "ADMIN" ? (adminRoleId as number) : null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          adminRoleId: true,
          adminRole: {
            select: {
              id: true,
              name: true,
              isSystem: true,
            },
          },
          createdAt: true,
        },
      });

      await createActivityLog({
        userId: admin.userId,
        action: "USER_CREATED",
        description: `Created user ${user.email}`,
        status: "SUCCESS",
        metadata: {
          targetUserId: user.id,
          targetUserEmail: user.email,
          role: user.role,
          adminRole: selectedRoleName,
        },
        tx,
      });

      return {
        status: "created" as const,
        user,
      };
    });

    if (result.status === "invalid_role") {
      return NextResponse.json(
        { success: false, message: "Selected administrator role does not exist." },
        { status: 400 },
      );
    }

    if (result.status === "forbidden_system_role") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a system administrator can assign system roles.",
        },
        { status: 403 },
      );
    }

    if (result.status === "permission_escalation") {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot assign permissions you do not have.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user: result.user,
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
          message: "A user with this email already exists.",
        },
        { status: 409 },
      );
    }

    return handleError(error);
  }
}


export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminPermission("roles.assign");

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const userId = input.userId;
    const role = input.role;
    const adminRoleId = input.adminRoleId;

    if (
      typeof userId !== "number" ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 },
      );
    }

    if (role !== "USER" && role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid platform role.",
        },
        { status: 400 },
      );
    }

    if (
      role === "ADMIN" &&
      (typeof adminRoleId !== "number" ||
        !Number.isSafeInteger(adminRoleId) ||
        adminRoleId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Select an administrator role.",
        },
        { status: 400 },
      );
    }

    if (admin.userId === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot change your own role.",
        },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          adminRoleId: true,
          adminRole: {
            select: {
              name: true,
              isSystem: true,
            },
          },
        },
      });

      if (!targetUser) {
        return { status: "not_found" as const };
      }

      // Restricted admins cannot modify existing system administrators.
      if (
        targetUser.role === "ADMIN" &&
        targetUser.adminRole?.isSystem &&
        !admin.adminRole.isSystem
      ) {
        return {
          status: "forbidden_modify_system_admin" as const,
        };
      }

      // Preserve existing vendor account access.
      if (targetUser.role === "VENDOR") {
        return { status: "vendor_protected" as const };
      }

      // Existing protected administrator account.
      if (targetUser.email.toLowerCase() === "amit@example.com") {
        return { status: "protected" as const };
      }

      if (targetUser.adminRole?.isSystem) {
        const systemAdminCount = await tx.user.count({
          where: {
            role: "ADMIN",
            adminRole: {
              isSystem: true,
            },
          },
        });

        const losingSystemRole =
          role !== "ADMIN" || adminRoleId !== targetUser.adminRoleId;

        if (losingSystemRole && systemAdminCount <= 1) {
          return { status: "last_super_admin" as const };
        }
      }

      if (role === "ADMIN") {
        const selectedRole = await tx.role.findUnique({
          where: {
            id: adminRoleId as number,
          },
          select: {
            id: true,
            name: true,
            isSystem: true,
          },
        });

        if (!selectedRole) {
          return { status: "invalid_admin_role" as const };
        }

        // Only a system administrator can assign system roles.
        if (selectedRole.isSystem && !admin.adminRole.isSystem) {
          return { status: "forbidden_system_role" as const };
        }

        // Restricted administrators cannot assign roles containing
        // permissions they do not personally possess.
        if (!admin.adminRole.isSystem) {
          const selectedRolePermissions = await tx.role.findUnique({
            where: {
              id: selectedRole.id,
            },
            select: {
              permissions: {
                select: {
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
            },
          });

          const hasHigherPermissions =
            selectedRolePermissions?.permissions.some(
              (item) => !admin.permissions.includes(item.permission.key),
            );

          if (hasHigherPermissions) {
            return {
              status: "forbidden_permission_escalation" as const,
            };
          }
        }
      }

      const newAdminRoleId = role === "ADMIN" ? (adminRoleId as number) : null;

      // Only record actual changes to the user's access.
      const roleChanged = targetUser.role !== role;
      const adminRoleChanged = targetUser.adminRoleId !== newAdminRoleId;

      if (!roleChanged && !adminRoleChanged) {
        const existingUser = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminRoleId: true,
            adminRole: {
              select: {
                id: true,
                name: true,
                isSystem: true,
              },
            },
          },
        });

        return {
          status: "updated" as const,
          user: existingUser,
        };
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          role,
          adminRoleId: newAdminRoleId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          adminRoleId: true,
          adminRole: {
            select: {
              id: true,
              name: true,
              isSystem: true,
            },
          },
        },
      });

      const changes: Record<
        string,
        { from: string | null; to: string | null }
      > = {};

      if (roleChanged) {
        changes.role = {
          from: targetUser.role,
          to: updatedUser.role,
        };
      }

      if (adminRoleChanged) {
        changes.adminRole = {
          from: targetUser.adminRole?.name ?? null,
          to: updatedUser.adminRole?.name ?? null,
        };
      }

      await createActivityLog({
        userId: admin.userId,
        action: "USER_UPDATED",
        description: `Updated access for ${updatedUser.email}`,
        status: "SUCCESS",
        metadata: {
          targetUserId: updatedUser.id,
          targetUserEmail: updatedUser.email,
          changes,
        },
        tx,
      });
 
      return {
        status: "updated" as const,
        user: updatedUser,
      };
    });

    if (result.status === "forbidden_modify_system_admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only a system administrator can modify Super Admin accounts.",
        },
        { status: 403 },
      );
    }

    if (result.status === "not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (result.status === "vendor_protected") {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor accounts must be managed separately.",
        },
        { status: 403 },
      );
    }

    if (result.status === "protected") {
      return NextResponse.json(
        {
          success: false,
          message: "This administrator account is protected.",
        },
        { status: 403 },
      );
    }

    if (result.status === "last_super_admin") {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot remove the last Super Admin.",
        },
        { status: 409 },
      );
    }

    if (result.status === "invalid_admin_role") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected administrator role does not exist.",
        },
        { status: 400 },
      );
    }

    if (result.status === "forbidden_system_role") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a system administrator can assign system roles.",
        },
        { status: 403 },
      );
    }

    if (result.status === "forbidden_permission_escalation") {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot assign an administrator role containing permissions you do not have.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User access updated successfully.",
      user: result.user,
    });
  } catch (error) {
    return handleError(error);
  }
}
