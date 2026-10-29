import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileClock,
  Package,
  Plus,
  RotateCcw,
  Send,
  Star,
} from "lucide-react";
import { requireVendor } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProductStatus, type Prisma } from "@/prisma/generated/client";
import VendorProductFilters from "@/components/vendor/VendorProductFilters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PageProps = { searchParams?: SearchParams };

const PAGE_SIZE = 10;
const statuses = ["ALL", ...Object.values(ProductStatus)] as const;

function getStatusStyles(status: string) {
  switch (status) {
    case "PUBLISHED":
    case "APPROVED":
      return "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]";
    case "SUBMITTED":
      return "border-[#DCE7FA] bg-[#F0F5FF] text-[#557BB5]";
    case "CHANGES_REQUESTED":
      return "border-[#F4E1C4] bg-[#FFF7E9] text-[#B57B32]";
    case "REJECTED":
      return "border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]";
    default:
      return "border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]";
  }
}
function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function first(value: string | string[] | undefined) {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? (value[0] ?? "")
      : "";
}
function productUrl(params: {
  search: string;
  status: string;
  sort: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status !== "ALL") query.set("status", params.status);
  if (params.sort !== "newest") query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const suffix = query.toString();
  return `/vendor/products${suffix ? `?${suffix}` : ""}`;
}

