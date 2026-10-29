
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
  Layers3,
  Loader2,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Feature = {
  id: number;
  name: string;
  description: string | null;
};

type ProductFeature = {
  id: number;
  feature: Feature;
};

type Product = {
  id: number;
  name: string;
  features: ProductFeature[];
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function FeaturesPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [descriptionFilter, setDescriptionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(
    null
  );

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!productId) return;

    let active = true;

    async function loadProductFeatures() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/admin/products/${productId}/features`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            toast.error(
              data.message || "Failed to load product features."
            );
          }
          return;
        }

        if (active) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error("Failed to load product features:", error);

        if (active) {
          toast.error("Failed to load product features.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProductFeatures();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (confirmRemoveId === null) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (removingId === null) {
          setConfirmRemoveId(null);
        }
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
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
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
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
  }, [confirmRemoveId, removingId]);

  async function handleRemove(featureId: number) {
    if (removingId !== null) return;

    try {
      setRemovingId(featureId);

      const response = await fetch(
        `/api/admin/products/${productId}/features`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to remove feature."
        );
        return;
      }

      setProduct((currentProduct) => {
        if (!currentProduct) return currentProduct;

        return {
          ...currentProduct,
          features: currentProduct.features.filter(
            (productFeature) =>
              productFeature.feature.id !== featureId
          ),
        };
      });

      toast.success("Feature removed successfully.");
      setConfirmRemoveId(null);
    } catch (error) {
      console.error("Remove feature error:", error);
      toast.error("Something went wrong.");
    } finally {
      setRemovingId(null);
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

        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((item) => (
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
          <Sparkles size={22} />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-950">
          Product not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The requested product could not be loaded.
        </p>

        <Link
          href="/admin/products"
          className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>
      </div>
    );
  }

  const totalFeatures = product.features.length;

  const featuresWithDescription = product.features.filter(
    (item) => Boolean(item.feature.description?.trim())
  ).length;

  const filteredFeatures = product.features.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || item.feature.name.toLowerCase().includes(query) || (item.feature.description || "").toLowerCase().includes(query) || String(item.feature.id).includes(query);
    const hasDescription = Boolean(item.feature.description?.trim());
    return matchesSearch && (descriptionFilter === "all" || (descriptionFilter === "with" ? hasDescription : !hasDescription));
  }).sort((a, b) => sortBy === "name-desc" ? b.feature.name.localeCompare(a.feature.name) : sortBy === "id-desc" ? b.feature.id - a.feature.id : sortBy === "id-asc" ? a.feature.id - b.feature.id : a.feature.name.localeCompare(b.feature.name));

  const filtersActive = Boolean(search.trim()) || descriptionFilter !== "all" || sortBy !== "name-asc";
  const resetFilters = () => { setSearch(""); setDescriptionFilter("all"); setSortBy("name-asc"); };

  const selectedFeature =
    confirmRemoveId !== null
      ? product.features.find(
          (item) => item.feature.id === confirmRemoveId
        )
      : null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Page header */}
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

            <span className="font-semibold text-gray-900">
              Features
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0]">
              <Sparkles size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Features
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage features assigned to{" "}
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
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
          >
            <ArrowLeft size={17} />
            Back to Product
          </Link>

          <Link
            href={`/admin/products/${product.id}/features/new`}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={18} />
            Add Feature
          </Link>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Sparkles size={19} />}
          label="Assigned Features"
          value={totalFeatures}
          description="Features linked to this product"
        />

        <SummaryCard
          icon={<CheckCircle2 size={19} />}
          label="With Description"
          value={featuresWithDescription}
          description="Features with additional details"
        />

        <SummaryCard
          icon={<Layers3 size={19} />}
          label="Without Description"
          value={totalFeatures - featuresWithDescription}
          description="Features without additional details"
        />
      </section>

      {/* Feature list */}
      <section className={`overflow-hidden ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <Sparkles size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-gray-950">
                Assigned Features
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Review and manage the features associated with this product.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
            {totalFeatures}{" "}
            {totalFeatures === 1 ? "Feature" : "Features"}
          </span>
        </div>

        <div className="border-b border-[#EAE7EF] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94899F]" />
              <input aria-label="Search assigned features" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search features by name, description or ID..." className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFD] pl-10 pr-4 text-[13px] text-[#292532] outline-none transition placeholder:text-[#AAA4B1] focus:border-[#A48ACD] focus:ring-4 focus:ring-[#F0EBFA]" />
            </div>
            <button type="button" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen} className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-medium transition ${filtersOpen ? "border-[#D8CAED] bg-[#F6F1FC] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}>
              <SlidersHorizontal size={16} /> Filters
              {filtersActive && <span className="h-2 w-2 rounded-full bg-[#9274C2]" />}
            </button>
            {filtersActive && <button type="button" onClick={resetFilters} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium text-[#8065B0] hover:bg-[#F6F1FC]"><RotateCcw size={15} /> Reset</button>}
          </div>
          {filtersOpen && <div className="mt-4 grid gap-3 border-t border-[#F0EDF3] pt-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-[#666070]">Description
              <select value={descriptionFilter} onChange={(event) => setDescriptionFilter(event.target.value)} className="block h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#292532] outline-none focus:border-[#A48ACD] focus:ring-4 focus:ring-[#F0EBFA]">
                <option value="all">All features</option><option value="with">With description</option><option value="without">Without description</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-[#666070]">Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="block h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#292532] outline-none focus:border-[#A48ACD] focus:ring-4 focus:ring-[#F0EBFA]">
                <option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="id-asc">Oldest ID first</option><option value="id-desc">Newest ID first</option>
              </select>
            </label>
          </div>}
          <p className="mt-3 text-xs text-[#928B9A]">Showing {filteredFeatures.length} of {totalFeatures} assigned features</p>
        </div>

        {totalFeatures > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FAFAFB]">
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Feature
                    </th>

                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Description
                    </th>

                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredFeatures.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                            <Sparkles size={18} />
                          </span>

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-gray-950">
                              {item.feature.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Feature #{item.feature.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="line-clamp-2 max-w-[420px] text-sm leading-6 text-gray-500">
                          {item.feature.description ||
                            "No description provided."}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-semibold text-[#278455]">
                          <CheckCircle2 size={14} />
                          Assigned
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmRemoveId(item.feature.id)
                            }
                            disabled={removingId !== null}
                            title="Remove feature"
                            aria-label={`Remove ${item.feature.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE4E7] disabled:cursor-not-allowed disabled:opacity-50"
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
              {filteredFeatures.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                      <Sparkles size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-950">
                        {item.feature.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Feature #{item.feature.id}
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2 py-1.5 text-[11px] font-semibold text-[#278455]">
                      <CheckCircle2 size={12} />
                      Assigned
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#FAFAFB] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Description
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {item.feature.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmRemoveId(item.feature.id)
                    }
                    disabled={removingId !== null}
                    className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] px-4 text-sm font-semibold text-[#DC5361] transition hover:bg-[#FFE4E7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Remove Feature
                  </button>
                </div>
              ))}
            </div>
            {filteredFeatures.length === 0 && <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><Search size={26} className="text-[#A48ACD]" /><h3 className="mt-3 text-sm font-semibold text-[#292532]">No matching features</h3><p className="mt-1 text-xs text-[#928B9A]">Try a different search or reset the filters.</p><button type="button" onClick={resetFilters} className="mt-4 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 py-2 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA]">Reset filters</button></div>}
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Sparkles size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              No features assigned
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add features to describe the capabilities of this product.
            </p>

            <Link
              href={`/admin/products/${product.id}/features/new`}
              className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus size={17} />
              Add Feature
            </Link>
          </div>
        )}
      </section>

      {/* Remove confirmation modal */}
      {selectedFeature &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1D1725]/50 p-4"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                removingId === null
              ) {
                setConfirmRemoveId(null);
              }
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-feature-title"
              aria-describedby="remove-feature-description"
              className="w-full max-w-md rounded-[20px] border border-[#EAE7EF] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F1] text-[#DC5361]">
                  <AlertTriangle size={23} />
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  disabled={removingId !== null}
                  aria-label="Close confirmation"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id="remove-feature-title"
                className="mt-5 text-xl font-bold text-gray-950"
              >
                Remove Feature?
              </h3>

              <p
                id="remove-feature-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-800">
                  {selectedFeature.feature.name}
                </span>{" "}
                from this product?
              </p>

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-5 text-amber-800">
                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />
                  The feature will be unassigned from this
                  product. The reusable feature definition
                  will not be deleted.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  disabled={removingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRemove(selectedFeature.feature.id)
                  }
                  disabled={removingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingId === selectedFeature.feature.id ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Remove Feature
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  const tone = label === "Assigned Features" ? "bg-[#F3EDFC] text-[#8065B0]" : label === "With Description" ? "bg-[#EBF8F1] text-[#278455]" : "bg-[#FFF3EA] text-[#C47D46]";
  return (
    <div className={`min-h-[146px] rounded-[20px] border border-white/70 p-5 shadow-[0_4px_18px_rgba(40,29,57,0.025)] ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-75">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">{icon}</span>
      </div>
      <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-[#25232C]">{value}</p>
      <p className="mt-2 text-xs text-[#77717F]">{description}</p>
    </div>
  );
}
