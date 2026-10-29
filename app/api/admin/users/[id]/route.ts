
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Change = {
  from: string | null;
  to: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status },
  );
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401);
  }

  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return jsonError(
      "A user with this email already exists.",
      409,
    );
  }

  if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2003"
) {
  return jsonError(
    "This user has related records and cannot be deleted safely.",
    409,
  );
}

  console.error("Admin user detail API error:", error);
  return jsonError("Internal server error.", 500);
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  jobTitle: true,
  department: true,
  adminRoleId: true,
  adminRole: {
    select: {
      id: true,
      name: true,
      isSystem: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// GET /api/admin/users/[id]
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    await requireAdminPermission("users.view");

    const { id } = await params;
    const userId = parseId(id);

    if (!userId) {
      return jsonError("Invalid user ID.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      return jsonError("User not found.", 404);
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const admin = await requireAdminPermission("users.edit");

    const { id } = await params;
    const userId = parseId(id);

    if (!userId) {
      return jsonError("Invalid user ID.", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError("Invalid request body.", 400);
    }

    const input = body as Record<string, unknown>;

    const allowedFields = new Set([
      "name",
      "email",
      "phone",
      "jobTitle",
      "department",
      "role",
      "adminRoleId",
    ]);

    if (
      Object.keys(input).some(
        (key) => !allowedFields.has(key),
      )
    ) {
      return jsonError("Unsupported user fields.", 400);
    }

    const requiredFields = ["name", "email"];

    if (
      requiredFields.some(
        (field) => typeof input[field] !== "string",
      )
    ) {
      return jsonError(
        "Name and email are required.",
        400,
      );
    }

    const name = (input.name as string).trim();
    const email = (input.email as string)
      .trim()
      .toLowerCase();

    if (!name || name.length > 100) {
      return jsonError(
        "Name must be between 1 and 100 characters.",
        400,
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return jsonError(
        "Enter a valid email address.",
        400,
      );
    }

    const optionalFields = [
      "phone",
      "jobTitle",
      "department",
    ] as const;

    for (const field of optionalFields) {
      const value = input[field];

      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return jsonError(
          `Invalid ${field} value.`,
          400,
        );
      }
    }

    const phone =
      typeof input.phone === "string"
        ? input.phone.trim() || null
        : null;

    const jobTitle =
      typeof input.jobTitle === "string"
        ? input.jobTitle.trim() || null
        : null;

    const department =
      typeof input.department === "string"
        ? input.department.trim() || null
        : null;

    if (phone && phone.length > 20) {
      return jsonError(
        "Phone number cannot exceed 20 characters.",
        400,
      );
    }

    if (jobTitle && jobTitle.length > 100) {
      return jsonError(
        "Job title cannot exceed 100 characters.",
        400,
      );
    }

    if (department && department.length > 100) {
      return jsonError(
        "Department cannot exceed 100 characters.",
        400,
      );
    }

    const hasRole = Object.prototype.hasOwnProperty.call(
      input,
      "role",
    );

    const hasAdminRoleId =
      Object.prototype.hasOwnProperty.call(
        input,
        "adminRoleId",
      );

    if (hasRole !== hasAdminRoleId) {
      return jsonError(
        "Role and adminRoleId must be provided together.",
        400,
      );
    }

    if (hasRole) {
      if (
        input.role !== "USER" &&
        input.role !== "ADMIN"
      ) {
        return jsonError(
          "Invalid platform role.",
          400,
        );
      }

      if (input.role === "ADMIN") {
        if (
          typeof input.adminRoleId !== "number" ||
          !Number.isSafeInteger(input.adminRoleId) ||
          input.adminRoleId <= 0
        ) {
          return jsonError(
            "Select an administrator role.",
            400,
          );
        }
      } else if (
        input.adminRoleId !== null &&
        input.adminRoleId !== undefined
      ) {
        return jsonError(
          "Regular users cannot have an administrator role.",
          400,
        );
      }
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const targetUser = await tx.user.findUnique({
          where: { id: userId },
          select: userSelect,
        });

        if (!targetUser) {
          return { status: "not_found" as const };
        }

        // Preserve vendor account management boundaries.
        if (targetUser.role === "VENDOR") {
          return { status: "vendor_protected" as const };
        }

        // Preserve the existing protected administrator account.
        if (
          targetUser.email.toLowerCase() ===
          "amit@example.com"
        ) {
          return { status: "protected" as const };
        }

        // Restricted admins cannot edit system administrators.
        if (
          targetUser.role === "ADMIN" &&
          targetUser.adminRole?.isSystem &&
          !admin.adminRole.isSystem
        ) {
          return {
            status: "forbidden_modify_system_admin" as const,
          };
        }

        const nextRole = hasRole
          ? (input.role as "USER" | "ADMIN")
          : targetUser.role;

        const nextAdminRoleId = hasRole
          ? nextRole === "ADMIN"
            ? (input.adminRoleId as number)
            : null
          : targetUser.adminRoleId;

        const accessChanged =
          nextRole !== targetUser.role ||
          nextAdminRoleId !== targetUser.adminRoleId;

        if (accessChanged) {
          // Keep the same self-role-change protection.
          if (admin.userId === userId) {
            return {
              status: "self_role_change" as const,
            };
          }

          // Role assignment requires its own permission.
          if (
            !admin.adminRole.isSystem &&
            !admin.permissions.includes("roles.assign")
          ) {
            return {
              status: "missing_role_permission" as const,
            };
          }

          if (targetUser.adminRole?.isSystem) {
            const systemAdminCount =
              await tx.user.count({
                where: {
                  role: "ADMIN",
                  adminRole: {
                    isSystem: true,
                  },
                },
              });

            if (systemAdminCount <= 1) {
              return {
                status: "last_super_admin" as const,
              };
            }
          }

          if (nextRole === "ADMIN") {
            const selectedRole =
              await tx.role.findUnique({
                where: {
                  id: nextAdminRoleId as number,
                },
                select: {
                  id: true,
                  isSystem: true,
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

            if (!selectedRole) {
              return {
                status: "invalid_admin_role" as const,
              };
            }

            if (
              selectedRole.isSystem &&
              !admin.adminRole.isSystem
            ) {
              return {
                status: "forbidden_system_role" as const,
              };
            }

            if (
              !admin.adminRole.isSystem &&
              selectedRole.permissions.some(
                (item) =>
                  !admin.permissions.includes(
                    item.permission.key,
                  ),
              )
            ) {
              return {
                status: "permission_escalation" as const,
              };
            }
          }
        }

        const changes: Record<string, Change> = {};

        function recordChange(
          field: string,
          from: string | null,
          to: string | null,
        ) {
          if (from !== to) {
            changes[field] = { from, to };
          }
        }

        recordChange(
          "name",
          targetUser.name,
          name,
        );

        recordChange(
          "email",
          targetUser.email,
          email,
        );

        recordChange(
          "phone",
          targetUser.phone,
          phone,
        );

        recordChange(
          "jobTitle",
          targetUser.jobTitle,
          jobTitle,
        );

        recordChange(
          "department",
          targetUser.department,
          department,
        );

        if (accessChanged) {
          recordChange(
            "role",
            targetUser.role,
            nextRole,
          );
        }

        if (Object.keys(changes).length === 0 && !accessChanged) {
          return {
            status: "unchanged" as const,
            user: targetUser,
          };
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            name,
            email,
            phone,
            jobTitle,
            department,
            ...(accessChanged
              ? {
                  role: nextRole,
                  adminRoleId: nextAdminRoleId,
                }
              : {}),
          },
          select: userSelect,
        });

        if (accessChanged) {
          recordChange(
            "adminRole",
            targetUser.adminRole?.name ?? null,
            updatedUser.adminRole?.name ?? null,
          );
        }

        await createActivityLog({
          userId: admin.userId,
          action: "USER_UPDATED",
          description: `Updated user ${updatedUser.email}`,
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
      },
    );

    switch (result.status) {
      case "not_found":
        return jsonError("User not found.", 404);

      case "vendor_protected":
        return jsonError(
          "Vendor accounts must be managed separately.",
          403,
        );

      case "protected":
        return jsonError(
          "This administrator account is protected.",
          403,
        );

      case "forbidden_modify_system_admin":
        return jsonError(
          "Only a system administrator can modify Super Admin accounts.",
          403,
        );

      case "self_role_change":
        return jsonError(
          "You cannot change your own role.",
          403,
        );

      case "missing_role_permission":
        return jsonError(
          "You do not have permission to assign roles.",
          403,
        );

      case "last_super_admin":
        return jsonError(
          "You cannot remove the last Super Admin.",
          409,
        );

      case "invalid_admin_role":
        return jsonError(
          "Selected administrator role does not exist.",
          400,
        );

      case "forbidden_system_role":
        return jsonError(
          "Only a system administrator can assign system roles.",
          403,
        );

      case "permission_escalation":
        return jsonError(
          "You cannot assign an administrator role containing permissions you do not have.",
          403,
        );

      case "unchanged":
        return NextResponse.json({
          success: true,
          message: "No changes were necessary.",
          user: result.user,
        });

      case "updated":
        return NextResponse.json({
          success: true,
          message: "User updated successfully.",
          user: result.user,
        });
    }
  } catch (error) {
    return handleError(error);
  }
}



 // DELETE /api/admin/users/[id]
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const admin = await requireAdminPermission("users.delete");

    const { id } = await params;
    const userId = parseId(id);

    if (!userId) {
      return jsonError("Invalid user ID.", 400);
    }

    // Administrators cannot delete their own account.
    if (admin.userId === userId) {
      return jsonError(
        "You cannot delete your own account.",
        403,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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

      // Vendor accounts are managed separately.
      if (targetUser.role === "VENDOR") {
        return { status: "vendor_protected" as const };
      }

      // Preserve the protected administrator account.
      if (
        targetUser.email.toLowerCase() ===
        "amit@example.com"
      ) {
        return { status: "protected" as const };
      }

      // Do not allow deletion of system administrators.
      if (
        targetUser.role === "ADMIN" &&
        targetUser.adminRole?.isSystem
      ) {
        return {
          status: "system_admin_protected" as const,
        };
      }

      // Save a permanent audit entry before deletion.
      await createActivityLog({
        userId: admin.userId,
        action: "USER_DELETED",
        description: `Deleted user ${targetUser.email}`,
        status: "SUCCESS",
        metadata: {
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          targetUserEmail: targetUser.email,
          previousRole: targetUser.role,
          previousAdminRole:
            targetUser.adminRole?.name ?? null,
        },
        tx,
      });

      // Prisma/database relation constraints may block
      // deletion if the user owns related records.
      await tx.user.delete({
        where: { id: userId },
      });

      return {
        status: "deleted" as const,
        deletedUserId: userId,
      };
    });

    switch (result.status) {
      case "not_found":
        return jsonError("User not found.", 404);

      case "vendor_protected":
        return jsonError(
          "Vendor accounts must be managed separately.",
          403,
        );

      case "protected":
        return jsonError(
          "This administrator account is protected.",
          403,
        );

      case "system_admin_protected":
        return jsonError(
          "Super Admin accounts cannot be deleted.",
          403,
        );

      case "deleted":
        return NextResponse.json({
          success: true,
          message: "User deleted successfully.",
          deletedUserId: result.deletedUserId,
        });
    }
  } catch (error) {
    return handleError(error);
  }
}



