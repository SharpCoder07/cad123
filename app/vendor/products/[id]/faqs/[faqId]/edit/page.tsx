"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Info,
  ListOrdered,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

type OriginalFAQ = {
  question: string;
  answer: string;
  sortOrder: string;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

export default function EditVendorProductFAQPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const faqId = params.faqId as string;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [original, setOriginal] = useState<OriginalFAQ>({
    question: "",
    answer: "",
    sortOrder: "0",
  });

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const faqsUrl = `/vendor/products/${productId}/faqs`;

  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();
  const parsedSortOrder = Number(sortOrder);

  const validSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(parsedSortOrder) &&
    parsedSortOrder >= 0;

  const hasChanges =
    trimmedQuestion !== original.question ||
    trimmedAnswer !== original.answer ||
    sortOrder !== original.sortOrder;

  const canSubmit =
    !loading &&
    !loadFailed &&
    !saving &&
    trimmedQuestion.length > 0 &&
    trimmedAnswer.length > 0 &&
    validSortOrder &&
    hasChanges;

  useEffect(() => {
    if (!productId || !faqId) return;

    let active = true;

    async function loadFaq() {
      try {
        setLoading(true);
        setLoadFailed(false);

        const response = await fetch(
          `/api/vendor/products/${productId}/faqs/${faqId}`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            toast.error(data.message || "Failed to load FAQ.");
            setLoadFailed(true);
          }
          return;
        }

        if (!active) return;

        const faq: FAQ = data.faq;

        const faqQuestion = faq.question || "";
        const faqAnswer = faq.answer || "";
        const faqSortOrder = String(faq.sortOrder);

        setQuestion(faqQuestion);
        setAnswer(faqAnswer);
        setSortOrder(faqSortOrder);

        setOriginal({
          question: faqQuestion,
          answer: faqAnswer,
          sortOrder: faqSortOrder,
        });
      } catch (error) {
        console.error("Load vendor FAQ error:", error);

        if (active) {
          toast.error("Something went wrong while loading the FAQ.");
          setLoadFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFaq();

    return () => {
      active = false;
    };
  }, [productId, faqId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || loadFailed) return;

    if (!trimmedQuestion) {
      toast.error("Question is required.");
      return;
    }

    if (!trimmedAnswer) {
      toast.error("Answer is required.");
      return;
    }

    if (!validSortOrder) {
      toast.error("Sort order must be a non-negative integer.");
      return;
    }

    if (!hasChanges) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/faqs/${faqId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            answer: trimmedAnswer,
            sortOrder: parsedSortOrder,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update FAQ.");
        return;
      }

      toast.success("FAQ updated successfully.");

      router.push(faqsUrl);
      router.refresh();
    } catch (error) {
      console.error("Update vendor FAQ error:", error);

      toast.error("Something went wrong while updating the FAQ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-56 animate-pulse rounded-lg bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-12 w-64 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="h-[560px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-80 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#8065B0]">
          <CircleHelp size={22} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          FAQ unavailable
        </h1>

        <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
          This FAQ could not be loaded or may not be accessible to your vendor
          account.
        </p>

        <Link
          href={faqsUrl}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to FAQs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
      >
        <Link href={faqsUrl} className="cursor-pointer hover:text-gray-900">
          FAQs
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">Edit FAQ</span>
      </nav>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <CircleHelp size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Product FAQ
              </h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-3 py-1 text-xs font-medium text-[#77717F]">
                #{faqId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Update the question, answer, or display order for this product
              FAQ.
            </p>
          </div>
        </div>
        <Link
          href={faqsUrl}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to FAQs
        </Link>
      </section>

      {/* Main Layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* FAQ Form */}
        <form
          id="edit-faq-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          {/* Section Heading */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CircleHelp size={21} />
            </span>

            <div>
              <h2 className="text-base font-bold text-gray-900">FAQ Details</h2>

              <p className="mt-1 text-xs text-gray-500">
                Edit the question, answer, and display order.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-7 p-5 sm:p-6">
            {/* Question */}
            <div>
              <label
                htmlFor="question"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Question
                <span className="ml-1 text-[#8065B0]">*</span>
              </label>

              <div className="relative">
                <CircleHelp
                  size={18}
                  className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
                />

                <input
                  id="question"
                  name="question"
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={saving}
                  required
                  className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFCFD] pl-11 pr-4 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#A68BD2] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Answer */}
            <div>
              <label
                htmlFor="answer"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Answer
                <span className="ml-1 text-[#8065B0]">*</span>
              </label>

              <textarea
                id="answer"
                name="answer"
                rows={9}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={saving}
                required
                className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFCFD] px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#A68BD2] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  Keep the answer clear, accurate, and useful.
                </p>

                <span className="text-xs font-medium text-gray-400">
                  {answer.length} characters
                </span>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Sort Order
              </label>

              <div className="relative max-w-xs">
                <ListOrdered
                  size={18}
                  className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
                />

                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFCFD] pl-11 pr-4 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#A68BD2] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F8F7FA] p-3">
                <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />

                <p className="text-xs leading-5 text-gray-500">
                  Lower numbers appear first in the FAQ listing. Changing this
                  value updates the display order.
                </p>
              </div>

              {!validSortOrder && (
                <p className="mt-2 text-xs font-medium text-[#8065B0]">
                  Sort order must be a non-negative integer.
                </p>
              )}
            </div>

            {/* Unsaved Changes */}
            <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#F8F7FA] p-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  hasChanges
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {hasChanges ? <Clock3 size={19} /> : <CheckCircle2 size={19} />}
              </span>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  {hasChanges ? "Unsaved Changes" : "No Changes Yet"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {hasChanges
                    ? "You have modified this FAQ. Save your changes to apply the update."
                    : "Your FAQ currently matches the saved version."}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FAFAFB] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={faqsUrl}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          {/* Live Preview */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <CircleHelp size={19} />
              </span>

              <div>
                <h2 className="text-sm font-bold text-gray-900">FAQ Preview</h2>

                <p className="mt-1 text-xs text-gray-400">
                  Live question and answer preview
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Question
                </p>

                <p
                  className={`mt-2 whitespace-pre-wrap break-words text-sm font-bold leading-6 ${
                    trimmedQuestion ? "text-gray-900" : "italic text-gray-400"
                  }`}
                >
                  {trimmedQuestion || "Question preview"}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-[#F8F7FA] p-4">
                <div className="flex items-start gap-2">
                  <FileText
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Answer
                    </p>

                    <p
                      className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${
                        trimmedAnswer ? "text-gray-700" : "italic text-gray-400"
                      }`}
                    >
                      {trimmedAnswer || "Answer preview"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ListOrdered size={20} />
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  hasChanges
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {hasChanges ? "Unsaved" : "Unchanged"}
              </span>
            </div>

            <h2 className="mt-5 text-base font-bold text-gray-900">
              FAQ Summary
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Review the changes before saving.
            </p>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  FAQ ID
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  #{faqId}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Original Display Order
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  #{original.sortOrder}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Updated Display Order
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {validSortOrder ? `#${parsedSortOrder}` : "Invalid"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Question
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {trimmedQuestion !== original.question
                    ? "Modified"
                    : "Unchanged"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Answer
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {trimmedAnswer !== original.answer ? "Modified" : "Unchanged"}
                </p>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-gray-500"
              />

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  FAQ Guidelines
                </h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  Keep your product FAQs clear and useful. Changes to the
                  question, answer, or display order will update the FAQ
                  associated with this product.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage product FAQs. Grow your business.</p>
      </footer>
    </div>
  );
}
