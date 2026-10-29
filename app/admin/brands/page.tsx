import Link from "next/link";
import { Globe, Plus, Tags, Globe2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import BrandCatalog from "@/components/admin/BrandCatalog";

export default async function AdminBrandsPage() {
  // RBAC: Only admins with brands.view can access this page.
  const admin = await requireAdminPermission("brands.view");

  const canCreate = admin.permissions.includes("brands.create");
  const canEdit = admin.permissions.includes("brands.edit");
  const canDelete = admin.permissions.includes("brands.delete");

  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
  });

  const brandsWithWebsite = brands.filter((brand) =>
    Boolean(brand.website?.trim()),
  ).length;
  const brandsWithoutWebsite = brands.length - brandsWithWebsite;

  const stats = [
    {
      label: "Total Brands",
      value: brands.length,
      description: "Brands available in your catalog",
      icon: Tags,
      cardClass:
        "border-[#E7DDF8] bg-gradient-to-br from-[#F6F0FF] via-[#F9F5FF] to-[#FFFFFF]",
      iconClass: "bg-[#EAE0FA] text-[#8065B0]",
    },
    {
      label: "With Website",
      value: brandsWithWebsite,
      description: "Brands with a website URL",
      icon: Globe,
      cardClass:
        "border-[#D8EEE2] bg-gradient-to-br from-[#EFFAF3] via-[#F5FCF7] to-[#FFFFFF]",
      iconClass: "bg-[#DCF3E5] text-[#278455]",
    },
    {
      label: "Without Website",
      value: brandsWithoutWebsite,
      description: "Brands missing a website URL",
      icon: Globe2,
      cardClass:
        "border-[#F3E5CF] bg-gradient-to-br from-[#FFF6E8] via-[#FFFAF1] to-[#FFFFFF]",
      iconClass: "bg-[#FCEBCF] text-[#B77A2C]",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Brand Management
          </h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Organize and manage the software brands available across your CADGram catalog.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/admin/brands/new"
            className="inline-flex min-h-10 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={16} strokeWidth={2} />
            Add Brand
          </Link>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border p-5 shadow-[0_5px_20px_rgba(30,26,46,0.025)] ${stat.cardClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#5C5865]">
                  {stat.label}
                </p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <Icon size={19} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#24212B]">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[#77717F]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="min-w-0">
        <BrandCatalog
          brands={brands.map((brand) => ({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            website: brand.website,
            createdAt: brand.createdAt.toISOString(),
          }))}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}
