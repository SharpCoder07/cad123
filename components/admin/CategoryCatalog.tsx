"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parent: {
    id: number;
    name: string;
  } | null;
  productCount: number;
  childrenCount: number;
  createdAt: string;
};

type Props = {
  categories: Category[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type CategoryType = "all" | "top-level" | "subcategory";

type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "products-high"
  | "products-low";

const PAGE_SIZES = [10, 20, 50];

const selectClass =
  "h-11 w-full min-w-0 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none transition focus:border-[#A58ACB] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export default function CategoryCatalog({
  categories,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<CategoryType>("all");
  const [parentId, setParentId] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const parentCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          !query ||
          category.name.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query) ||
          (category.parent?.name.toLowerCase().includes(query) ?? false);

        const matchesType =
          type === "all" ||
          (type === "top-level" && category.parentId === null) ||
          (type === "subcategory" && category.parentId !== null);

        const matchesParent =
          parentId === "all" || String(category.parentId) === parentId;

        return matchesSearch && matchesType && matchesParent;
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
          case "products-high":
            return b.productCount - a.productCount;
          case "products-low":
            return a.productCount - b.productCount;
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [categories, search, type, parentId, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const hasFilters =
    search.trim() !== "" ||
    type !== "all" ||
    parentId !== "all" ||
    sort !== "newest";

  const activeFilterCount = Number(type !== "all") + Number(parentId !== "all");

  function resetFilters() {
    setSearch("");
    setType("all");
    setParentId("all");
    setSort("newest");
    setPage(1);
  }

  function updateType(value: CategoryType) {
    setType(value);
    if (value === "top-level") {
      setParentId("all");
    }
    setPage(1);
  }

  function updateParent(value: string) {
    setParentId(value);
    if (value !== "all") {
      setType("subcategory");
    }
    setPage(1);
  }

  const startItem =
    filteredCategories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(currentPage * pageSize, filteredCategories.length);

  return (
    <section className="min-w-0 overflow-hidden rounded-[21px] border border-[#EAE6EF] bg-white shadow-[0_8px_28px_rgba(43,32,60,0.035)]">
      {/* Catalog header */}
      <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <FolderTree size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Category Catalog
              </h2>
              <p className="mt-1 text-xs text-[#77808E]">
                Search, filter and manage your category hierarchy
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-3 py-1.5 text-xs font-medium text-[#77717F]">
              {filteredCategories.length} of {categories.length} categories
            </span>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition ${
                showFilters
                  ? "border-[#DCD1EF] bg-[#F0EBFA] text-[#8065B0]"
                  : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#8065B0] px-1.5 py-0.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by category, slug or parent..."
              className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFC] pl-11 pr-10 text-[13px] text-[#1F2430] outline-none transition placeholder:text-[#A5A0AD] focus:border-[#A58ACB] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
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
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <select
              aria-label="Filter by category type"
              value={type}
              onChange={(event) =>
                updateType(event.target.value as CategoryType)
              }
              className={selectClass}
            >
              <option value="all">All types</option>
              <option value="top-level">Top-level</option>
              <option value="subcategory">Subcategories</option>
            </select>

            <select
              aria-label="Filter by parent category"
              value={parentId}
              onChange={(event) => updateParent(event.target.value)}
              disabled={type === "top-level"}
              className={selectClass}
            >
              <option value="all">All parents</option>
              {parentCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort categories"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortOption);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="products-high">Most products</option>
              <option value="products-low">Fewest products</option>
            </select>
          </div>
        )}
      </div>

      {filteredCategories.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr className="border-b border-[#F0EDF3] bg-[#FBFAFC]">
                  <TableHeading>Category</TableHeading>
                  <TableHeading>Slug</TableHeading>
                  <TableHeading>Parent</TableHeading>
                  <TableHeading>Products</TableHeading>
                  <TableHeading>Subcategories</TableHeading>

                  {(canEdit || canDelete) && (
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-[#918A99]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EDF3]">
                {paginatedCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="group transition hover:bg-[#FBFAFC]"
                  >
                    <td className="px-5 py-4">
                      <CategoryIdentity category={category} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex max-w-[180px] truncate rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
                        {category.slug}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {category.parent ? (
                        <span className="inline-flex max-w-[180px] truncate rounded-lg border border-[#E5E2EA] bg-white px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
                          {category.parent.name}
                        </span>
                      ) : (
                        <span className="rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-medium text-[#278455]">
                          Top-level
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <CountBadge value={category.productCount} />
                    </td>

                    <td className="px-5 py-4">
                      <CountBadge value={category.childrenCount} />
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/categories/${category.id}/edit`}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 py-2 text-xs font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
                            >
                              Edit
                              <ArrowUpRight size={14} />
                            </Link>
                          )}

                          {canDelete && (
                            <DeleteCategoryButton categoryId={category.id} />
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
          <div className="divide-y divide-[#F0EDF3] md:hidden">
            {paginatedCategories.map((category) => (
              <div key={category.id} className="p-5">
                <CategoryIdentity category={category} />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatBox label="Products" value={category.productCount} />
                  <StatBox
                    label="Subcategories"
                    value={category.childrenCount}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Slug
                    </p>
                    <p className="mt-1 break-all text-sm text-gray-700">
                      {category.slug}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Parent
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {category.parent?.name ?? "Top-level category"}
                    </p>
                  </div>
                </div>

                {(canEdit || canDelete) && (
                  <div className="mt-5 flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#403948]"
                      >
                        Edit Category
                        <ArrowUpRight size={14} />
                      </Link>
                    )}

                    {canDelete && (
                      <DeleteCategoryButton categoryId={category.id} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredCategories.length}
                </span>{" "}
                categories
              </p>

              <select
                aria-label="Categories per page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none"
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          categoriesExist={categories.length > 0}
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
    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#918A99]">
      {children}
    </th>
  );
}

function CategoryIdentity({ category }: { category: Category }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-semibold text-[#8065B0]">
        {category.name.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0">
        <span className="block max-w-[200px] truncate text-sm font-semibold text-[#1F2430]">
          {category.name}
        </span>
        <span className="mt-1 block text-xs text-gray-400">
          ID #{category.id}
        </span>
      </span>
    </div>
  );
}

function CountBadge({ value }: { value: number }) {
  return value > 0 ? (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-medium text-[#278455]">
      <CheckCircle2 size={13} /> {value}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
      0
    </span>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#EAE6EF] bg-[#FBFAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#1F2430]">{value}</p>
    </div>
  );
}

function EmptyState({
  categoriesExist,
  hasFilters,
  onReset,
  canCreate,
}: {
  categoriesExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
        {categoriesExist ? <Search size={23} /> : <FolderTree size={24} />}
      </span>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {categoriesExist ? "No matching categories" : "No categories yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {categoriesExist
          ? "Try changing your search, category type, parent or sorting options."
          : "Add your first category to start organizing the CADGram catalog."}
      </p>

      {!categoriesExist && canCreate ? (
        <Link
          href="/admin/categories/new"
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={16} />
          Add Category
        </Link>
      ) : hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
