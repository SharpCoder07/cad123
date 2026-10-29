import Link from "next/link";
import { Folder, FolderTree, Layers3, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import CategoryCatalog from "@/components/admin/CategoryCatalog";

export default async function AdminCategoriesPage() {
  // RBAC: Only admins with categories.view can access this page.
  const admin = await requireAdminPermission("categories.view");

  const canCreate = admin.permissions.includes("categories.create");
  const canEdit = admin.permissions.includes("categories.edit");
  const canDelete = admin.permissions.includes("categories.delete");

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const topLevelCount = categories.filter(
    (category) => category.parentId === null,
  ).length;
  const subcategoryCount = categories.filter(
    (category) => category.parentId !== null,
  ).length;

  const stats = [
    {
      label: "Total Categories",
      value: categories.length,
      description: "All categories in your catalog",
      icon: FolderTree,
      background: "from-[#F4F0FF] via-[#F8F5FF] to-[#FFFFFF]",
      iconStyle: "bg-[#E9DFFD] text-[#8065B0]",
    },
    {
      label: "Top-level Categories",
      value: topLevelCount,
      description: "Categories without a parent",
      icon: Folder,
      background: "from-[#EAF8F1] via-[#F3FBF7] to-[#FFFFFF]",
      iconStyle: "bg-[#D9F1E3] text-[#278455]",
    },
    {
      label: "Subcategories",
      value: subcategoryCount,
      description: "Categories nested under a parent",
      icon: Layers3,
      background: "from-[#FFF2E7] via-[#FFF8F1] to-[#FFFFFF]",
      iconStyle: "bg-[#FFE8D4] text-[#C58048]",
    },
  ];

  const serializedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    parent: category.parent
      ? { id: category.parent.id, name: category.parent.name }
      : null,
    productCount: category._count.products,
    childrenCount: category._count.children,
    createdAt: category.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Category Management
          </h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Organize and manage your CADGram software categories and subcategories.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/admin/categories/new"
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={16} />
            Add Category
          </Link>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border border-[#EAE6EE] bg-gradient-to-br ${stat.background} p-5 shadow-[0_5px_20px_rgba(40,28,60,0.025)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#686475]">{stat.label}</p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}>
                  <Icon size={19} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#24212C]">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[#888292]">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <section className="min-w-0">
        <CategoryCatalog
          categories={serializedCategories}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}
