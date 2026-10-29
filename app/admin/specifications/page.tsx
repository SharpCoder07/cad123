import Link from "next/link";
import {
  CheckCircle2,
  Layers3,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import SpecificationCatalog from "@/components/admin/SpecificationCatalog";

export default async function AdminSpecificationsPage() {
  // RBAC: Only admins with specifications.view can access this page.
  const admin = await requireAdminPermission("specifications.view");

  const canCreate = admin.permissions.includes("specifications.create");
  const canEdit = admin.permissions.includes("specifications.edit");
  const canDelete = admin.permissions.includes("specifications.delete");

  const specifications = await prisma.specification.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { values: true },
      },
    },
  });

  const totalSpecifications = specifications.length;
  const usedSpecifications = specifications.filter(
    (specification) => specification._count.values > 0,
  ).length;
  const totalValues = specifications.reduce(
    (total, specification) => total + specification._count.values,
    0,
  );

  const stats = [
    {
      label: "Total Specifications",
      value: totalSpecifications,
      description: "Reusable specification definitions",
      icon: Layers3,
      tint: "bg-gradient-to-br from-[#FCEBF0]/85 via-[#FAF4F9]/90 to-[#F7F0FC]/80",
      iconStyle: "bg-[#EBDEFA] text-[#76599B]",
    },
    {
      label: "With Values",
      value: usedSpecifications,
      description: "Specifications with defined values",
      icon: CheckCircle2,
      tint: "bg-gradient-to-br from-[#EFFAF3] via-[#F3FBF6] to-[#E5F6EC]",
      iconStyle: "bg-[#D7F1E5] text-[#3F896D]",
    },
    {
      label: "Total Values",
      value: totalValues,
      description: "Available specification values",
      icon: SlidersHorizontal,
      tint: "bg-gradient-to-br from-[#FFF6E9] via-[#FFFAF2] to-[#FFF0DD]",
      iconStyle: "bg-[#FCE8C7] text-[#B66D16]",
    },
  ];

  const serializedSpecifications = specifications.map((specification) => ({
    id: specification.id,
    name: specification.name,
    valueCount: specification._count.values,
  }));

  return (
    <div className="space-y-5 pb-8">
      {/* Page header — matches Product Management */}
      <section className="flex flex-col justify-between gap-4 pt-6 pb-2 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Specification Management
          </h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Create and manage reusable product specifications and their available values.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/admin/specifications/new"
            className="inline-flex min-h-10 w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={16} />
            Add Specification
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
        <SpecificationCatalog
          specifications={serializedSpecifications}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}
