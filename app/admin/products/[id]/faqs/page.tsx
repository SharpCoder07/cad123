"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  SlidersHorizontal,
  ChevronRight,
  CircleHelp,
  FileText,
  ListOrdered,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  productId: number;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function ProductFAQsPage() {
  const params = useParams();
  const productId = params.id as string;

  const productUrl = `/admin/products/${productId}/edit`;
  const newFaqUrl = `/admin/products/${productId}/faqs/new`;

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const hasActiveFilters = Boolean(search.trim()) || sortDirection !== "asc";
  const resetFilters = () => {
    setSearch("");
    setSortDirection("asc");
  };
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const requestController = useRef<AbortController | null>(null);

  const loadFaqs = useCallback(async () => {
    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(`/api/admin/products/${productId}/faqs`, {
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load FAQs.");
      }

      if (!controller.signal.aborted) {
        setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error("Load FAQs error:", error);

      setLoadError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    void loadFaqs();

    return () => {
      requestController.current?.abort();
    };
  }, [loadFaqs]);

  const orderedFaqs = useMemo(
    () =>
      [...faqs].sort((a, b) =>
        sortDirection === "asc"
          ? a.sortOrder - b.sortOrder || a.id - b.id
          : b.sortOrder - a.sortOrder || b.id - a.id,
      ),
    [faqs, sortDirection],
  );

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orderedFaqs;

    return orderedFaqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        String(faq.sortOrder).includes(query),
    );
  }, [orderedFaqs, search]);

  const selectedFaq =
    confirmDeleteId !== null
      ? faqs.find((faq) => faq.id === confirmDeleteId) || null
      : null;

  function toggleExpanded(id: number) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleDelete(faqId: number) {
    if (deletingId !== null) return;

    try {
      setDeletingId(faqId);

      const response = await fetch(
        `/api/admin/products/${productId}/faqs/${faqId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete FAQ.");
        return;
      }

      setFaqs((current) => current.filter((faq) => faq.id !== faqId));

      setExpandedIds((current) => current.filter((id) => id !== faqId));

      setConfirmDeleteId(null);
      toast.success("FAQ deleted successfully.");
    } catch (error) {
      console.error("Delete FAQ error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
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
              href={productUrl}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Edit Product
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">FAQs</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <CircleHelp size={22} strokeWidth={1.8} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                  Product FAQs
                </h1>
              </div>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage frequently asked questions for this product.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={productUrl}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#4C5260] transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back to Product
          </Link>

          <Link
            href={newFaqUrl}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={17} />
            Add FAQ
          </Link>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<CircleHelp size={19} />}
          label="Total FAQs"
          value={loading ? "—" : String(faqs.length)}
          description="Questions added to this product"
          tone="lavender"
        />

        <SummaryCard
          icon={<FileText size={19} />}
          label="Search Results"
          value={loading ? "—" : String(filteredFaqs.length)}
          description="FAQs matching the current search"
          tone="mint"
        />

        <SummaryCard
          icon={<ListOrdered size={19} />}
          label="Display Order"
          value="Custom"
          description="Sorted by configured order"
          tone="peach"
        />
      </section>

      {/* FAQ Library */}
      <section className={`overflow-hidden ${cardClass}`}>
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">FAQ Library</h2>

            <p className="mt-1 text-sm text-gray-500">
              Search, review, edit, and organize product questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:w-[260px] sm:flex-none">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9298A4]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search FAQs..."
                aria-label="Search FAQs"
                className="h-9 w-full rounded-lg border border-[#EAE7EF] bg-[#FBFAFC] pl-9 pr-3 text-[13px] text-[#252632] outline-none transition placeholder:text-[#9AA0AC] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((current) => !current)}
                aria-expanded={filterOpen}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-[13px] font-medium transition ${filterOpen || sortDirection !== "asc" ? "border-[#D7C9EC] bg-[#F6F1FC] text-[#795DA8]" : "border-[#EAE7EF] bg-white text-[#4C5260] hover:bg-[#FAF8FC]"}`}
              >
                <SlidersHorizontal size={15} /> Filters{" "}
                <ChevronDown
                  size={14}
                  className={filterOpen ? "rotate-180" : ""}
                />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-[230px] rounded-xl border border-[#EAE7EF] bg-white p-3 shadow-[0_12px_36px_rgba(40,29,57,0.12)]">
                  <label
                    htmlFor="faq-sort-direction"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#788294]"
                  >
                    Display order
                  </label>
                  <select
                    id="faq-sort-direction"
                    value={sortDirection}
                    onChange={(event) =>
                      setSortDirection(event.target.value as "asc" | "desc")
                    }
                    className="h-9 w-full cursor-pointer rounded-lg border border-[#EAE7EF] bg-[#FBFAFC] px-3 text-[13px] text-[#343441] outline-none focus:border-[#A48ACD]"
                  >
                    <option value="asc">Lowest first</option>
                    <option value="desc">Highest first</option>
                  </select>
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#687181] transition hover:bg-[#FAF8FC]"
              >
                <X size={14} /> Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadFaqs()}
              disabled={loading}
              title="Refresh FAQs"
              aria-label="Refresh FAQs"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#4C5260] transition hover:bg-[#FAF8FC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-gray-200 p-5"
              >
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="mt-4 h-3 w-full rounded bg-gray-100" />
                <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
                <div className="mt-5 h-9 w-28 rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <CircleHelp size={26} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              Unable to load FAQs
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void loadFaqs()}
              className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-gray-800"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : filteredFaqs.length > 0 ? (
          <>
            <div className="space-y-3 p-4 sm:p-5">
              {filteredFaqs.map((faq) => {
                const expanded = expandedIds.includes(faq.id);

                return (
                  <article
                    key={faq.id}
                    className="overflow-hidden rounded-[16px] border border-[#EAE7EF] bg-white transition hover:border-[#D7C9EC]"
                  >
                    <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-semibold text-[#8065B0]">
                        {faq.sortOrder}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                              Question
                            </p>

                            <h3 className="mt-1.5 break-words text-sm font-semibold leading-6 text-gray-950 sm:text-[15px]">
                              {faq.question}
                            </h3>
                          </div>

                          <span className="w-fit shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600">
                            Order #{faq.sortOrder}
                          </span>
                        </div>

                        {/* Answer */}
                        <div className="mt-3 rounded-xl bg-[#FAF8FC] p-3.5 sm:p-4">
                          <div className="flex items-start gap-2">
                            <FileText
                              size={15}
                              className="mt-0.5 shrink-0 text-gray-400"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                Answer
                              </p>

                              <p
                                className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600 ${
                                  expanded ? "" : "line-clamp-2"
                                }`}
                              >
                                {faq.answer || "No answer provided."}
                              </p>
                            </div>
                          </div>

                          {faq.answer.length > 160 && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(faq.id)}
                              aria-expanded={expanded}
                              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-800 transition hover:text-black"
                            >
                              {expanded ? "Show Less" : "Read Full Answer"}

                              <ChevronDown
                                size={14}
                                className={`transition-transform ${
                                  expanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/products/${productId}/faqs/${faq.id}/edit`}
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#25232C] px-3.5 text-xs font-medium text-white transition hover:bg-gray-800"
                          >
                            <Pencil size={13} />
                            Edit FAQ
                            <ArrowUpRight size={13} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(faq.id)}
                            disabled={deletingId !== null}
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#F6D9DC] bg-[#FFF0F1] px-3.5 text-xs font-medium text-[#DC5361] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 sm:px-6">
              <span>
                Showing{" "}
                <strong className="font-semibold text-gray-800">
                  {filteredFaqs.length}
                </strong>{" "}
                of {faqs.length} FAQs
              </span>

              <span>
                Sorted by display order (
                {sortDirection === "asc" ? "lowest first" : "highest first"})
              </span>
            </div>
          </>
        ) : (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              {search.trim() ? <Search size={24} /> : <CircleHelp size={24} />}
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              {search.trim() ? "No matching FAQs" : "No FAQs yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {search.trim()
                ? "Try another search term to find a question or answer."
                : "Add frequently asked questions to help visitors understand this product."}
            </p>

            {search.trim() ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-4 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <X size={16} />
                Clear Search
              </button>
            ) : (
              <Link
                href={newFaqUrl}
                className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-gray-800"
              >
                <Plus size={16} />
                Add FAQ
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Delete Dialog */}
      {selectedFaq && (
        <DeleteFaqDialog
          faq={selectedFaq}
          deleting={deletingId === selectedFaq.id}
          onClose={() => {
            if (deletingId === null) {
              setConfirmDeleteId(null);
            }
          }}
          onConfirm={() => void handleDelete(selectedFaq.id)}
        />
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
  value: string;
  description: string;
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
        <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#202632]">
          {value}
        </p>
        <p className="mt-3 text-[12px] leading-4 text-[#788294]">
          {description}
        </p>
      </div>
    </div>
  );
}

function DeleteFaqDialog({
  faq,
  deleting,
  onClose,
  onConfirm,
}: {
  faq: FAQ;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        onClose();
      }

      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );

        if (!focusable?.length) return;

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
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, deleting]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-faq-title"
        aria-describedby="delete-faq-description"
        className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={21} />
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close dialog"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <h2
          id="delete-faq-title"
          className="mt-5 text-lg font-bold text-gray-950"
        >
          Delete FAQ?
        </h2>

        <p
          id="delete-faq-description"
          className="mt-2 text-sm leading-6 text-gray-500"
        >
          This will permanently delete the selected question and its answer.
          This action cannot be undone.
        </p>

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Selected Question
          </p>

          <p className="mt-2 break-words text-sm font-semibold leading-6 text-gray-800">
            {faq.question}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-9 cursor-pointer rounded-lg border border-[#EAE7EF] bg-white px-4 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
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
    </div>,
    document.body,
  );
}
