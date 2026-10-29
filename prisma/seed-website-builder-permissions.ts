import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const WEBSITE_BUILDER_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "publish",
  "assets_manage",
] as const;

async function main() {
  const superAdmin = await prisma.role.findUnique({
    where: { name: "Super Admin" },
    select: { id: true, isSystem: true },
  });

  if (!superAdmin || !superAdmin.isSystem) {
    throw new Error(
      'Expected an existing system role named "Super Admin". No permissions were changed.',
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const action of WEBSITE_BUILDER_ACTIONS) {
      const key = `website_builder.${action}`;
      const permission = await tx.permission.upsert({
        where: { key },
        update: { module: "website_builder", action },
        create: { module: "website_builder", action, key },
      });

      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdmin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdmin.id,
          permissionId: permission.id,
        },
      });
    }
  });

  console.log(
    `Registered ${WEBSITE_BUILDER_ACTIONS.length} Website Builder permissions for Super Admin.`,
  );
}

main()
  .catch((error) => {
    console.error("Website Builder permission seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
