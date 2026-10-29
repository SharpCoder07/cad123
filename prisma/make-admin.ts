import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email = "amit@example.com";

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "ADMIN",
    },
  });

  console.log(`${email} is now an ADMIN.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });