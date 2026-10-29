"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  RotateCcw,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

type Specification = {
  id: number;
  name: string;
};

type ProductSpecification = {
  id: number;
  value: string;
  specificationId: number;
  productId: number;
  specification: Specification;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function ProductSpecificationsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [specifications, setSpecifications] = useState<ProductSpecification[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [valueFilter, setValueFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!productId) return;

    let active = true;

    async function loadSpecifications() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch(
          `/api/admin/products/${productId}/specifications`,
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(
              data.message || "Failed to load product specifications.",
            );
          }
          return;
        }

        if (active) {
          setSpecifications(
            Array.isArray(data.specifications) ? data.specifications : [],
          );
        }
      } catch (error) {
        console.error("Load product specifications error:", error);

        if (active) {
          setLoadError(true);
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSpecifications();

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

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
  }, [confirmRemoveId, removingId]);

  async function handleDelete(specificationId: number) {
    if (removingId !== null) return;

    try {
      setRemovingId(specificationId);

      const response = await fetch(
        `/api/admin/products/${productId}/specifications`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specificationId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to remove specification.");
        return;
      }

      setSpecifications((currentSpecifications) =>
        currentSpecifications.filter(
          (item) => item.specificationId !== specificationId,
        ),
      );

      toast.success("Specification removed successfully.");
      setConfirmRemoveId(null);
    } catch (error) {
      console.error("Delete product specification error:", error);
      toast.error("Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  }

  const totalSpecifications = specifications.length;

  const configuredSpecifications = specifications.filter(
    (item) => item.value?.trim().length > 0,
  ).length;

  const missingSpecifications = totalSpecifications - configuredSpecifications;

  const filteredSpecifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return specifications
      .filter((item) => {
        const hasValue = Boolean(item.value?.trim());
        if (valueFilter === "configured" && !hasValue) return false;
        if (valueFilter === "missing" && hasValue) return false;
        return (
          !query ||
          item.specification.name.toLowerCase().includes(query) ||
          (item.value || "").toLowerCase().includes(query) ||
          String(item.specificationId).includes(query)
        );
      })
      .sort((a, b) => {
        if (sortOrder === "name-asc")
          return a.specification.name.localeCompare(b.specification.name);
        if (sortOrder === "name-desc")
          return b.specification.name.localeCompare(a.specification.name);
        if (sortOrder === "oldest") return a.id - b.id;
        return b.id - a.id;
      });
  }, [specifications, search, valueFilter, sortOrder]);

  const activeFilterCount =
    Number(valueFilter !== "all") + Number(sortOrder !== "newest");
  const hasActiveFilters = search.trim().length > 0 || activeFilterCount > 0;
  const resetFilters = () => {
    setSearch("");
    setValueFilter("all");
    setSortOrder("newest");
  };

  const selectedSpecification =
    confirmRemoveId !== null
      ? specifications.find((item) => item.specificationId === confirmRemoveId)
      : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[20px] bg-white"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[20px] bg-white" />
      </div>
    );
  }

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
              href={`/admin/products/${productId}/edit`}
              className="cursor-pointer transition hover:text-gray-900"
            >
             Edit Product
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Specifications</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <SlidersHorizontal size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Specifications
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage specifications assigned to this product.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-sm font-medium text-[#44414C] transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back to Product
          </Link>

          <Link
            href={`/admin/products/${productId}/specifications/new`}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-sm font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={18} />
            Add Specification
          </Link>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          tone="lavender"
          icon={<SlidersHorizontal size={19} />}
          label="Assigned Specifications"
          value={totalSpecifications}
          description="Specifications linked to this product"
        />

        <SummaryCard
          tone="green"
          icon={<CheckCircle2 size={19} />}
          label="Configured Values"
          value={configuredSpecifications}
          description="Specifications with a configured value"
        />

        <SummaryCard
          tone="amber"
          icon={<FileText size={19} />}
          label="Missing Values"
          value={missingSpecifications}
          description="Specifications needing a value"
        />
      </section>

      {/* Specifications table */}
      <section className={`overflow-hidden ${cardClass}`}>
        <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={19} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-[#242735]">
                  Specification Catalog
                </h2>
                <p className="mt-1 text-xs text-[#81899B]">
                  Search, filter and manage product specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F3EFF8] px-3 py-1.5 text-xs font-semibold text-[#81709C]">
                {filteredSpecifications.length} of {totalSpecifications}{" "}
                specifications
              </span>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${filtersOpen || activeFilterCount ? "border-[#D9C8F1] bg-[#F4EEFF] text-[#7B57A8]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}
              >
                <SlidersHorizontal size={15} /> Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#8B6BB8] px-1.5 py-0.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A59CB2]"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by specification name, value or ID..."
              aria-label="Search specifications"
              className="h-11 w-full rounded-xl border border-[#E5E0EC] bg-[#FAF9FC] pl-11 pr-4 text-sm text-[#242735] outline-none transition placeholder:text-[#A29AAB] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
            />
          </div>
          {filtersOpen && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                aria-label="Filter by value status"
                value={valueFilter}
                onChange={(e) => setValueFilter(e.target.value)}
                className="h-11 min-w-0 flex-1 cursor-pointer rounded-xl border border-[#DCCFEE] bg-white px-4 text-sm text-[#494453] outline-none focus:ring-4 focus:ring-[#F0EBFA]"
              >
                <option value="all">All specifications</option>
                <option value="configured">With value</option>
                <option value="missing">Without value</option>
              </select>
              <select
                aria-label="Sort specifications"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-11 min-w-0 flex-1 cursor-pointer rounded-xl border border-[#E5E0EC] bg-white px-4 text-sm text-[#494453] outline-none focus:ring-4 focus:ring-[#F0EBFA]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-sm text-[#494453] hover:bg-[#F8F6FA]"
                >
                  <RotateCcw size={15} /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        {loadError ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
            <AlertTriangle size={28} className="text-red-500" />

            <h3 className="mt-4 text-base font-bold text-gray-900">
              Unable to load specifications
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Please refresh the page and try again.
            </p>
          </div>
        ) : filteredSpecifications.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FAFAFB]">
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Specification
                    </th>

                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Value
                    </th>

                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredSpecifications.map((item) => {
                    const hasValue = item.value?.trim().length > 0;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                              <SlidersHorizontal size={18} />
                            </span>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-gray-950">
                                {item.specification.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Specification #{item.specificationId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="max-w-[350px] truncate text-sm font-medium text-gray-700">
                            {item.value || "No value configured"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {hasValue ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                              <AlertTriangle size={13} />
                              Value Missing
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${productId}/specifications/${item.specificationId}/edit`}
                              title="Edit specification"
                              aria-label={`Edit ${item.specification.name}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Pencil size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmRemoveId(item.specificationId)
                              }
                              disabled={removingId !== null}
                              title="Remove specification"
                              aria-label={`Remove ${item.specification.name}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredSpecifications.map((item) => {
                const hasValue = item.value?.trim().length > 0;

                return (
                  <div key={item.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <SlidersHorizontal size={18} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-950">
                          {item.specification.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Specification #{item.specificationId}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                          hasValue
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {hasValue ? "Configured" : "Missing"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#FAFAFB] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Value
                      </p>

                      <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                        {item.value || "No value configured"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        href={`/admin/products/${productId}/specifications/${item.specificationId}/edit`}
                        className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-sm font-medium text-white transition hover:bg-[#403948]"
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(item.specificationId)}
                        disabled={removingId !== null}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] px-4 text-sm font-semibold text-[#DC5361] transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <SlidersHorizontal size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              {totalSpecifications === 0
                ? "No specifications assigned"
                : "No matching specifications"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {totalSpecifications === 0
                ? "Add specifications to provide structured product details."
                : "Try changing your search or filters."}
            </p>

            {totalSpecifications === 0 ? (
              <Link
                href={`/admin/products/${productId}/specifications/new`}
                className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-5 text-sm font-medium text-white transition hover:bg-[#403948]"
              >
                <Plus size={17} />
                Add Specification
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-5 py-2.5 text-sm text-[#494453] hover:bg-[#F8F6FA]"
              >
                Clear search and filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Remove confirmation dialog */}
      {selectedSpecification &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && removingId === null) {
                setConfirmRemoveId(null);
              }
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-specification-title"
              aria-describedby="remove-specification-description"
              className="w-full max-w-md rounded-[20px] border border-gray-100 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
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
                id="remove-specification-title"
                className="mt-5 text-xl font-bold text-gray-950"
              >
                Remove Specification?
              </h3>

              <p
                id="remove-specification-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-800">
                  {selectedSpecification.specification.name}
                </span>{" "}
                from this product?
              </p>

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-5 text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  This removes the specification and its configured value from
                  this product. The reusable specification definition will not
                  be deleted.
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
                    handleDelete(selectedSpecification.specificationId)
                  }
                  disabled={removingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingId === selectedSpecification.specificationId ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Remove Specification
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
  tone,
  icon,
  label,
  value,
  description,
}: {
  tone: "lavender" | "green" | "amber";
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  const colors = {
    lavender: {
      bg: "bg-gradient-to-br from-[#FFF6F8] to-[#F5F0FA]",
      icon: "bg-[#EEE2FB] text-[#8863B6]",
    },
    green: {
      bg: "bg-gradient-to-br from-[#F1FAF5] to-[#E8F7EE]",
      icon: "bg-[#D6F0E3] text-[#369878]",
    },
    amber: {
      bg: "bg-gradient-to-br from-[#FFFAF2] to-[#FFF0DF]",
      icon: "bg-[#FCE6C4] text-[#CE8B2E]",
    },
  }[tone];
  return (
    <div
      className={`min-h-[145px] rounded-[21px] border border-white p-5 shadow-[0_6px_22px_rgba(65,48,85,0.04)] ${colors.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7D8799]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight text-[#202632]">
        {value}
      </p>
      <p className="mt-3 text-xs text-[#81899B]">{description}</p>
    </div>
  );
}
