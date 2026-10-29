"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Package,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

import DeleteProductButton from "@/components/admin/DeleteProductButton";

type ProductStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED";

type VendorStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

type Product = {
  id: number;
  name: string;
  slug: string;
  rating: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: string;
  brand: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  };
  vendor: {
    id: number;
    name: string;
    status: VendorStatus;
  } | null;
};

type ProductCatalogProps = {
  products: Product[];
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
};

type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "rating-high"
  | "rating-low";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const selectClass =
  "h-10 w-full min-w-0 cursor-pointer rounded-xl border border-[#E8E4EF] bg-white px-3 text-xs font-medium text-[#534E63] outline-none transition hover:border-[#CEC5DF] focus:border-[#A78BFA] focus:ring-4 focus:ring-violet-100";

export default function ProductCatalog({
  products,
  canEdit = false,
  canDelete = false,
}: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [vendorId, setVendorId] = useState("all");
  const [productStatus, setProductStatus] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(
    () =>
      Array.from(
        new Map(
          products.map((product) => [product.brand.id, product.brand]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          products.map((product) => [product.category.id, product.category]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const vendors = useMemo(
    () =>
      Array.from(
        new Map(
          products
            .filter((product) => product.vendor !== null)
            .map((product) => [product.vendor!.id, product.vendor!]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.brand.name.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query) ||
        (product.vendor?.name.toLowerCase().includes(query) ?? false);

      const matchesBrand =
        brandId === "all" || String(product.brand.id) === brandId;

      const matchesCategory =
        categoryId === "all" || String(product.category.id) === categoryId;

      const matchesVendor =
        vendorId === "all" ||
        (vendorId === "unassigned" && product.vendor === null) ||
        String(product.vendor?.id) === vendorId;

      const matchesStatus =
        productStatus === "all" || product.status === productStatus;

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && product.isFeatured) ||
        (featuredFilter === "not-featured" && !product.isFeatured);

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesVendor &&
        matchesStatus &&
        matchesFeatured
      );
    });

    return result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "rating-high":
          return (b.rating ?? -1) - (a.rating ?? -1);
        case "rating-low":
          return (a.rating ?? Infinity) - (b.rating ?? Infinity);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [
    products,
    search,
    brandId,
    categoryId,
    vendorId,
    productStatus,
    featuredFilter,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const hasFilters =
    search.trim() !== "" ||
    brandId !== "all" ||
    categoryId !== "all" ||
    vendorId !== "all" ||
    productStatus !== "all" ||
    featuredFilter !== "all" ||
    sort !== "newest";

  const activeFilterCount = [
    brandId !== "all",
    categoryId !== "all",
    vendorId !== "all",
    productStatus !== "all",
    featuredFilter !== "all",
  ].filter(Boolean).length;

  useEffect(() => {
    setPage(1);
  }, [
    search,
    brandId,
    categoryId,
    vendorId,
    productStatus,
    featuredFilter,
    sort,
    pageSize,
  ]);

  function resetFilters() {
    setSearch("");
    setBrandId("all");
    setCategoryId("all");
    setVendorId("all");
    setProductStatus("all");
    setFeaturedFilter("all");
    setSort("newest");
    setPage(1);
  }

  const startItem =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);

  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#E7E2EF] bg-white shadow-[0_8px_30px_rgba(45,28,75,0.035)]">
      {/* Catalog heading */}
      <div className="border-b border-[#EFEAF5] bg-gradient-to-r from-white via-[#FCFAFF] to-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E9E1F9] bg-[#F3EEFC] text-[#7756B1]">
              <Package size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Product Catalog
              </h2>
              <p className="mt-1 text-[12px] text-[#77808E]">
                Search, filter and manage your software products
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E8E0F2] bg-[#F6F2FB] px-3 py-1.5 text-xs font-semibold text-[#75668E]">
              {filteredProducts.length} products
            </span>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                showFilters
                  ? "border-[#C8B4EA] bg-[#F3ECFF] text-[#754CB3]"
                  : "border-[#E8E4EF] bg-white text-[#5C556B] hover:border-[#D2C5E5] hover:bg-[#FBF9FF]"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#8059C4] px-1.5 py-0.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product, brand, category or vendor..."
              className="h-11 w-full rounded-xl border border-[#E8E4EF] bg-white pl-11 pr-10 text-sm text-[#292338] outline-none transition placeholder:text-[#A19AAE] focus:border-[#A78BFA] focus:ring-4 focus:ring-violet-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E8E4EF] bg-white px-4 text-sm font-semibold text-[#6C617E] transition hover:bg-[#F7F2FF]"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select
              aria-label="Filter by brand"
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              className={selectClass}
            >
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by vendor"
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
              className={selectClass}
            >
              <option value="all">All vendors</option>
              <option value="unassigned">CADGram / Unassigned</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by product status"
              value={productStatus}
              onChange={(event) => setProductStatus(event.target.value)}
              className={selectClass}
            >
              <option value="all">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="CHANGES_REQUESTED">Changes requested</option>
            </select>

            <select
              aria-label="Filter by featured status"
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value)}
              className={selectClass}
            >
              <option value="all">Featured or not</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
            </select>

            <select
              aria-label="Sort products"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="rating-high">Highest rating</option>
              <option value="rating-low">Lowest rating</option>
            </select>
          </div>
        )}
      </div>

      {/* Desktop table */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F2] bg-[#F7F5FB]">
                  <TableHeading>Product</TableHeading>
                  <TableHeading>Vendor</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Brand</TableHeading>
                  <TableHeading>Category</TableHeading>
                  <TableHeading>Rating</TableHeading>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-[#77718B]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0ECF5]">
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="group transition-colors hover:bg-[#FAF8FF]"
                  >
                    <td className="px-5 py-4 align-middle">
                      <ProductIdentity product={product} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <VendorBadge vendor={product.vendor} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <ProductStatusBadge status={product.status} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex max-w-[150px] truncate rounded-lg border border-[#E8E4F0] bg-[#F7F5FA] px-2.5 py-1.5 text-xs font-medium text-[#5E566F]">
                        {product.brand.name}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex max-w-[150px] truncate rounded-lg border border-[#E2EAF6] bg-[#F4F8FF] px-2.5 py-1.5 text-xs font-medium text-[#58709A]">
                        {product.category.name}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <Rating rating={product.rating} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E3D7F3] bg-[#F7F2FF] px-3 py-2 text-xs font-semibold text-[#7652AC] transition hover:border-[#BFA5E5] hover:bg-[#EFE5FF]"
                          >
                            Manage
                            <ArrowUpRight size={14} />
                          </Link>
                        )}

                        {canDelete && (
                          <DeleteProductButton productId={product.id} />
                        )}

                        {!canEdit && !canDelete && (
                          <span className="text-xs text-gray-400">
                            View only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-[#F0ECF5] md:hidden">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="p-5 transition-colors hover:bg-[#FCFAFF]">
                <div className="flex items-start justify-between gap-3">
                  <ProductIdentity product={product} />
                  <Rating rating={product.rating} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <VendorBadge vendor={product.vendor} />
                  <ProductStatusBadge status={product.status} />

                  <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                    {product.brand.name}
                  </span>

                  <span className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600">
                    {product.category.name}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {canEdit && (
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7652AC] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#644096]"
                    >
                      Manage Product
                      <ArrowUpRight size={14} />
                    </Link>
                  )}

                  {canDelete && <DeleteProductButton productId={product.id} />}

                  {!canEdit && !canDelete && (
                    <span className="text-xs text-gray-400">View only</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-[#EFEAF5] bg-[#FCFBFE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>

              <select
                aria-label="Products per page"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-[#E5DFF0] bg-white px-2 text-xs font-medium text-[#645B76] outline-none focus:border-[#A78BFA]"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5DFF0] bg-white text-[#74658D] transition hover:border-[#C9B6E5] hover:bg-[#F4EEFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-20 text-center text-xs font-semibold text-gray-700">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5DFF0] bg-white text-[#74658D] transition hover:border-[#C9B6E5] hover:bg-[#F4EEFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Search size={23} />
          </span>

          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No matching products
          </h3>

          <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
            Try changing your search or filter options.
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 cursor-pointer rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#77718B]">
      {children}
    </th>
  );
}

function ProductIdentity({ product }: { product: Product }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E8DDF7] bg-gradient-to-br from-[#F4EDFF] to-[#EDE7FA] text-sm font-bold text-[#7653B2]">
        {product.name.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 max-w-[180px] truncate text-sm font-semibold text-[#2C2539]">
            {product.name}
          </span>

          {product.isFeatured && (
            <span
              title="Featured Product"
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-[#E3D4F9] bg-[#F2EAFE] px-2 py-0.5 text-[10px] font-semibold text-[#7545B5]"
            >
              <Star size={11} className="fill-current" />
              Featured
            </span>
          )}
        </span>

        <span className="mt-1 block max-w-[220px] truncate text-xs text-gray-400">
          {product.slug}
        </span>
      </span>
    </div>
  );
}

function VendorBadge({ vendor }: { vendor: Product["vendor"] }) {
  if (!vendor) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-lg border border-[#E9E4F0] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-semibold text-[#81798D]">
        CADGram / Unassigned
      </span>
    );
  }

  return (
    <Link
      href={`/admin/vendors/${vendor.id}`}
      className="inline-flex cursor-pointer whitespace-nowrap rounded-lg border border-[#E3DDF0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#66567E] transition hover:bg-[#F7F2FF]"
    >
      {vendor.name}
    </Link>
  );
}

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const styles: Record<ProductStatus, string> = {
    PUBLISHED: "border-[#C7EEDC] bg-[#EDFBF3] text-[#20885B]",
    DRAFT: "border-[#E4E2E9] bg-[#F5F5F7] text-[#777582]",
    SUBMITTED: "border-[#D7E7FF] bg-[#EFF6FF] text-[#447CBF]",
    CHANGES_REQUESTED: "border-[#F8E3BA] bg-[#FFF8E9] text-[#A87523]",
  };

  const labels: Record<ProductStatus, string> = {
    PUBLISHED: "Published",
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    CHANGES_REQUESTED: "Changes Requested",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Rating({ rating }: { rating: number | null }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#F3E7C9] bg-[#FFFBF0] px-2.5 py-1.5">
      <Star size={14} className="fill-current text-amber-400" />
      <span className="text-xs font-semibold text-gray-700">
        {rating ?? "N/A"}
      </span>
    </div>
  );
}
