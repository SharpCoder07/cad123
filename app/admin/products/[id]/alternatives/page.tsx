"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GitCompareArrows,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

type AlternativeProduct = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  shortDescription: string | null;
  rating: number | null;
};

type ProductAlternative = {
  id: number;
  alternativeId: number;
  alternative: AlternativeProduct;
};

type SortOption = "name-asc" | "name-desc" | "rating-desc" | "rating-asc";

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function ProductAlternativesPage() {
  const params = useParams();
  const productId = params.id as string;

  const alternativesUrl = `/admin/products/${productId}/alternatives`;

  const [alternatives, setAlternatives] = useState<ProductAlternative[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const hasActiveFilters = search.trim().length > 0 || sortBy !== "name-asc";
  const resetFilters = () => {
    setSearch("");
    setSortBy("name-asc");
  };

  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const [removingId, setRemovingId] = useState<number | null>(null);

  const [mounted, setMounted] = useState(false);

  const loadAlternatives = useCallback(
    async (signal?: AbortSignal, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setLoadError("");

        const response = await fetch(
          `/api/admin/products/${productId}/alternatives`,
          {
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load product alternatives.",
          );
        }

        if (signal?.aborted) return;

        setAlternatives(
          Array.isArray(data.alternatives) ? data.alternatives : [],
        );
      } catch (error) {
        if (signal?.aborted) return;

        console.error("Load product alternatives error:", error);

        const message =
          error instanceof Error ? error.message : "Something went wrong.";

        setLoadError(message);

        if (isRefresh) {
          toast.error(message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();

    void loadAlternatives(controller.signal);

    return () => controller.abort();
  }, [productId, loadAlternatives]);

  const statistics = useMemo(() => {
    const rated = alternatives.filter(
      (item) => item.alternative.rating !== null,
    );

    const averageRating =
      rated.length > 0
        ? rated.reduce(
            (sum, item) => sum + Number(item.alternative.rating),
            0,
          ) / rated.length
        : null;

    return {
      total: alternatives.length,
      rated: rated.length,
      unrated: alternatives.length - rated.length,
      averageRating,
    };
  }, [alternatives]);

  const filteredAlternatives = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = alternatives.filter((item) => {
      const product = item.alternative;

      return (
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        (product.shortDescription || "").toLowerCase().includes(query)
      );
    });

    result.sort((a, b) => {
      const productA = a.alternative;
      const productB = b.alternative;

      switch (sortBy) {
        case "name-desc":
          return productB.name.localeCompare(productA.name);

        case "rating-desc":
          return (productB.rating ?? -1) - (productA.rating ?? -1);

        case "rating-asc":
          return (productA.rating ?? Infinity) - (productB.rating ?? Infinity);

        default:
          return productA.name.localeCompare(productB.name);
      }
    });

    return result;
  }, [alternatives, search, sortBy]);

  const selectedAlternative =
    confirmRemoveId !== null
      ? alternatives.find((item) => item.alternativeId === confirmRemoveId)
      : null;

  async function handleRemove(alternativeId: number) {
    if (removingId !== null) return;

    try {
      setRemovingId(alternativeId);

      const response = await fetch(
        `/api/admin/products/${productId}/alternatives`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alternativeId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to remove alternative product.");
        return;
      }

      setAlternatives((current) =>
        current.filter((item) => item.alternativeId !== alternativeId),
      );

      setConfirmRemoveId(null);

      toast.success("Alternative product removed successfully.");
    } catch (error) {
      console.error("Remove product alternative error:", error);

      toast.error("Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    if (confirmRemoveId === null) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && removingId === null) {
        setConfirmRemoveId(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [confirmRemoveId, removingId]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href="/admin/products"
              className="cursor-pointer transition hover:text-gray-900"
            >
              Products
            </Link>

            <ChevronRight size={14} />

            <Link
              href={`/admin/products/${productId}/edit`}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Edit Product
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Alternatives</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <GitCompareArrows size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Alternatives
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage other products recommended as alternatives to this
                product.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#505666] transition hover:bg-[#F8F6FC]"
          >
            <ArrowLeft size={16} />
            Back to Product
          </Link>
          <button
            type="button"
            onClick={() => void loadAlternatives(undefined, true)}
            disabled={loading || refreshing}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#505666] transition hover:bg-[#F8F6FC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            href={`${alternativesUrl}/new`}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={17} />
            Add Alternative
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<GitCompareArrows size={19} />}
          label="Total Alternatives"
          value={statistics.total}
          description="Associated products"
          loading={loading}
          tone="lavender"
        />

        <StatCard
          icon={<Star size={19} />}
          label="Rated Alternatives"
          value={statistics.rated}
          description="Products with ratings"
          loading={loading}
          tone="mint"
        />

        <StatCard
          icon={<Star size={19} />}
          label="Average Rating"
          value={
            statistics.averageRating === null
              ? "N/A"
              : statistics.averageRating.toFixed(1)
          }
          description="Across rated alternatives"
          loading={loading}
          tone="peach"
        />

        <StatCard
          icon={<ArrowUpRight size={19} />}
          label="Unrated Products"
          value={statistics.unrated}
          description="Products without ratings"
          loading={loading}
          tone="lavender"
        />
      </section>

      {/* Alternatives Library */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Alternative Products
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Browse and manage linked product alternatives.
              </p>
            </div>

            <span className="w-fit rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
              {filteredAlternatives.length} products
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products by name, slug, or description..."
                className="h-9 w-full rounded-lg border border-[#EAE7EF] bg-[#FBFAFD] pl-10 pr-4 text-[13px] text-[#25232C] outline-none transition placeholder:text-[#9AA0AC] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
              />
            </div>

            <div className="relative sm:w-52">
              <select
                aria-label="Sort alternatives"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#EAE7EF] bg-white pl-3.5 pr-10 text-[13px] font-medium text-[#505666] outline-none transition focus:border-[#A48ACD] focus:ring-4 focus:ring-[#F0EBFA]"
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="rating-asc">Lowest Rated</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#776394] transition hover:bg-[#F5F0FA]"
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="h-36 animate-pulse bg-gray-100" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  <div className="mt-5 h-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-10 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
              Unable to load alternatives
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void loadAlternatives()}
              className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : filteredAlternatives.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              {alternatives.length === 0 ? (
                <GitCompareArrows size={25} />
              ) : (
                <Search size={25} />
              )}
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
              {alternatives.length === 0
                ? "No alternatives yet"
                : "No matching products"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {alternatives.length === 0
                ? "Add alternative products to help visitors discover similar solutions."
                : "Try another search term or change the sorting option."}
            </p>

            {alternatives.length === 0 ? (
              <Link
                href={`${alternativesUrl}/new`}
                className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white hover:bg-[#403948]"
              >
                <Plus size={16} />
                Add Alternative
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 cursor-pointer text-sm font-semibold text-gray-900 underline underline-offset-4"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {filteredAlternatives.map((item) => {
              const alternative = item.alternative;

              return (
                <article
                  key={item.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]"
                >
                  {/* Logo */}
                  <div className="flex h-36 items-center justify-center border-b border-gray-100 bg-[#F9FAFB] px-6">
                    {alternative.logo ? (
                      <img
                        src={alternative.logo}
                        alt={`${alternative.name} logo`}
                        className="max-h-20 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE0FA] text-2xl font-semibold text-[#8260B4]">
                        {alternative.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-gray-950">
                          {alternative.name}
                        </h3>

                        <p className="mt-1 truncate text-xs text-gray-400">
                          {alternative.slug}
                        </p>
                      </div>

                      {alternative.rating !== null && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                          <Star size={12} className="fill-current" />

                          {Number(alternative.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 min-h-[72px] flex-1 text-sm leading-6 text-gray-500">
                      {alternative.shortDescription ||
                        "No short description available."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                      <Link
                        href={`/products/${alternative.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#EAE7EF] bg-white px-2.5 text-[12px] font-medium text-[#505666] transition hover:bg-[#F8F6FC]"
                      >
                        View Product
                        <ExternalLink size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(item.alternativeId)}
                        disabled={removingId !== null}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#F6D9DC] bg-[#FFF0F1] px-2.5 text-[12px] font-medium text-[#DC5361] transition hover:bg-[#FCE6E8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      {mounted &&
        selectedAlternative &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && removingId === null) {
                setConfirmRemoveId(null);
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-title"
              aria-describedby="remove-description"
              className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2 size={21} />
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  disabled={removingId !== null}
                  aria-label="Close dialog"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <h2
                id="remove-title"
                className="mt-5 text-lg font-bold text-gray-950"
              >
                Remove Alternative?
              </h2>

              <p
                id="remove-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                Remove{" "}
                <strong className="text-gray-800">
                  {selectedAlternative.alternative.name}
                </strong>{" "}
                from this product&apos;s alternatives? The actual product will
                not be deleted.
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                {selectedAlternative.alternative.logo ? (
                  <img
                    src={selectedAlternative.alternative.logo}
                    alt={selectedAlternative.alternative.name}
                    className="h-11 w-11 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE0FA] text-base font-semibold text-[#8260B4]">
                    {selectedAlternative.alternative.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {selectedAlternative.alternative.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-400">
                    {selectedAlternative.alternative.slug}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  disabled={removingId !== null}
                  className="h-9 cursor-pointer rounded-lg border border-[#EAE7EF] px-3.5 text-[13px] font-medium text-[#505666] transition hover:bg-[#F8F6FC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleRemove(selectedAlternative.alternativeId)
                  }
                  disabled={removingId !== null}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#DC5361] px-4 text-[13px] font-medium text-white transition hover:bg-[#C74554] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingId !== null ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Remove Alternative
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  description: string;
  loading: boolean;
  tone: "lavender" | "mint" | "peach";
}) {
  const tones = {
    lavender: {
      card: "from-[#FFF6F8] to-[#F5F0FA]",
      icon: "bg-[#EDE0FA] text-[#8260B4]",
    },
    mint: {
      card: "from-[#F1FAF5] to-[#E8F7EE]",
      icon: "bg-[#D7F0E4] text-[#278B69]",
    },
    peach: {
      card: "from-[#FFFAF2] to-[#FFF0DF]",
      icon: "bg-[#FCE5C5] text-[#CB8428]",
    },
  };
  const theme = tones[tone];
  return (
    <div
      className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/90 bg-gradient-to-br ${theme.card} px-5 py-4 shadow-[0_8px_24px_rgba(40,29,57,0.035)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.075em] text-[#788294]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${theme.icon}`}
        >
          {icon}
        </span>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-white/60" />
        ) : (
          <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#202632]">
            {value}
          </p>
        )}
        <p className="mt-3 text-[12px] leading-4 text-[#788294]">
          {description}
        </p>
      </div>
    </div>
  );
}