export default async function VendorProductsPage({ searchParams }: PageProps) {
  const { vendorId } = await requireVendor();
  const params = (await searchParams) ?? {};
  const search = first(params.search).trim().slice(0, 150);
  const rawStatus = first(params.status).toUpperCase();
  const status = statuses.find((value) => value === rawStatus) ?? "ALL";
  const rawSort = first(params.sort);
  const sort = ["newest", "oldest", "name_asc", "name_desc"].includes(rawSort)
    ? rawSort
    : "newest";
  const requestedPage = Number(first(params.page));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const [total, published, drafts, submitted] = await Promise.all([
    prisma.product.count({ where: { vendorId } }),
    prisma.product.count({ where: { vendorId, status: "PUBLISHED" } }),
    prisma.product.count({ where: { vendorId, status: "DRAFT" } }),
    prisma.product.count({ where: { vendorId, status: "SUBMITTED" } }),
  ]);

  const where: Prisma.ProductWhereInput = {
    vendorId,
    ...(status !== "ALL" ? { status: status as ProductStatus } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              category: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "oldest"
      ? { updatedAt: "asc" as const }
      : sort === "name_asc"
        ? { name: "asc" as const }
        : sort === "name_desc"
          ? { name: "desc" as const }
          : { updatedAt: "desc" as const };
  const filteredCount = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      shortDescription: true,
      status: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const stats = [
    {
      label: "Total Products",
      value: total,
      description: "Products in your catalog",
      icon: Package,
      style: "border-[#E7DDF8] bg-gradient-to-br from-[#F2ECFD] to-[#FAF7FF]",
      iconStyle: "bg-white/75 text-[#8065B0]",
    },
    {
      label: "Published",
      value: published,
      description: "Live products on CADGram",
      icon: CheckCircle2,
      style: "border-[#DCEFE4] bg-gradient-to-br from-[#EAF8EF] to-[#F7FCF8]",
      iconStyle: "bg-white/75 text-[#39956A]",
    },
    {
      label: "Drafts",
      value: drafts,
      description: "Products in progress",
      icon: FileClock,
      style: "border-[#F7E5DB] bg-gradient-to-br from-[#FFF0E6] to-[#FFFAF6]",
      iconStyle: "bg-white/75 text-[#CB906B]",
    },
    {
      label: "Submitted",
      value: submitted,
      description: "Awaiting admin review",
      icon: Send,
      style: "border-[#E5E5F7] bg-gradient-to-br from-[#EEEEFD] to-[#F9F9FF]",
      iconStyle: "bg-white/75 text-[#777AC0]",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            My Products
          </h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
            Manage your product catalog and track publishing status.
          </p>
        </div>
        <Link
          href="/vendor/products/new"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={17} /> Add Product
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border p-5 ${stat.style}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#666371]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={19} strokeWidth={1.9} />
                </span>
              </div>
              <p className="mt-1 text-[31px] font-semibold leading-tight tracking-[-0.04em] text-[#25232C]">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[12px] text-[#827E8C]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_24px_rgba(31,25,50,0.025)]">
        <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
          <VendorProductFilters
            search={search}
            status={status}
            sort={sort}
            statuses={statuses.map((value) => ({
              value,
              label: value === "ALL" ? "All statuses" : formatStatus(value),
            }))}
            filteredCount={filteredCount}
            total={total}
          />
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[290px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              <Package size={25} />
            </span>
            <h3 className="mt-4 text-[16px] font-semibold text-[#25232C]">
              {total === 0 ? "No products yet" : "No matching products"}
            </h3>
            <p className="mt-2 max-w-md text-[13px] leading-6 text-[#827E8C]">
              {total === 0
                ? "Start building your catalog by adding your first product. New products begin as drafts and require approval before appearing publicly."
                : "Try changing your search or filters to find the products you're looking for."}
            </p>
            {total === 0 ? (
              <Link
                href="/vendor/products/new"
                className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white"
              >
                <Plus size={16} /> Add First Product
              </Link>
            ) : (
              <Link
                href="/vendor/products"
                className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E7E3ED] px-4 text-[13px] font-medium text-[#595462]"
              >
                <RotateCcw size={15} /> Clear Filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#FAF9FC]">
                  <tr className="border-b border-[#EFECF3]">
                    {[
                      "Product",
                      "Brand",
                      "Category",
                      "Status",
                      "Rating",
                      "Last Updated",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#938D9D] ${heading === "Action" ? "text-right" : ""}`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[#F1EFF4] transition last:border-0 hover:bg-[#FCFAFF]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE7EF] bg-[#F9F7FC]">
                            {product.logo ? (
                              <img
                                src={product.logo}
                                alt={product.name}
                                className="h-full w-full object-contain p-1.5"
                              />
                            ) : (
                              <Package size={19} className="text-[#A18DBB]" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[230px] truncate text-[13px] font-semibold text-[#302B38]">
                              {product.name}
                            </span>
                            <span className="mt-1 block max-w-[230px] truncate text-[12px] text-[#928C9A]">
                              {product.shortDescription || `/${product.slug}`}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#686371]">
                        {product.brand.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#686371]">
                        {product.category.name}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusStyles(product.status)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {formatStatus(product.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[13px]">
                          <Star
                            size={15}
                            className="fill-amber-400 text-amber-400"
                          />
                          <span className="font-semibold text-[#34303C]">
                            {product.rating ?? "N/A"}
                          </span>
                          <span className="text-[11px] text-[#9993A1]">
                            ({product.reviewCount})
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[12px] text-[#898391]">
                        {product.updatedAt.toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/vendor/products/${product.id}/edit`}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#55505F] hover:border-[#CDBCEB] hover:bg-[#F4EFFC] hover:text-[#8065B0]"
                        >
                          Manage <ArrowUpRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#F1EFF4] md:hidden">
              {products.map((product) => (
                <article key={product.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE7EF] bg-[#F9F7FC]">
                      {product.logo ? (
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <Package size={20} className="text-[#A18DBB]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13px] font-semibold text-[#302B38]">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-[12px] text-[#807988]">
                        {product.brand.name} · {product.category.name}
                      </p>
                      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#9993A1]">
                        {product.shortDescription || `/${product.slug}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusStyles(product.status)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {formatStatus(product.status)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12px]">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="font-semibold text-[#34303C]">
                        {product.rating ?? "N/A"}
                      </span>
                      <span className="text-[#9993A1]">
                        ({product.reviewCount})
                      </span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#F1EFF4] pt-4">
                    <span className="text-[12px] text-[#9993A1]">
                      Updated {product.updatedAt.toLocaleDateString("en-IN")}
                    </span>
                    <Link
                      href={`/vendor/products/${product.id}/edit`}
                      className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-[#8065B0]"
                    >
                      Manage <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF3] px-5 py-4 sm:px-6">
              <p className="text-[12px] text-[#8D8795]">
                Showing{" "}
                {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString("en-IN")}–
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredCount,
                ).toLocaleString("en-IN")}{" "}
                of {filteredCount.toLocaleString("en-IN")}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Link
                    aria-disabled={currentPage === 1}
                    href={productUrl({
                      search,
                      status,
                      sort,
                      page: Math.max(1, currentPage - 1),
                    })}
                    className={`inline-flex h-9 items-center gap-1 rounded-lg border border-[#E7E3ED] px-3 text-[12px] font-medium ${currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-[#F7F3FC]"}`}
                  >
                    <ChevronLeft size={15} /> Previous
                  </Link>
                  <span className="px-1 text-[12px] text-[#807988]">
                    {currentPage} / {pageCount}
                  </span>
                  <Link
                    aria-disabled={currentPage === pageCount}
                    href={productUrl({
                      search,
                      status,
                      sort,
                      page: Math.min(pageCount, currentPage + 1),
                    })}
                    className={`inline-flex h-9 items-center gap-1 rounded-lg border border-[#E7E3ED] px-3 text-[12px] font-medium ${currentPage === pageCount ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-[#F7F3FC]"}`}
                  >
                    Next <ChevronRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </section>
      <footer className="flex flex-col gap-2 border-t border-[#EAE7EF] pt-5 text-[12px] text-[#A19BA9] sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage your products. Grow your business.</p>
      </footer>
    </div>
  );
}
