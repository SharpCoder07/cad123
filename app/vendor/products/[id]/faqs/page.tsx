"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  FileText,
  ListOrdered,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  productId: number;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

export default function ProductFAQsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("order-asc");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const faqsUrl = `/vendor/products/${productId}/faqs`;
  const addFaqUrl = `${faqsUrl}/new`;

  useEffect(() => {
    if (!productId) return;

    let active = true;

    async function loadFaqs() {
      try {
        setLoading(true);

        const response = await fetch(`/api/vendor/products/${productId}/faqs`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            toast.error(data.message || "Failed to load FAQs.");
          }
          return;
        }

        if (active) {
          setFaqs(data.faqs || []);
        }
      } catch (error) {
        console.error("Load FAQs error:", error);

        if (active) {
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFaqs();

    return () => {
      active = false;
    };
  }, [productId]);

  async function handleDelete(faqId: number) {
    if (deletingId !== null) return;

    try {
      setDeletingId(faqId);

      const response = await fetch(
        `/api/vendor/products/${productId}/faqs/${faqId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete FAQ.");
        return;
      }

      setFaqs((currentFaqs) => currentFaqs.filter((faq) => faq.id !== faqId));

      toast.success("FAQ deleted successfully.");
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Delete FAQ error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  const orderedFaqs = useMemo(
    () => [...faqs].sort((first, second) => first.sortOrder - second.sortOrder),
    [faqs],
  );

  const visibleFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = orderedFaqs.filter(
      (faq) =>
        !term ||
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term),
    );
    if (sortBy === "order-desc") result.reverse();
    if (sortBy === "question-asc")
      result.sort((a, b) => a.question.localeCompare(b.question));
    if (sortBy === "question-desc")
      result.sort((a, b) => b.question.localeCompare(a.question));
    return result;
  }, [orderedFaqs, search, sortBy]);
  const filtersActive = Number(sortBy !== "order-asc");

  const selectedFaq =
    confirmDeleteId !== null
      ? faqs.find((faq) => faq.id === confirmDeleteId)
      : null;

  const totalFaqs = faqs.length;

  const firstSortOrder =
    orderedFaqs.length > 0 ? orderedFaqs[0].sortOrder : null;

  const lastSortOrder =
    orderedFaqs.length > 0
      ? orderedFaqs[orderedFaqs.length - 1].sortOrder
      : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
      >
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

        <span className="text-gray-700">FAQs</span>
      </nav>

      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <CircleHelp size={22} strokeWidth={1.8}/>
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product FAQs
              </h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-3 py-1 text-xs font-medium text-[#77717F]">
                #{productId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Manage frequently asked questions and answers for this product.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/vendor/products/${productId}/edit`}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
          >
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <Link
            href={addFaqUrl}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={16} /> Add FAQ
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "TOTAL FAQS",
            value: loading ? "—" : String(totalFaqs),
            description: "Frequently asked questions configured",
            Icon: CircleHelp,
            background: "bg-gradient-to-br from-[#F4EDFF] to-[#FCEFFA]",
            iconStyle: "bg-[#E8DDFB] text-[#8065B0]",
          },
          {
            label: "FIRST DISPLAY ORDER",
            value:
              loading || firstSortOrder === null ? "—" : `#${firstSortOrder}`,
            description: "Lowest configured sort order",
            Icon: ListOrdered,
            background: "bg-gradient-to-br from-[#E8F8F1] to-[#F3FCF8]",
            iconStyle: "bg-[#D7F0E2] text-[#348B65]",
          },
          {
            label: "LAST DISPLAY ORDER",
            value:
              loading || lastSortOrder === null ? "—" : `#${lastSortOrder}`,
            description: "Highest configured sort order",
            Icon: FileText,
            background: "bg-gradient-to-br from-[#FFF0E5] to-[#FFF8ED]",
            iconStyle: "bg-[#FFE4CE] text-[#BD8053]",
          },
        ].map(({ label, value, description, Icon, background, iconStyle }) => (
          <div
            key={label}
            className={`min-h-[146px] rounded-[21px] border border-white/70 p-5 ${background}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold tracking-[0.11em] text-[#76717D]">
                {label}
              </p>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
              >
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-[#25232C]">
              {value}
            </p>
            <p className="mt-2 text-xs text-[#827D89]">{description}</p>
          </div>
        ))}
      </section>

      {/* FAQ Workspace */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#F0EDF3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CircleHelp size={21} />
            </span>

            <div>
              <h2 className="text-base font-semibold text-[#25232C]">
                FAQ Library
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Review product questions, answers, and display order.
              </p>
            </div>
          </div>

          <span className="self-start rounded-full border border-[#EAE7EF] bg-[#F8F7FA] px-3 py-1.5 text-xs font-medium text-[#77717F]">
            {totalFaqs} {totalFaqs === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C96A5]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions or answers..."
                aria-label="Search FAQs"
                className="min-h-10 w-full rounded-xl border border-[#E5E2EA] bg-white py-2 pl-10 pr-4 text-[13px] text-[#25232C] outline-none transition placeholder:text-[#A39DAA] focus:border-[#AD93D7] focus:ring-2 focus:ring-[#F0EBFA]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-medium transition ${showFilters || filtersActive ? "border-[#CDB9EB] bg-[#F0EBFA] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}
            >
              <SlidersHorizontal size={16} /> Filters{" "}
              {filtersActive > 0 && (
                <span className="rounded-full bg-[#8065B0] px-1.5 py-0.5 text-[10px] text-white">
                  {filtersActive}
                </span>
              )}
            </button>
            {(search || filtersActive > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSortBy("order-asc");
                }}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E5E2EA] px-3 text-[13px] text-[#77717F] hover:bg-[#F8F6FA]"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
          {showFilters && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort FAQs"
                className={`min-h-10 cursor-pointer rounded-xl border bg-white px-3 text-[13px] outline-none ${filtersActive ? "border-[#AD93D7] text-[#8065B0]" : "border-[#E5E2EA] text-[#44414C]"}`}
              >
                <option value="order-asc">Display order: Low to high</option>
                <option value="order-desc">Display order: High to low</option>
                <option value="question-asc">Question: A to Z</option>
                <option value="question-desc">Question: Z to A</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#F0EDF3] p-5"
              >
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-5 h-20 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : visibleFaqs.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EBFA] text-gray-400">
              <CircleHelp size={29} />
            </span>

            <h3 className="mt-5 text-base font-semibold text-[#25232C]">
              {faqs.length === 0 ? "No FAQs yet" : "No matching FAQs"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {faqs.length === 0
                ? "Add frequently asked questions to help customers understand your product and its features."
                : "Try a different search or reset your filters."}
            </p>

            {faqs.length === 0 && (
              <Link
                href={addFaqUrl}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#333333]"
              >
                <Plus size={17} />
                Add First FAQ
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleFaqs.map((faq) => (
              <article
                key={faq.id}
                className="p-5 transition hover:bg-[#FCFCFD] sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Sort Order */}
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-semibold text-[#8065B0]">
                      {faq.sortOrder}
                    </span>

                    <span className="rounded-lg bg-[#F0EBFA] px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 sm:hidden">
                      Order #{faq.sortOrder}
                    </span>
                  </div>

                  {/* FAQ Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CircleHelp size={16} className="text-gray-400" />

                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Question
                          </p>
                        </div>

                        <h3 className="mt-3 whitespace-pre-wrap break-words text-base font-bold leading-7 text-[#111827] sm:text-lg">
                          {faq.question}
                        </h3>
                      </div>

                      <span className="hidden shrink-0 rounded-lg bg-[#F0EBFA] px-3 py-1.5 text-[11px] font-semibold text-gray-600 lg:inline-flex">
                        Order #{faq.sortOrder}
                      </span>
                    </div>

                    {/* Answer */}
                    <div className="mt-5 rounded-2xl border border-[#F0EDF3] bg-[#F8F7FA] p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600">
                          <FileText size={17} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Answer
                          </p>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Link
                        href={`${faqsUrl}/${faq.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#403948]"
                      >
                        <Pencil size={14} />
                        Edit FAQ
                        <ArrowUpRight size={13} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(faq.id)}
                        disabled={deletingId !== null}
                        aria-label={`Delete FAQ: ${faq.question}`}
                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE3E6] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Information */}
      <section className={`${cardClass} p-5 sm:p-6`}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            <ShieldCheck size={20} />
          </span>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              FAQ Display Guidelines
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              FAQs are displayed according to their configured sort order. Use
              clear questions and helpful answers so customers can quickly find
              relevant information.
            </p>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {selectedFaq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-faq-title"
            className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </span>

              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                aria-label="Close confirmation dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="delete-faq-title"
              className="mt-5 text-lg font-bold text-gray-950"
            >
              Delete FAQ?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This will permanently delete the FAQ and its answer from the
              product. This action cannot be undone.
            </p>

            <div className="mt-5 rounded-xl bg-[#F8F7FA] p-4">
              <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-gray-800">
                {selectedFaq.question}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Display order: #{selectedFaq.sortOrder}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleDelete(selectedFaq.id);
                }}
                disabled={deletingId !== null}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === selectedFaq.id ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete FAQ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage product FAQs. Grow your business.</p>
      </footer>
    </div>
  );
}
