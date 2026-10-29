"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

type VendorStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

type Vendor = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  website: string | null;
  logo: string | null;
  status: VendorStatus;
  userCount: number;
  productCount: number;
  createdAt: string;
};

type VendorCatalogProps = {
  vendors: Vendor[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type StatusFilter = "ALL" | VendorStatus;
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

const PAGE_SIZE = 10;

const statusStyles: Record<VendorStatus, string> = {
  ACTIVE: "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",
  PENDING: "border-[#F3E4BE] bg-[#FFFAEB] text-[#A77C23]",
  SUSPENDED: "border-[#F6D9DC] bg-[#FFF0F1] text-[#D35D68]",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function VendorCatalog({
  vendors,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: VendorCatalogProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Vendor deletion is not wired up in the original component.
  // Keep the permission prop without introducing an unsupported API action.
  void canDelete;

  const activeFilterCount =
    (status !== "ALL" ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);
  const hasActiveFilters = Boolean(search.trim()) || activeFilterCount > 0;

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = vendors.filter((vendor) => {
      const matchesSearch =
        !query ||
        vendor.name.toLowerCase().includes(query) ||
        vendor.slug.toLowerCase().includes(query) ||
        Boolean(vendor.email?.toLowerCase().includes(query)) ||
        Boolean(vendor.website?.toLowerCase().includes(query));
      return matchesSearch && (status === "ALL" || vendor.status === status);
    });

    result.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      const dateDiff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? dateDiff : -dateDiff;
    });
    return result;
  }, [vendors, search, status, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleVendors = filteredVendors.slice(
    firstIndex,
    firstIndex + PAGE_SIZE,
  );

  function resetFilters() {
    setSearch("");
    setStatus("ALL");
    setSortBy("newest");
    setPage(1);
  }

  const selectClass = (selected: boolean) =>
    `h-11 w-full cursor-pointer appearance-none rounded-xl border bg-white px-3.5 pr-10 text-[13px] font-medium outline-none transition focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] ${
      selected
        ? "border-[#CBB7E7] bg-[#FCFAFF] text-[#6F55A1]"
        : "border-[#E5E2EA] text-[#55515F]"
    }`;

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
      <div className="border-b border-[#F0EDF4] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <Building2 size={20} />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold text-[#252632]">
                Vendor Directory
              </h2>
              <p className="mt-0.5 text-[13px] text-[#848797]">
                Browse and manage registered vendor companies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="whitespace-nowrap rounded-full border border-[#E9E4F0] bg-[#F8F6FC] px-3 py-1.5 text-xs font-medium text-[#71677F]">
              {filteredVendors.length} of {vendors.length} vendors
            </span>
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition ${
                filtersOpen || activeFilterCount > 0
                  ? "border-[#D8C9EE] bg-[#F0EBFA] text-[#7655A9]"
                  : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"
              }`}
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8065B0] px-1 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39CAC]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors by name, email, website or slug..."
              aria-label="Search vendors"
              className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-4 text-[13px] text-[#252632] outline-none transition placeholder:text-[#A29DAA] focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA]"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3.5 text-[13px] font-medium text-[#55515F] transition hover:bg-[#F8F6FA]"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <select
                aria-label="Filter by vendor status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusFilter)
                }
                className={selectClass(status !== "ALL")}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#928B9B]"
              />
            </div>
            <div className="relative">
              <select
                aria-label="Sort vendors"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className={selectClass(sortBy !== "newest")}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#928B9B]"
              />
            </div>
          </div>
        )}
      </div>

      {filteredVendors.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
            <Building2 size={24} />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold text-[#252632]">
            {vendors.length === 0 ? "No vendors yet" : "No vendors found"}
          </h3>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-[#848797]">
            {vendors.length === 0
              ? "Create your first vendor company to start assigning vendor users and products."
              : "Try changing your search term or filters."}
          </p>
          {vendors.length === 0 && canCreate && (
            <Link
              href="/admin/vendors/new"
              className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
            >
              <Plus size={16} /> Add Vendor
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left">
            <thead className="border-b border-[#F0EDF4] bg-[#FAF9FC]">
              <tr>
                {(
                  [
                    "Vendor",
                    "Status",
                    "Users",
                    "Products",
                    "Created",
                    ...(canEdit ? ["Action"] : []),
                  ] as string[]
                ).map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8D8797] ${heading === "Action" ? "text-right" : ""}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1EEF4]">
              {visibleVendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="transition-colors hover:bg-[#FCFBFE]"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[230px] items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE5F1] bg-[#F5F0FB] text-[#8065B0]">
                        {vendor.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vendor.logo}
                            alt={vendor.name}
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <Building2 size={19} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[230px] truncate text-[13px] font-semibold text-[#252632]">
                          {vendor.name}
                        </p>
                        <p className="mt-0.5 max-w-[230px] truncate text-xs text-[#898594]">
                          {vendor.email || vendor.website || vendor.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[vendor.status]}`}
                    >
                      {vendor.status.charAt(0) +
                        vendor.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#55515F]">
                      <Users size={15} className="text-[#A29CAB]" />{" "}
                      {vendor.userCount}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#55515F]">
                      <Package size={15} className="text-[#A29CAB]" />{" "}
                      {vendor.productCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[13px] text-[#77717F]">
                    {dateFormatter.format(new Date(vendor.createdAt))}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/vendors/${vendor.id}`}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#55515F] transition hover:border-[#D8C9EE] hover:bg-[#F8F6FC] hover:text-[#8065B0]"
                      >
                        Manage <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredVendors.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF4] px-5 py-4">
          <p className="text-xs text-[#898594]">
            Showing {firstIndex + 1}–
            {Math.min(firstIndex + PAGE_SIZE, filteredVendors.length)} of{" "}
            {filteredVendors.length} vendors
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#55515F] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-20 text-center text-xs font-medium text-[#55515F]">
              {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#55515F] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
