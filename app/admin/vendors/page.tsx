import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldBan,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import VendorCatalog from "@/components/admin/VendorCatalog";

export default async function AdminVendorsPage() {
  // Keep the existing server-side permission guard.
  const admin = await requireAdminPermission("vendors.view");

  const canCreate = admin.permissions.includes("vendors.create");
  const canEdit = admin.permissions.includes("vendors.edit");
  const canDelete = admin.permissions.includes("vendors.delete");

  const vendors = await prisma.vendor.findMany({
    include: {
      _count: {
        select: {
          users: true,
          products: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((vendor) => vendor.status === "ACTIVE").length;
  const pendingVendors = vendors.filter((vendor) => vendor.status === "PENDING").length;
  const suspendedVendors = vendors.filter((vendor) => vendor.status === "SUSPENDED").length;

  const summaryCards = [
    {
      label: "Total Vendors",
      value: totalVendors,
      description: "All registered vendor companies",
      icon: Building2,
      background: "bg-gradient-to-br from-[#F4EFFF] to-[#FCFAFF]",
      iconStyle: "bg-[#E9DEFA] text-[#8465B6]",
    },
    {
      label: "Active Vendors",
      value: activeVendors,
      description: "Vendors with active access",
      icon: CheckCircle2,
      background: "bg-gradient-to-br from-[#EAF8F0] to-[#F9FEFB]",
      iconStyle: "bg-[#D9F1E3] text-[#319464]",
    },
    {
      label: "Pending Vendors",
      value: pendingVendors,
      description: "Vendors awaiting activation",
      icon: Clock3,
      background: "bg-gradient-to-br from-[#FFF4E5] to-[#FFFCF7]",
      iconStyle: "bg-[#FFE8C6] text-[#C48A39]",
    },
    {
      label: "Suspended Vendors",
      value: suspendedVendors,
      description: "Vendor access currently disabled",
      icon: ShieldBan,
      background: "bg-gradient-to-br from-[#FFF0F1] to-[#FFFBFB]",
      iconStyle: "bg-[#FFE0E3] text-[#D66A75]",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Vendors
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Manage vendor companies, their access, products, and team members.
              </p>
            </div>
          </div>

          {canCreate && (
            <Link
              href="/admin/vendors/new"
              className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] sm:self-auto"
            >
              <Plus size={16} />
              Add Vendor
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Vendor overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`min-h-[146px] rounded-[21px] border border-[#EAE7EF]/70 p-5 ${card.background}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#666475]">{card.label}</p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#242330]">
                {card.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[#858291]">{card.description}</p>
            </div>
          );
        })}
      </section>

      <VendorCatalog
        vendors={vendors.map((vendor) => ({
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          email: vendor.email,
          website: vendor.website,
          logo: vendor.logo,
          status: vendor.status,
          userCount: vendor._count.users,
          productCount: vendor._count.products,
          createdAt: vendor.createdAt.toISOString(),
        }))}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
