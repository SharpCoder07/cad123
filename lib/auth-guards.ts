
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AdminPermissionKey } from "@/lib/permissions";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/*
|--------------------------------------------------------------------------
| Admin Guard
|--------------------------------------------------------------------------
|
| Revalidate the admin's current role against PostgreSQL.
| Do not trust the JWT role alone.
|
*/
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const userId = Number(session.user.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findUnique({
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
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  if (!user.adminRole) {
    throw new ForbiddenError(
      "No administrator role is assigned to your account.",
    );
  }

  const permissions = user.adminRole.permissions.map(
    (item) => item.permission.key,
  );

  return {
    session,
    userId: user.id,
    user,
    adminRole: user.adminRole,
    permissions,
  };
}

/*
|--------------------------------------------------------------------------
| Admin Permission Guard
|--------------------------------------------------------------------------
|
| Enforce module/action permissions on the server.
|
*/
export async function requireAdminPermission(
  permission: AdminPermissionKey,
) {
  const admin = await requireAdmin();

  if (!admin.permissions.includes(permission)) {
    throw new ForbiddenError(
      `You do not have permission: ${permission}`,
    );
  }

  return admin;
}

/*
|--------------------------------------------------------------------------
| Vendor Guard
|--------------------------------------------------------------------------
|
| Do not trust vendorId/status from the JWT alone.
|
*/
export async function requireVendor() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const userId = Number(session.user.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendorId: true,
      vendor: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          email: true,
          phone: true,
          website: true,
          logo: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  if (user.role !== "VENDOR") {
    throw new ForbiddenError("Vendor access required");
  }

  if (!user.vendorId || !user.vendor) {
    throw new ForbiddenError(
      "Your account is not assigned to a vendor.",
    );
  }

  if (user.vendor.status !== "ACTIVE") {
    throw new ForbiddenError(
      "Your vendor account is not active.",
    );
  }

  return {
    session,
    userId: user.id,
    vendorId: user.vendor.id,
    user,
    vendor: user.vendor,
  };
}
