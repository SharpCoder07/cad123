"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Package, RotateCcw, Search } from "lucide-react";

type Props = {
  search: string;
  status: string;
  sort: string;
  statuses: { value: string; label: string }[];
  filteredCount: number;
  total: number;
};

export default function VendorProductFilters({
  search,
  status,
  sort,
  statuses,
  filteredCount,
  total,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(search);
    setSelectedStatus(status);
    setSelectedSort(sort);
  }, [search, status, sort]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const count =
    Number(selectedStatus !== "ALL") + Number(selectedSort !== "newest");
  const changed = query.trim() !== "" || count > 0;

  function navigate(nextSearch: string, nextStatus: string, nextSort: string) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextSort !== "newest") params.set("sort", nextSort);
    const qs = params.toString();
    startTransition(() =>
      router.replace(`/vendor/products${qs ? `?${qs}` : ""}`, {
        scroll: false,
      }),
    );
  }

  function onSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => navigate(value, selectedStatus, selectedSort),
      350,
    );
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            <Package size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[#25232C]">
              Product Catalog
            </h2>
            <p className="mt-0.5 text-[12px] text-[#85808D]">
              Search, filter and manage your products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap rounded-full bg-[#F4F0F9] px-3 py-1.5 text-[12px] font-medium text-[#77658F]">
            {filteredCount.toLocaleString("en-IN")} of{" "}
            {total.toLocaleString("en-IN")} products
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition ${count ? "border-[#CDBCEB] bg-[#F4EFFC] text-[#7655AC]" : "border-[#E7E3ED] bg-white text-[#595462] hover:bg-[#F8F6FA]"}`}
          >
            <SlidersHorizontal size={16} /> Filters
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8065B0] px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A29BAE]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by product, brand or category..."
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-[#E7E3ED] bg-[#FAF9FC] pl-10 pr-4 text-[13px] text-[#34303C] outline-none transition placeholder:text-[#A19BA9] focus:border-[#A78BD0] focus:ring-2 focus:ring-[#F0EBFA]"
          />
        </div>
        {changed && (
          <button
            type="button"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setQuery("");
              setSelectedStatus("ALL");
              setSelectedSort("newest");
              navigate("", "ALL", "newest");
            }}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E7E3ED] bg-white px-3.5 text-[13px] font-medium text-[#686372] hover:bg-[#F8F6FA]"
          >
            <RotateCcw size={15} /> Reset
          </button>
        )}
      </div>
      {expanded && (
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={selectedStatus}
            onChange={(event) => {
              const value = event.target.value;
              if (timer.current) clearTimeout(timer.current);
              setSelectedStatus(value);
              navigate(query, value, selectedSort);
            }}
            aria-label="Filter by product status"
            className={`h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#484352] outline-none focus:ring-2 focus:ring-[#F0EBFA] ${selectedStatus !== "ALL" ? "border-[#B99DE2]" : "border-[#E7E3ED]"}`}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={selectedSort}
            onChange={(event) => {
              const value = event.target.value;
              if (timer.current) clearTimeout(timer.current);
              setSelectedSort(value);
              navigate(query, selectedStatus, value);
            }}
            aria-label="Sort products"
            className={`h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#484352] outline-none focus:ring-2 focus:ring-[#F0EBFA] ${selectedSort !== "newest" ? "border-[#B99DE2]" : "border-[#E7E3ED]"}`}
          >
            <option value="newest">Recently updated</option>
            <option value="oldest">Oldest updated</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>
      )}
    </div>
  );
}
