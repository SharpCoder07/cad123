import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  Layers3,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import FeatureCatalog from "@/components/admin/FeatureCatalog";

export default async function AdminFeaturesPage() {
  // RBAC: Only admins with features.view can access this page.
  const admin = await requireAdminPermission("features.view");

  const canCreate = admin.permissions.includes("features.create");
  const canEdit = admin.permissions.includes("features.edit");
  const canDelete = admin.permissions.includes("features.delete");

  const features = await prisma.feature.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  const totalFeatures = features.length;
  const usedFeatures = features.filter(
    (feature) => feature._count.products > 0,
  ).length;
  const unusedFeatures = totalFeatures - usedFeatures;

  const stats = [
    {
      label: "Total Features",
      value: totalFeatures,
      description: "Reusable features in the catalog",
      icon: Layers3,
      tint: "bg-gradient-to-br from-[#FCEBF0]/85 via-[#FAF4F9]/90 to-[#F7F0FC]/80",
      iconStyle: "bg-[#EBDEFA] text-[#76599B]",
    },
    {
      label: "In Use",
      value: usedFeatures,
      description: "Assigned to at least one product",
      icon: CheckCircle2,
      tint: "bg-gradient-to-br from-[#EFFAF3] via-[#F3FBF6] to-[#E5F6EC]",
      iconStyle: "bg-[#D7F1E5] text-[#3F896D]",
    },
    {
      label: "Not In Use",
      value: unusedFeatures,
      description: "Not assigned to any product",
      icon: CircleDashed,
      tint: "bg-gradient-to-br from-[#FFF6E9] via-[#FFFAF2] to-[#FFF0DD]",
      iconStyle: "bg-[#FCE8C7] text-[#B66D16]",
    },
  ];

  const serializedFeatures = features.map((feature) => ({
    id: feature.id,
    name: feature.name,
    description: feature.description,
    productCount: feature._count.products,
  }));

  return (
    <div className="space-y-5 pb-8">
      {/* Page header — matches Product Management */}
      <section className="flex flex-col justify-between gap-4 pt-6 pb-2 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Feature Management
          </h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Create and manage reusable product features across your CADGram catalog.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/admin/features/new"
            className="inline-flex min-h-10 w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={16} />
            Add Feature
          </Link>
        )}
      </section>

      {/* Statistics — same compact pastel cards as Product Management */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`flex min-h-[146px] flex-col rounded-[21px] border border-white/85 ${stat.tint} px-5 py-4 shadow-[0_10px_30px_rgba(52,43,74,0.045)]`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium uppercase tracking-[0.035em] text-[#66707F]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.055em] text-[#18202D]">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-auto pt-2 text-[12px] leading-5 text-[#77808E]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="min-w-0">
        <FeatureCatalog
          features={serializedFeatures}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}
