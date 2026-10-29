"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tags,
  X,
} from "lucide-react";

import DeleteBrandButton from "@/components/admin/DeleteBrandButton";

type Brand = {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  createdAt: string;
};

type Props = {
  brands: Brand[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type WebsiteFilter = "all" | "with-website" | "without-website";

const PAGE_SIZES = [10, 20, 50];

const selectClass =
  "min-h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none transition focus:border-[#B9A9D5] focus:ring-4 focus:ring-[#F3EDF9]";

export default function BrandCatalog({
  brands,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brands
      .filter((brand) => {
        const matchesSearch =
          !query ||
          brand.name.toLowerCase().includes(query) ||
          brand.slug.toLowerCase().includes(query) ||
          (brand.website?.toLowerCase().includes(query) ?? false);

        const hasWebsite = Boolean(brand.website?.trim());

        const matchesWebsite =
          websiteFilter === "all" ||
          (websiteFilter === "with-website" && hasWebsite) ||
          (websiteFilter === "without-website" && !hasWebsite);

        return matchesSearch && matchesWebsite;
      })
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [brands, search, sort, websiteFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBrands.slice(start, start + pageSize);
  }, [filteredBrands, currentPage, pageSize]);

  const hasFilters =
    search.trim() !== "" || sort !== "newest" || websiteFilter !== "all";

  const activeFilterCount = Number(websiteFilter !== "all");

  function resetFilters() {
    setSearch("");
    setSort("newest");
    setWebsiteFilter("all");
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateSort(value: SortOption) {
    setSort(value);
    setPage(1);
  }

  function updateWebsiteFilter(value: WebsiteFilter) {
    setWebsiteFilter(value);
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const startItem =
    filteredBrands.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(currentPage * pageSize, filteredBrands.length);

  return (
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-[#E9E5EF] bg-white shadow-[0_5px_24px_rgba(49,38,67,0.025)]">
      {/* Catalog header */}
      <div className="border-b border-[#F0ECF4] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EAFB] text-[#8063B2]">
              <Tags size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Brand Catalog
              </h2>
              <p className="mt-1 text-[12px] text-[#77808E]">
                Search, filter and manage your software brands
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F3EFF8] px-3 py-1.5 text-[12px] font-medium text-[#79678E]">
              {filteredBrands.length} of {brands.length} brands
            </span>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition ${
                showFilters
                  ? "border-[#D9C9EC] bg-[#F4EEFB] text-[#75569E]"
                  : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#8063B2] px-1.5 py-0.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and reset */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C94A7]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search by brand name, slug or website..."
              className="min-h-10 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-10 pr-10 text-[13px] text-[#1F2430] outline-none transition placeholder:text-[#A19AAA] focus:border-[#B9A9D5] focus:bg-white focus:ring-4 focus:ring-[#F3EDF9]"
            />

            {search && (
              <button
                type="button"
                onClick={() => updateSearch("")}
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
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Filter brands by website"
              value={websiteFilter}
              onChange={(event) =>
                updateWebsiteFilter(event.target.value as WebsiteFilter)
              }
              className={selectClass}
            >
              <option value="all">All brands</option>
              <option value="with-website">With website</option>
              <option value="without-website">Without website</option>
            </select>

            <select
              aria-label="Sort brands"
              value={sort}
              onChange={(event) => updateSort(event.target.value as SortOption)}
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </div>
        )}
      </div>

      {filteredBrands.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECF4] bg-[#FAFAFB]">
                  <TableHeading>Brand</TableHeading>
                  <TableHeading>Slug</TableHeading>
                  <TableHeading>Website</TableHeading>
                  <TableHeading>Created</TableHeading>

                  {(canEdit || canDelete) && (
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[#91899D]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1EDF4]">
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="group transition hover:bg-[#FBF9FD]"
                  >
                    <td className="px-5 py-3.5">
                      <BrandIdentity brand={brand} />
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex max-w-[180px] truncate rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
                        {brand.slug}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <WebsiteLink website={brand.website} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#77808E]">
                      {new Date(brand.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/brands/${brand.id}/edit`}
                              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:border-[#D5CBE0] hover:bg-[#F8F6FA]"
                            >
                              Edit
                              <ArrowUpRight size={14} />
                            </Link>
                          )}

                          {canDelete && (
                            <DeleteBrandButton brandId={brand.id} />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-[#F1EDF4] md:hidden">
            {paginatedBrands.map((brand) => (
              <div key={brand.id} className="p-5">
                <BrandIdentity brand={brand} />

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Slug
                    </p>
                    <p className="mt-1 break-all text-sm text-gray-700">
                      {brand.slug}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Website
                    </p>
                    <div className="mt-1">
                      <WebsiteLink website={brand.website} />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Added{" "}
                    {new Date(brand.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {(canEdit || canDelete) && (
                  <div className="mt-5 flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={`/admin/brands/${brand.id}/edit`}
                        className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
                      >
                        Edit Brand
                        <ArrowUpRight size={14} />
                      </Link>
                    )}

                    {canDelete && <DeleteBrandButton brandId={brand.id} />}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-[#EEEAF2] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-[#77808E]">
                Showing{" "}
                <span className="font-semibold text-[#1F2430]">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#1F2430]">
                  {filteredBrands.length}
                </span>{" "}
                brands
              </p>

              <select
                aria-label="Brands per page"
                value={pageSize}
                onChange={(event) => updatePageSize(Number(event.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-[#E5E2EA] bg-white px-2 text-[12px] font-medium text-[#44414C] outline-none"
              >
                {PAGE_SIZES.map((size) => (
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-20 text-center text-xs font-semibold text-[#44414C]">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EAFB] text-[#8063B2]">
            {brands.length === 0 ? <Tags size={24} /> : <Search size={23} />}
          </span>

          <h3 className="mt-4 text-base font-semibold text-[#1F2430]">
            {brands.length === 0 ? "No brands yet" : "No matching brands"}
          </h3>

          <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
            {brands.length === 0
              ? "Add your first software brand to start building the catalog."
              : "Try changing your search or filter options."}
          </p>

          {brands.length === 0 ? (
            canCreate ? (
              <Link
                href="/admin/brands/new"
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#403948]"
              >
                <Plus size={16} />
                Add Brand
              </Link>
            ) : null
          ) : (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#403948]"
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
    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#91899D]">
      {children}
    </th>
  );
}

function BrandIdentity({ brand }: { brand: Brand }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1EAFB] text-sm font-semibold text-[#8063B2]">
        {brand.name.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0">
        <span className="block max-w-[200px] truncate text-sm font-semibold text-[#1F2430]">
          {brand.name}
        </span>

        <span className="mt-1 block text-xs text-gray-400">ID #{brand.id}</span>
      </span>
    </div>
  );
}

function WebsiteLink({ website }: { website: string | null }) {
  if (!website?.trim()) {
    return <span className="inline-flex rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">Not provided</span>;
  }

  // Only link to valid HTTP(S) websites.
  let safeUrl: string;

  try {
    const url = new URL(website);
    if (!["http:", "https:"].includes(url.protocol)) {
      return <span className="inline-flex rounded-lg border border-[#F0E2C9] bg-[#FFF9ED] px-2.5 py-1.5 text-xs font-medium text-[#A87928]">Invalid URL</span>;
    }
    safeUrl = url.href;
  } catch {
    return <span className="inline-flex rounded-lg border border-[#F0E2C9] bg-[#FFF9ED] px-2.5 py-1.5 text-xs font-medium text-[#A87928]">Invalid URL</span>;
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-[230px] cursor-pointer items-center gap-1.5 text-xs font-medium text-[#44414C] transition hover:text-[#8063B2]"
    >
      <Globe size={14} className="shrink-0" />
      <span className="truncate">{website}</span>
      <ExternalLink size={13} className="shrink-0" />
    </a>
  );
}
