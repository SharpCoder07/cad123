
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Search,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  FileText,
  LoaderCircle,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

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
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(40,30,60,0.025)]";

export default function ProductSpecificationsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [specifications, setSpecifications] = useState<
    ProductSpecification[]
  >([]);

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [valueFilter, setValueFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function loadSpecifications() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/vendor/products/${productId}/specifications`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load product specifications."
          );
          return;
        }

        setSpecifications(data.specifications || []);
      } catch (error) {
        console.error(
          "Load product specifications error:",
          error
        );

        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    void loadSpecifications();
  }, [productId]);

  async function handleDelete(specificationId: number) {
    try {
      setRemovingId(specificationId);

      const response = await fetch(
        `/api/vendor/products/${productId}/specifications`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specificationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to remove specification."
        );
        return;
      }

      setSpecifications((currentSpecifications) =>
        currentSpecifications.filter(
          (item) => item.specificationId !== specificationId
        )
      );

      toast.success("Specification removed successfully.");
      setConfirmRemoveId(null);
    } catch (error) {
      console.error(
        "Delete product specification error:",
        error
      );

      toast.error("Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  }

  const selectedSpecification =
    confirmRemoveId !== null
      ? specifications.find(
          (item) => item.specificationId === confirmRemoveId
        )
      : null;

  const totalSpecifications = specifications.length;

  const configuredValues = specifications.filter(
    (item) => item.value.trim().length > 0
  ).length;

  const missingValues = totalSpecifications - configuredValues;

  const visibleSpecifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return specifications
      .filter((item) => {
        const configured = item.value.trim().length > 0;
        if (valueFilter === "configured" && !configured) return false;
        if (valueFilter === "missing" && configured) return false;
        return !query || item.specification.name.toLowerCase().includes(query) ||
          item.value.toLowerCase().includes(query) || String(item.specificationId).includes(query);
      })
      .sort((a, b) => {
        if (sortBy === "name-desc") return b.specification.name.localeCompare(a.specification.name);
        if (sortBy === "id-desc") return b.specificationId - a.specificationId;
        if (sortBy === "id-asc") return a.specificationId - b.specificationId;
        return a.specification.name.localeCompare(b.specification.name);
      });
  }, [specifications, search, valueFilter, sortBy]);

  const activeFilterCount = Number(valueFilter !== "all") + Number(sortBy !== "name-asc");
  const hasActiveSearchOrFilters = Boolean(search.trim()) || activeFilterCount > 0;
  function resetFilters() {
    setSearch("");
    setValueFilter("all");
    setSortBy("name-asc");
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[22px] bg-white"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-white" />
      </div>
    );
  }

  const stats = [
    {
      label: "Specifications",
      value: totalSpecifications,
      description: "Specifications linked to this product",
      icon: SlidersHorizontal,
    },
    {
      label: "Configured Values",
      value: configuredValues,
      description: "Specifications with assigned values",
      icon: CheckCircle2,
    },
    {
      label: "Missing Values",
      value: missingValues,
      description: "Specifications awaiting a value",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">

        <Link
          href="/vendor/products"
          className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>

        <ChevronRight size={13} />

        <Link
          href={`/vendor/products/${productId}/edit`}
          className="cursor-pointer hover:text-gray-900"
        >
          Edit Product
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Specifications
        </span>
      </div>

      {/* Page Heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <SlidersHorizontal size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Product Specifications</h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-2.5 py-1 text-[11px] font-medium text-[#77717F]"># {productId}</span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">Manage specifications assigned to this product.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/vendor/products/${productId}/edit`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <Link href={`/vendor/products/${productId}/specifications/new`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]">
            <Plus size={16} /> Add Specification
          </Link>
        </div>
      </section>

      {/* Summary Cards — Super Admin proportions */}
      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const themes = [
            { card: "bg-gradient-to-br from-[#FFF4F7] to-[#F5F0FA]", icon: "bg-[#EDE1FA] text-[#8966B7]" },
            { card: "bg-gradient-to-br from-[#F1FAF6] to-[#E6F7ED]", icon: "bg-[#D7F2E4] text-[#328F72]" },
            { card: "bg-gradient-to-br from-[#FFFAF2] to-[#FFF1E1]", icon: "bg-[#FFE6C4] text-[#D18B32]" },
          ];
          const theme = themes[index];
          return (
            <div key={stat.label} className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/80 px-5 py-4 shadow-[0_8px_24px_rgba(40,30,60,0.035)] ${theme.card}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.055em] text-[#77808E]">{stat.label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.icon}`}><Icon size={18} strokeWidth={1.8} /></span>
              </div>
              <div>
                <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#1F2430]">{stat.value.toLocaleString("en-IN")}</p>
                <p className="mt-2 text-[12px] leading-4 text-[#77808E]">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Specifications Listing */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="px-5 pb-5 pt-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]"><SlidersHorizontal size={20} /></span>
              <div>
                <h2 className="text-[16px] font-semibold text-[#25232C]">Assigned Specifications</h2>
                <p className="mt-0.5 text-[12px] text-[#77808E]">Review, edit, and remove product specification values.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#EAE7EF] bg-[#F8F7FA] px-3 py-1.5 text-[11px] font-medium text-[#77717F]">{totalSpecifications} Total</span>
              <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[12px] font-medium transition ${activeFilterCount ? "border-[#CDB9ED] bg-[#F0EBFA] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}>
                <SlidersHorizontal size={15} /> Filters
                {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8065B0] px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px] flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49BAE]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search specifications by name or value..." aria-label="Search specifications" className="h-10 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-4 text-[13px] text-[#25232C] outline-none placeholder:text-[#A49BAE] focus:border-[#B99BDF] focus:ring-4 focus:ring-[#F0EBFA]" />
            </div>
            {hasActiveSearchOrFilters && <button type="button" onClick={resetFilters} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#625A6A] hover:bg-[#F8F6FA]"><RotateCcw size={14} /> Reset</button>}
          </div>
          {filtersOpen && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select aria-label="Filter by value status" value={valueFilter} onChange={(event) => setValueFilter(event.target.value)} className={`h-10 cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#44414C] outline-none focus:ring-4 focus:ring-[#F0EBFA] ${valueFilter !== "all" ? "border-[#B99BDF]" : "border-[#E5E2EA]"}`}>
              <option value="all">All value statuses</option><option value="configured">Configured</option><option value="missing">Value missing</option>
            </select>
            <select aria-label="Sort specifications" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={`h-10 cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#44414C] outline-none focus:ring-4 focus:ring-[#F0EBFA] ${sortBy !== "name-asc" ? "border-[#B99BDF]" : "border-[#E5E2EA]"}`}>
              <option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="id-desc">Newest specification ID</option><option value="id-asc">Oldest specification ID</option>
            </select>
          </div>}
        </div>

        {totalSpecifications > 0 ? (
          <>
            {visibleSpecifications.length === 0 ? <div className="border-t border-[#EAE7EF] px-6 py-12 text-center text-sm text-[#77808E]">No specifications match your search or filters.</div> : <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#FAF9FC]">
                  <tr className="border-b border-gray-100">
                    {[
                      "Specification",
                      "Value",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 ${
                          heading === "Actions"
                            ? "text-right"
                            : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleSpecifications.map((item) => {
                    const hasValue =
                      item.value.trim().length > 0;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#FAF9FC]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                              <SlidersHorizontal size={19} />
                            </span>

                            <span>
                              <span className="block text-sm font-semibold text-gray-900">
                                {item.specification.name}
                              </span>

                              <span className="mt-1 block text-xs text-gray-400">
                                Specification #{item.specificationId}
                              </span>
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[360px] truncate text-sm font-medium text-gray-700">
                            {item.value || "No value configured"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {hasValue ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-semibold text-[#278455]">
                              <CheckCircle2 size={14} />
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex rounded-lg border border-[#F5E6CB] bg-[#FFFAF2] px-2.5 py-1.5 text-xs font-semibold text-[#B27D31]">
                              Value missing
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/vendor/products/${productId}/specifications/${item.specificationId}/edit`}
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white text-[#625A6A] transition hover:border-[#CDB9ED] hover:bg-[#F0EBFA] hover:text-[#8065B0]" aria-label={`Edit ${item.specification.name}`} title="Edit specification"
                            >
                              <Pencil size={15} />
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmRemoveId(
                                  item.specificationId
                                )
                              }
                              disabled={
                                removingId === item.specificationId
                              }
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE4E7] disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Remove ${item.specification.name}`} title="Remove specification"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {visibleSpecifications.map((item) => {
                const hasValue =
                  item.value.trim().length > 0;

                return (
                  <article
                    key={item.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                        <SlidersHorizontal size={19} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                          {item.specification.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Specification #{item.specificationId}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                          hasValue
                            ? "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]"
                            : "border border-[#F5E6CB] bg-[#FFFAF2] text-[#B27D31]"
                        }`}
                      >
                        {hasValue ? "Configured" : "Missing"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#F8F9FA] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Value
                      </p>

                      <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                        {item.value || "No value configured"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                      <Link
                        href={`/vendor/products/${productId}/specifications/${item.specificationId}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#403948]"
                      >
                        Edit
                        <ArrowUpRight size={15} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmRemoveId(
                            item.specificationId
                          )
                        }
                        disabled={
                          removingId === item.specificationId
                        }
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-semibold text-[#DC5361] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            </>}
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <SlidersHorizontal size={28} />
            </span>

            <h3 className="mt-5 text-base font-bold text-gray-900">
              No specifications assigned
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add specifications to provide structured details about
              this product.
            </p>

            <Link
              href={`/vendor/products/${productId}/specifications/new`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
            >
              <Plus size={17} />
              Add Specification
            </Link>
          </div>
        )}
      </section>

      {/* Remove Confirmation */}
      {selectedSpecification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-specification-title"
            className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#DC5361]">
                <Trash2 size={21} />
              </span>

              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                disabled={removingId !== null}
                aria-label="Close confirmation dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="remove-specification-title"
              className="mt-5 text-lg font-bold text-gray-950"
            >
              Remove specification?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Remove{" "}
              <span className="font-semibold text-gray-900">
                {selectedSpecification.specification.name}
              </span>{" "}
              from this product? The reusable specification itself
              will not be deleted.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                disabled={removingId !== null}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    selectedSpecification.specificationId
                  )
                }
                disabled={removingId !== null}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removingId ===
                selectedSpecification.specificationId ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Specification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage specifications. Grow your business.</p>
      </footer>
    </div>
  );
}
