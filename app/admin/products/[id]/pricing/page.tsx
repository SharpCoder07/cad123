"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";

type PricingPlan = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  billing: string | null;
};

type Product = {
  id: number;
  name: string;
  pricingPlans: PricingPlan[];
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]";

export default function PricingPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productId) return;

    let active = true;

    async function loadProductPricing() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/admin/products/${productId}/pricing`,
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            toast.error(data.message || "Failed to load pricing plans.");
          }
          return;
        }

        if (active) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error("Failed to load pricing plans:", error);

        if (active) {
          toast.error("Failed to load pricing plans.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProductPricing();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (confirmDeleteId === null) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (deletingId === null) {
          setConfirmDeleteId(null);
        }
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [confirmDeleteId, deletingId]);

  async function handleDelete(planId: number) {
    if (deletingId !== null) return;

    try {
      setDeletingId(planId);

      const response = await fetch(
        `/api/admin/products/${productId}/pricing/${planId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete pricing plan.");
        return;
      }

      setProduct((currentProduct) => {
        if (!currentProduct) return currentProduct;

        return {
          ...currentProduct,
          pricingPlans: currentProduct.pricingPlans.filter(
            (plan) => plan.id !== planId,
          ),
        };
      });

      toast.success("Pricing plan deleted successfully.");
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Delete pricing plan error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[24px] bg-white"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-white" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`mx-auto max-w-[1440px] p-8 ${cardClass}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <CircleDollarSign size={22} />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-950">
          Product not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The requested product could not be loaded.
        </p>

        <Link
          href="/admin/products"
          className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>
      </div>
    );
  }

  const totalPlans = product.pricingPlans.length;

  const plansWithPrice = product.pricingPlans.filter(
    (plan) => plan.price !== null,
  ).length;

  const plansWithBilling = product.pricingPlans.filter((plan) =>
    Boolean(plan.billing),
  ).length;

  const activeFilterCount =
    Number(priceFilter !== "all") +
    Number(billingFilter !== "all") +
    Number(sortBy !== "default");
  const hasActiveFilters = Boolean(search.trim()) || activeFilterCount > 0;
  const visiblePlans = product.pricingPlans
    .filter((plan) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [
          plan.name,
          plan.description ?? "",
          plan.billing ?? "",
          String(plan.id),
        ].some((value) => value.toLowerCase().includes(query));
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "priced" ? plan.price !== null : plan.price === null);
      const matchesBilling =
        billingFilter === "all" ||
        (billingFilter === "configured"
          ? Boolean(plan.billing)
          : !plan.billing);
      return matchesSearch && matchesPrice && matchesBilling;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "price-asc")
        return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sortBy === "price-desc")
        return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      return 0;
    });

  const resetFilters = () => {
    setSearch("");
    setPriceFilter("all");
    setBillingFilter("all");
    setSortBy("default");
  };

  const selectedPlan =
    confirmDeleteId !== null
      ? product.pricingPlans.find((plan) => plan.id === confirmDeleteId)
      : null;

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
              href={`/admin/products/${product.id}/edit`}
              className="max-w-[180px] truncate cursor-pointer transition hover:text-gray-900"
            >
              Edit Products
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Pricing</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <CreditCard size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Pricing
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage pricing plans for{" "}
                <span className="font-semibold text-gray-700">
                  {product.name}
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
          >
            <ArrowLeft size={17} />
            Back to Product
          </Link>

          <Link
            href={`/admin/products/${product.id}/pricing/new`}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={18} />
            Add Pricing Plan
          </Link>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<CreditCard size={19} />}
          label="Pricing Plans"
          value={totalPlans}
          description="Plans configured for this product"
          tone="lavender"
        />

        <SummaryCard
          icon={<CircleDollarSign size={19} />}
          label="With Price"
          value={plansWithPrice}
          description="Plans with a configured price"
          tone="mint"
        />

        <SummaryCard
          icon={<Tag size={19} />}
          label="Billing Details"
          value={plansWithBilling}
          description="Plans with billing information"
          tone="peach"
        />
      </section>

      {/* Pricing list */}
      <section className={`overflow-hidden ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CreditCard size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-gray-950">
                Pricing Plans
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Configure and maintain product pricing.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#F5F1FB] px-3 py-1.5 text-xs font-semibold text-[#8065B0]">
            {totalPlans} {totalPlans === 1 ? "Plan" : "Plans"}
          </span>
        </div>

        <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[190px] flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A92A6]"
              />
              <input
                type="search"
                aria-label="Search pricing plans"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pricing plans..."
                className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-4 text-[13px] text-[#292531] outline-none transition placeholder:text-[#A39BAE] focus:border-[#A98DDA] focus:ring-4 focus:ring-[#F2ECFA]"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-[13px] font-medium transition ${filtersOpen || activeFilterCount ? "border-[#CDBCE9] bg-[#F5F0FC] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#55505D] hover:bg-[#F8F6FA]"}`}
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#8065B0] px-1.5 py-0.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#77717F] hover:bg-[#F8F6FA]"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
          {filtersOpen && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <select
                aria-label="Filter by price"
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value)}
                className="h-11 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#55505D] outline-none focus:border-[#A98DDA]"
              >
                <option value="all">All prices</option>
                <option value="priced">With price</option>
                <option value="unpriced">Without price</option>
              </select>
              <select
                aria-label="Filter by billing"
                value={billingFilter}
                onChange={(event) => setBillingFilter(event.target.value)}
                className="h-11 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#55505D] outline-none focus:border-[#A98DDA]"
              >
                <option value="all">All billing</option>
                <option value="configured">With billing details</option>
                <option value="missing">Without billing details</option>
              </select>
              <select
                aria-label="Sort pricing plans"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-11 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#55505D] outline-none focus:border-[#A98DDA]"
              >
                <option value="default">Default order</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
              </select>
            </div>
          )}
        </div>

        {totalPlans > 0 ? (
          visiblePlans.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-10 text-center">
              <Search size={26} className="text-[#A99ABF]" />
              <h3 className="mt-3 text-sm font-semibold text-[#292531]">
                No matching pricing plans
              </h3>
              <p className="mt-1 text-[13px] text-[#77808E]">
                Try another search or reset your filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 cursor-pointer rounded-xl border border-[#E5E2EA] px-4 py-2 text-[13px] text-[#55505D]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#FAFAFB]">
                      {[
                        "Plan",
                        "Price",
                        "Billing",
                        "Description",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-6 py-4 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ${
                            heading === "Actions" ? "text-right" : "text-left"
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visiblePlans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="transition hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                              <CreditCard size={18} />
                            </span>

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-sm font-semibold text-gray-950">
                                {plan.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Plan #{plan.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {plan.price !== null ? (
                            <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold tabular-nums text-gray-800">
                              {plan.price}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {plan.billing ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                              <CheckCircle2 size={14} />
                              {plan.billing}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="line-clamp-2 max-w-[300px] text-sm leading-6 text-gray-500">
                            {plan.description || "No description provided."}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}/pricing/${plan.id}/edit`}
                              title="Edit pricing plan"
                              aria-label={`Edit ${plan.name}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                            >
                              <Pencil size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(plan.id)}
                              disabled={deletingId !== null}
                              title="Delete pricing plan"
                              aria-label={`Delete ${plan.name}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE5E8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-100 md:hidden">
                {visiblePlans.map((plan) => (
                  <div key={plan.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <CreditCard size={18} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-950">
                          {plan.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Plan #{plan.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#FAFAFB] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Price
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {plan.price ?? "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FAFAFB] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Billing
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                          {plan.billing || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-[#FAFAFB] p-4">
                      <div className="flex items-start gap-2">
                        <FileText
                          size={16}
                          className="mt-0.5 shrink-0 text-gray-400"
                        />

                        <p className="text-sm leading-6 text-gray-500">
                          {plan.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}/pricing/${plan.id}/edit`}
                        className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        <Pencil size={15} />
                        Edit Plan
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(plan.id)}
                        disabled={deletingId !== null}
                        aria-label={`Delete ${plan.name}`}
                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE5E8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <CreditCard size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              No pricing plans yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add your first pricing plan to configure pricing for this product.
            </p>

            <Link
              href={`/admin/products/${product.id}/pricing/new`}
              className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus size={17} />
              Add Pricing Plan
            </Link>
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {selectedPlan &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && deletingId === null) {
                setConfirmDeleteId(null);
              }
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-pricing-title"
              aria-describedby="delete-pricing-description"
              className="w-full max-w-md rounded-[24px] border border-gray-100 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={23} />
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId !== null}
                  aria-label="Close confirmation"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id="delete-pricing-title"
                className="mt-5 text-xl font-bold text-gray-950"
              >
                Delete Pricing Plan?
              </h3>

              <p
                id="delete-pricing-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800">
                  {selectedPlan.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-5 text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  This pricing plan will be permanently removed from the
                  product.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedPlan.id)}
                  disabled={deletingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === selectedPlan.id ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Plan
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

function SummaryCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  tone: "lavender" | "mint" | "peach";
}) {
  const styles = {
    lavender: {
      card: "border-[#EEE5F7] bg-gradient-to-br from-[#F5EEFF] to-[#FBEFF6]",
      icon: "bg-[#E9DDF8] text-[#8764B3]",
    },
    mint: {
      card: "border-[#E2F0E8] bg-gradient-to-br from-[#EAF9F0] to-[#F3FBF5]",
      icon: "bg-[#D9F0E1] text-[#428F68]",
    },
    peach: {
      card: "border-[#F5E9DC] bg-gradient-to-br from-[#FFF1E4] to-[#FFF8F0]",
      icon: "bg-[#FCE4CC] text-[#C78955]",
    },
  }[tone];

  return (
    <div
      className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border p-5 ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#77717F]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#292531]">
          {value}
        </p>
        <p className="mt-2 text-xs text-[#77717F]">{description}</p>
      </div>
    </div>
  );
}
