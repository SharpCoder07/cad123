"use client";

import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  ChevronDown,
} from "lucide-react";

type ProductSortProps = {
  currentSort?: string;
  categorySlug?: string;
  search?: string;
};

export default function ProductSort({
  currentSort,
  categorySlug,
  search,
}: ProductSortProps) {
  const router = useRouter();

  function handleSortChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    const params = new URLSearchParams();

    if (categorySlug) {
      params.set("category", categorySlug);
    }

    if (search) {
      params.set("search", search);
    }

    if (value) {
      params.set("sort", value);
    }

    const queryString = params.toString();

    router.push(
      queryString
        ? `/products?${queryString}`
        : "/products"
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Desktop label */}
      <div
        className="hidden items-center gap-2 text-sm sm:flex"
        style={{
          color: "var(--site-muted)",
        }}
      >
        <ArrowDownUp size={15} />

        <span>Sort by</span>
      </div>

      {/* Select */}
      <div className="relative">
        <select
          id="sort"
          aria-label="Sort products"
          value={currentSort || ""}
          onChange={handleSortChange}
          className="product-sort-select h-11 min-w-[175px] cursor-pointer appearance-none rounded-xl border py-2 pl-4 pr-10 text-sm font-semibold outline-none transition sm:min-w-[190px]"
        >
          <option value="">
            Highest Rated
          </option>

          <option value="reviews">
            Most Reviewed
          </option>

          <option value="name-asc">
            Name: A–Z
          </option>

          <option value="name-desc">
            Name: Z–A
          </option>
        </select>

        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
          style={{
            color: "var(--site-muted)",
          }}
        />
      </div>
    </div>
  );
}