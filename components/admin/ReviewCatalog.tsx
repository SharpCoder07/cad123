"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import DeleteReviewButton from "@/components/admin/DeleteReviewButton";

type Review = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string };
  product: { id: number; name: string; slug: string };
};
type Props = { reviews: Review[]; canEdit: boolean; canDelete: boolean };
type SortOption = "newest" | "oldest" | "rating-high" | "rating-low";

export default function ReviewCatalog({
  reviews,
  canEdit: _canEdit,
  canDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [productId, setProductId] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const products = useMemo(() => {
    const map = new Map<number, string>();
    reviews.forEach((review) =>
      map.set(review.product.id, review.product.name),
    );
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews
      .filter((review) => {
        const searchable = [
          review.user.name,
          review.user.email,
          review.product.name,
          review.title,
          review.comment,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!query || searchable.includes(query)) &&
          (rating === "all" || String(review.rating) === rating) &&
          (productId === "all" || String(review.product.id) === productId)
        );
      })
      .sort((a, b) => {
        if (sort === "rating-high") return b.rating - a.rating;
        if (sort === "rating-low") return a.rating - b.rating;
        const difference =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sort === "oldest" ? -difference : difference;
      });
  }, [reviews, search, rating, productId, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const first = filteredReviews.length ? (currentPage - 1) * pageSize + 1 : 0;
  const last = Math.min(currentPage * pageSize, filteredReviews.length);
  const activeFilters =
    Number(rating !== "all") +
    Number(productId !== "all") +
    Number(sort !== "newest");
  const hasFilters = Boolean(search.trim()) || activeFilters > 0;

  function resetFilters() {
    setSearch("");
    setRating("all");
    setProductId("all");
    setSort("newest");
    setPage(1);
  }

  const selectClass =
    "h-10 min-w-0 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B6A3D8] focus:ring-2 focus:ring-[#F0EBFA]";

  return (
    <section className="min-w-0 overflow-hidden rounded-[21px] border border-[#EAE7EF] bg-white shadow-[0_8px_28px_rgba(43,32,60,0.035)]">
      <div className="px-5 pb-5 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <MessageSquareText size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Review Library
              </h2>
              <p className="mt-0.5 text-[13px] text-[#77808E]">
                Search and manage customer product reviews
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F0EBFA] px-3 py-1.5 text-[12px] font-medium text-[#8065B0]">
              {filteredReviews.length} of {reviews.length} reviews
            </span>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilters > 0 && (
                <span className="rounded-full bg-[#F0EBFA] px-1.5 py-0.5 text-[11px] text-[#8065B0]">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A95A3]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by reviewer, product or review..."
            className="h-10 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-10 pr-10 text-[13px] text-[#1F2430] outline-none placeholder:text-[#A39CAB] focus:border-[#B6A3D8] focus:ring-2 focus:ring-[#F0EBFA]"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9A95A3] hover:text-[#44414C]"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-xl border border-[#EEEAF2] bg-[#FBFAFD] p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_auto]">
            <select
              aria-label="Filter by rating"
              value={rating}
              onChange={(event) => {
                setRating(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} stars
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by product"
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort reviews"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortOption);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating-high">Highest rating</option>
              <option value="rating-low">Lowest rating</option>
            </select>
            <button
              type="button"
              disabled={!hasFilters}
              onClick={resetFilters}
              className="h-10 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {filteredReviews.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[990px] border-collapse text-left">
              <thead className="border-y border-[#EEEAF2] bg-[#FAF9FC]">
                <tr>
                  <Heading>Reviewer</Heading>
                  <Heading>Product</Heading>
                  <Heading>Rating</Heading>
                  <Heading>Review</Heading>
                  <Heading>Date</Heading>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9891A3]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAF2]">
                {visibleReviews.map((review) => (
                  <tr key={review.id} className="transition hover:bg-[#FBFAFD]">
                    <td className="px-5 py-3.5">
                      <Reviewer review={review} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="block max-w-[170px] truncate text-[13px] font-medium text-[#44414C]"
                        title={review.product.name}
                      >
                        {review.product.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RatingBadge rating={review.rating} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="max-w-[260px]">
                        <p className="truncate text-[13px] font-medium text-[#292633]">
                          {review.title || "Untitled review"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#77808E]">
                          {review.comment || "No comment provided."}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-[#77808E]">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${review.product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
                        >
                          View <ArrowUpRight size={14} />
                        </Link>
                        {canDelete && (
                          <DeleteReviewButton reviewId={review.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[#EEEAF2] border-t border-[#EEEAF2] md:hidden">
            {visibleReviews.map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Reviewer review={review} />
                  <RatingBadge rating={review.rating} />
                </div>
                <div className="mt-3 rounded-xl border border-[#EEEAF2] bg-[#FBFAFD] p-3">
                  <p className="text-[13px] font-semibold text-[#292633]">
                    {review.title || "Untitled review"}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-[#77808E]">
                    {review.comment || "No comment provided."}
                  </p>
                </div>
                <p className="mt-3 truncate text-[13px] font-medium text-[#44414C]">
                  {review.product.name}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[#9A95A3]">
                    {formatDate(review.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${review.product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] hover:bg-[#F8F6FA]"
                    >
                      View <ArrowUpRight size={14} />
                    </Link>
                    {canDelete && <DeleteReviewButton reviewId={review.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#EEEAF2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#77808E]">
              <span>
                Showing{" "}
                <strong className="text-[#292633]">
                  {first}–{last}
                </strong>{" "}
                of{" "}
                <strong className="text-[#292633]">
                  {filteredReviews.length}
                </strong>{" "}
                reviews
              </span>
              <select
                aria-label="Reviews per page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 cursor-pointer rounded-lg border border-[#E5E2EA] bg-white px-2 text-[12px] text-[#44414C]"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#44414C]">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-16 text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            {reviews.length ? (
              <Search size={22} />
            ) : (
              <MessageSquareText size={22} />
            )}
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-[#292633]">
            {reviews.length ? "No matching reviews" : "No reviews yet"}
          </h3>
          <p className="mt-1 max-w-sm text-[13px] text-[#77808E]">
            {reviews.length
              ? "Try adjusting your search or filters."
              : "Customer reviews will appear here once users submit them."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 h-9 cursor-pointer rounded-xl bg-[#25232C] px-4 text-[12px] font-medium text-white hover:bg-[#403948]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9891A3]">
      {children}
    </th>
  );
}
function Reviewer({ review }: { review: Review }) {
  const initial = (review.user.name || review.user.email || "U")
    .charAt(0)
    .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[14px] font-semibold text-[#8065B0]">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="max-w-[180px] truncate text-[13px] font-semibold text-[#292633]">
          {review.user.name || "Unknown"}
        </p>
        <p
          className="mt-0.5 max-w-[180px] truncate text-[12px] text-[#9A95A3]"
          title={review.user.email}
        >
          {review.user.email}
        </p>
      </div>
    </div>
  );
}
function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#F1DFC1] bg-[#FFF8EA] px-2.5 py-1.5 text-[12px] font-medium text-[#A16C19]">
      <Star size={13} className="fill-current" /> {rating}/5
    </span>
  );
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN");
}
