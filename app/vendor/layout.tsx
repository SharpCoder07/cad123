
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { requireVendor } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import VendorShell from "@/components/vendor/VendorShell";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(
    authOptions
  );

  const { vendorId, vendor } =
    await requireVendor();

  const userName =
    session?.user?.name ||
    session?.user?.email ||
    vendor.name ||
    "Vendor";

  const [draftCount, submittedCount] =
    await Promise.all([
      prisma.product.count({
        where: {
          vendorId,
          status: "DRAFT",
        },
      }),

      prisma.product.count({
        where: {
          vendorId,
          status: "SUBMITTED",
        },
      }),
    ]);

  return (
    <VendorShell
      userName={userName}
      vendorName={vendor.name}
      draftCount={draftCount}
      submittedCount={submittedCount}
    >
      {children}
    </VendorShell>
  );
}
