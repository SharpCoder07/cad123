"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import DeleteFeatureButton from "@/components/admin/DeleteFeatureButton";

type Feature = {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
};

type Props = {
  features: Feature[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type UsageFilter = "all" | "used" | "unused";

type SortOption = "name-asc" | "name-desc" | "usage-high" | "usage-low";

const PAGE_SIZES = [10, 20, 50];

const selectClass =
  "min-h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none transition focus:border-[#B9A9D5] focus:ring-4 focus:ring-[#F3EDF9]";

export default function FeatureCatalog({
  features,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [usage, setUsage] = useState<UsageFilter>("all");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return features
      .filter((feature) => {
        const matchesSearch =
          !query ||
          feature.name.toLowerCase().includes(query) ||
          (feature.description?.toLowerCase().includes(query) ?? false);

        const matchesUsage =
          usage === "all" ||
          (usage === "used" && feature.productCount > 0) ||
          (usage === "unused" && feature.productCount === 0);

        return matchesSearch && matchesUsage;
      })
      .sort((a, b) => {
        switch (sort) {
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "usage-high":
            return (
              b.productCount - a.productCount || a.name.localeCompare(b.name)
            );
          case "usage-low":
            return (
              a.productCount - b.productCount || a.name.localeCompare(b.name)
            );
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [features, search, usage, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredFeatures.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFeatures.slice(start, start + pageSize);
  }, [filteredFeatures, currentPage, pageSize]);

  const hasFilters =
    search.trim() !== "" || usage !== "all" || sort !== "name-asc";

  function resetFilters() {
    setSearch("");
    setUsage("all");
    setSort("name-asc");
    setPage(1);
  }

  const startItem =
    filteredFeatures.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(currentPage * pageSize, filteredFeatures.length);

  return (
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-[#E9E5EF] bg-white shadow-[0_5px_24px_rgba(49,38,67,0.025)]">
      {/* Header */}
      <div className="border-b border-[#F0ECF4] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EAFB] text-[#8063B2]">
              <Sparkles size={20} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Feature Library
              </h2>

              <p className="mt-1 text-[12px] text-[#77808E]">
                Search and manage reusable product features
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F3EFF8] px-3 py-1.5 text-[12px] font-medium text-[#79678E]">
              {filteredFeatures.length} of {features.length} features
            </span>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition ${
                showFilters
                  ? "border-[#D9C9EC] bg-[#F4EEFB] text-[#75569E]"
                  : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {usage !== "all" && (
                <span className="rounded-full bg-[#8063B2] px-1.5 py-0.5 text-[10px] text-white">
                  1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C94A7]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by feature name or description..."
              className="min-h-10 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-10 pr-10 text-[13px] text-[#1F2430] outline-none transition placeholder:text-[#A19AAA] focus:border-[#B9A9D5] focus:bg-white focus:ring-4 focus:ring-[#F3EDF9]"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 hover:text-[#1F2430]"
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

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Filter features by usage"
              value={usage}
              onChange={(event) => {
                setUsage(event.target.value as UsageFilter);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All usage</option>
              <option value="used">In use</option>
              <option value="unused">Not used</option>
            </select>

            <select
              aria-label="Sort features"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortOption);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="usage-high">Most used</option>
              <option value="usage-low">Least used</option>
            </select>
          </div>
        )}
      </div>

      {filteredFeatures.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-[#EEEAF2] bg-[#FAF9FC]">
                  <TableHeading>Feature</TableHeading>
                  <TableHeading>Description</TableHeading>
                  <TableHeading>Products</TableHeading>

                  {(canEdit || canDelete) && (
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[#91899D]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1EDF4]">
                {paginatedFeatures.map((feature) => (
                  <tr
                    key={feature.id}
                    className="group transition hover:bg-[#FBF9FD]"
                  >
                    <td className="px-5 py-3.5">
                      <FeatureIdentity feature={feature} />
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="max-w-[420px] whitespace-pre-line break-words text-[13px] leading-5 text-[#77808E]">
                        {feature.description || "No description provided."}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <UsageBadge count={feature.productCount} />
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/features/${feature.id}/edit`}
                              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:border-[#D5CBE0] hover:bg-[#F8F6FA]"
                            >
                              Edit
                              <ArrowUpRight size={14} />
                            </Link>
                          )}

                          {canDelete && (
                            <DeleteFeatureButton featureId={feature.id} />
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
            {paginatedFeatures.map((feature) => (
              <div key={feature.id} className="p-5">
                <FeatureIdentity feature={feature} />

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-5 text-[#77808E]">
                    {feature.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Products
                  </p>

                  <div className="mt-2">
                    <UsageBadge count={feature.productCount} />
                  </div>
                </div>

                {(canEdit || canDelete) && (
                  <div className="mt-5 flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={`/admin/features/${feature.id}/edit`}
                        className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
                      >
                        Edit Feature
                        <ArrowUpRight size={14} />
                      </Link>
                    )}

                    {canDelete && (
                      <DeleteFeatureButton featureId={feature.id} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-[#EEEAF2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-[#77808E]">
                Showing{" "}
                <span className="font-semibold text-[#1F2430]">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#1F2430]">
                  {filteredFeatures.length}
                </span>{" "}
                features
              </p>

              <select
                aria-label="Features per page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
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
        <EmptyState
          featuresExist={features.length > 0}
          hasFilters={hasFilters}
          onReset={resetFilters}
          canCreate={canCreate}
        />
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

function FeatureIdentity({ feature }: { feature: Feature }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EAFB] text-[#8063B2]">
        <Sparkles size={18} />
      </span>

      <span className="min-w-0">
        <span className="block max-w-[200px] truncate text-[13px] font-semibold text-[#25232C]">
          {feature.name}
        </span>

        <span className="mt-0.5 block text-[11px] text-[#9991A2]">
          ID #{feature.id}
        </span>
      </span>
    </div>
  );
}

function UsageBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
        Not used
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-medium text-[#278455]">
      <CheckCircle2 size={13} />
      {count} {count === 1 ? "product" : "products"}
    </span>
  );
}

function EmptyState({
  featuresExist,
  hasFilters,
  onReset,
  canCreate,
}: {
  featuresExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EAFB] text-[#8063B2]">
        {featuresExist ? <Search size={23} /> : <Sparkles size={24} />}
      </span>

      <h3 className="mt-4 text-base font-semibold text-[#1F2430]">
        {featuresExist ? "No matching features" : "No features yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {featuresExist
          ? "Try changing your search, usage filter or sorting options."
          : "Create your first reusable feature for the CADGram catalog."}
      </p>

      {!featuresExist && canCreate ? (
        <Link
          href="/admin/features/new"
          className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={16} />
          Add Feature
        </Link>
      ) : hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 min-h-10 cursor-pointer rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
