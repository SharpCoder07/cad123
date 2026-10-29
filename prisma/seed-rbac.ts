
import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ADMIN_PERMISSIONS } from "../lib/permissions";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminEmail = process.env.RBAC_SUPER_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  if (!adminEmail) {
    throw new Error(
      "Set RBAC_SUPER_ADMIN_EMAIL to your existing primary admin email.",
    );
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      role: true,
      adminRoleId: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error(
      "The specified email does not belong to an existing ADMIN account.",
    );
  }

  // Keep the bootstrap assignment deliberate.
  // Do not silently replace an existing RBAC role.
  if (admin.adminRoleId !== null) {
    const existingRole = await prisma.role.findUnique({
      where: { id: admin.adminRoleId },
      select: { name: true },
    });

    if (existingRole?.name !== "Super Admin") {
      throw new Error(
        "This administrator already has another RBAC role. Review it before reassignment.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { name: "Super Admin" },
      update: {
        description: "Full access to CADGram administration",
        isSystem: true,
      },
      create: {
        name: "Super Admin",
        description: "Full access to CADGram administration",
        isSystem: true,
      },
    });

    for (const permission of ADMIN_PERMISSIONS) {
      const savedPermission = await tx.permission.upsert({
        where: { key: permission.key },
        update: {
          module: permission.module,
          action: permission.action,
        },
        create: permission,
      });

      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: savedPermission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: savedPermission.id,
        },
      });
    }

    await tx.user.update({
      where: { id: admin.id },
      data: { adminRoleId: role.id },
    });
  });

  console.log("RBAC permissions seeded successfully.");
  console.log("Super Admin role configured.");
  console.log(`Assigned Super Admin role to: ${admin.email}`);
  console.log(`Registered permissions: ${ADMIN_PERMISSIONS.length}`);
}

main()
  .catch((error) => {
    console.error("RBAC seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
