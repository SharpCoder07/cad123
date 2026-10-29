import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  Store,
  Tags,
  Layers3,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import ProductCatalog from "@/components/admin/ProductCatalog";

export default async function AdminProductsPage() {
  // RBAC: Only admins with products.view can access this page.
  const admin = await requireAdminPermission("products.view");

  const canCreate = admin.permissions.includes("products.create");
  const canViewBrands = admin.permissions.includes("brands.view");
  const canViewCategories = admin.permissions.includes("categories.view");
  const canViewRemovedProducts = admin.permissions.includes("products.delete");

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      brand: true,
      category: true,
      vendor: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    rating: product.rating,
    status: product.status,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString(),
    brand: {
      id: product.brand.id,
      name: product.brand.name,
    },
    category: {
      id: product.category.id,
      name: product.category.name,
    },
    vendor: product.vendor
      ? {
          id: product.vendor.id,
          name: product.vendor.name,
          status: product.vendor.status,
        }
      : null,
  }));

  const publishedCount = products.filter(
    (product) => product.status === "PUBLISHED",
  ).length;

  const reviewCount = products.filter(
    (product) =>
      product.status === "SUBMITTED" || product.status === "CHANGES_REQUESTED",
  ).length;

  const vendorProductCount = products.filter(
    (product) => product.vendorId !== null,
  ).length;

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      description: "All products in the catalog",
      icon: Package,
      tint: "bg-gradient-to-br from-[#FCEBF0]/85 via-[#FAF4F9]/90 to-[#F7F0FC]/80",
      iconStyle: "bg-[#EBDEFA] text-[#76599B]",
    },
    {
      label: "Published",
      value: publishedCount,
      description: "Currently public products",
      icon: CheckCircle2,
      tint: "bg-gradient-to-br from-[#EFFAF3] via-[#F3FBF6] to-[#E5F6EC]",
      iconStyle: "bg-[#D7F1E5] text-[#3F896D]",
    },
    {
      label: "Needs Review",
      value: reviewCount,
      description: "Submitted or changes requested",
      icon: ClipboardList,
      tint: "bg-gradient-to-br from-[#FFF6E9] via-[#FFFAF2] to-[#FFF0DD]",
      iconStyle: "bg-[#FCE8C7] text-[#B66D16]",
    },
    {
      label: "Vendor Products",
      value: vendorProductCount,
      description: "Products owned by vendors",
      icon: Store,
      tint: "bg-gradient-to-br from-[#F3F5FD] via-[#F5F6FD] to-[#EDEFFC]",
      iconStyle: "bg-[#DBE8FF] text-[#5E79AC]",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <section className="flex flex-col justify-between gap-4 pt-6 pb-2 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Product Management
          </h1>

          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Manage CADGram products, vendor submissions and <br /> catalog
            publishing.
          </p>
        </div>

        {/* RBAC: Show Add Product only when allowed */}
        <div className="flex flex-wrap items-center gap-2">
          {canViewBrands && (
            <Link
              href="/admin/brands"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <Tags size={16} />
              Brands
            </Link>
          )}

          {canViewCategories && (
            <Link
              href="/admin/categories"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <Layers3 size={16} />
              Categories
            </Link>
          )}

          {canViewRemovedProducts && (
            <Link
              href="/admin/products/removed"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <Trash2 size={16} />
              Removed Products
            </Link>
          )}

          {canCreate && (
            <Link
              href="/admin/products/new"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
            >
              <Plus size={16} />
              Add Product
            </Link>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Existing catalog functionality */}
      <section className="min-w-0">
        <ProductCatalog
          products={serializedProducts}
          canEdit={admin.permissions.includes("products.edit")}
          canDelete={admin.permissions.includes("products.delete")}
          canApprove={admin.permissions.includes("products.approve")}
        />
      </section>
    </div>
  );
}
