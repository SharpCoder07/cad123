
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  ListOrdered,
  LoaderCircle,
  ShieldCheck,
  ArrowLeft,
  Save
} from "lucide-react";
import { toast } from "react-toastify";

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

export default function NewVendorProductFAQPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  const faqsUrl = `/vendor/products/${productId}/faqs`;

  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();
  const parsedSortOrder = Number(sortOrder);

  const validSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(parsedSortOrder) && parsedSortOrder >= 0;

  const canSubmit =
    !saving &&
    trimmedQuestion.length > 0 &&
    trimmedAnswer.length > 0 &&
    validSortOrder;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

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

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/faqs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            answer: trimmedAnswer,
            sortOrder: parsedSortOrder,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to create FAQ."
        );
        return;
      }

      toast.success("FAQ created successfully.");

      router.push(faqsUrl);
      router.refresh();
    } catch (error) {
      console.error("Create vendor FAQ error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#77808E]"
      >
        <Link
          href={faqsUrl}
          className="cursor-pointer hover:text-gray-900"
        >
          FAQs
        </Link>

        <ChevronRight size={13} />

        <span className="text-[#44414C]">Add FAQ</span>
      </nav>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <CircleHelp size={22} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Add Product FAQ
            </h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Create a frequently asked question and answer for this product.
            </p>
          </div>
        </div>
        <Link
          href={faqsUrl}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
         <ArrowLeft size={16} /> Back to FAQs
        </Link>
      </section>

      {/* Main Layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* FAQ Form */}
        <form
          id="add-faq-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          {/* Section Heading */}
          <div className="flex items-center gap-3 border-b border-[#EFECF3] px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CircleHelp size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                FAQ Details
              </h2>

              <p className="mt-1 text-xs text-[#77808E]">
                Provide a clear question, helpful answer,
                and display order.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-7 p-5 sm:p-6">
            {/* Question */}
            <div>
              <label
                htmlFor="question"
                className="mb-2 block text-[13px] font-semibold text-[#44414C]"
              >
                Question
                <span className="ml-1 text-[#DC5361]">*</span>
              </label>

              <div className="relative">
                <CircleHelp
                  size={18}
                  className="pointer-events-none absolute left-4 top-3.5 text-[#92909C]"
                />

                <input
                  id="question"
                  name="question"
                  type="text"
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="e.g. Does this product offer a free trial?"
                  disabled={saving}
                  required
                  className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] pl-11 pr-4 text-sm text-[#1F2430] outline-none transition placeholder:text-[#92909C] hover:border-gray-300 focus:border-[#9B83C5] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <p className="mt-2 text-xs text-[#92909C]">
                Write a question that customers commonly ask.
              </p>
            </div>

            {/* Answer */}
            <div>
              <label
                htmlFor="answer"
                className="mb-2 block text-[13px] font-semibold text-[#44414C]"
              >
                Answer
                <span className="ml-1 text-[#DC5361]">*</span>
              </label>

              <textarea
                id="answer"
                name="answer"
                rows={9}
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                placeholder="Enter a clear and helpful answer..."
                disabled={saving}
                required
                className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm leading-7 text-[#1F2430] outline-none transition placeholder:text-[#92909C] hover:border-gray-300 focus:border-[#9B83C5] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#92909C]">
                  Keep your answer accurate, concise, and useful.
                </p>

                <span className="text-xs font-medium text-[#77808E]">
                  {answer.length} characters
                </span>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="mb-2 block text-[13px] font-semibold text-[#44414C]"
              >
                Sort Order
              </label>

              <div className="relative max-w-xs">
                <ListOrdered
                  size={18}
                  className="pointer-events-none absolute left-4 top-3.5 text-[#92909C]"
                />

                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] pl-11 pr-4 text-sm text-[#1F2430] outline-none transition hover:border-gray-300 focus:border-[#9B83C5] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F8F7FA] p-3">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-[#92909C]"
                />

                <p className="text-xs leading-5 text-[#77808E]">
                  Lower sort-order numbers appear first in
                  the product FAQ listing. The default is 0.
                </p>
              </div>

              {!validSortOrder && (
                <p className="mt-2 text-xs font-medium text-[#DC5361]">
                  Sort order must be a non-negative integer.
                </p>
              )}
            </div>

            {/* Readiness */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#EFECF3] bg-[#F8F7FA] p-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  canSubmit
                    ? "bg-[#EFF9F3] text-[#278455]"
                    : "bg-[#F0EBFA] text-[#8065B0]"
                }`}
              >
                <CheckCircle2 size={19} />
              </span>

              <div>
                <p className="text-sm font-semibold text-[#1F2430]">
                  {canSubmit
                    ? "FAQ Ready"
                    : "Complete FAQ Details"}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#77808E]">
                  {canSubmit
                    ? "Your FAQ is ready to be added to the product."
                    : "Enter a question, answer, and valid sort order before submitting."}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EFECF3] bg-[#FCFBFE] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={faqsUrl}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save FAQ
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          {/* Live Preview */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-[#EFECF3] px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <CircleHelp size={19} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-[#1F2430]">
                  FAQ Preview
                </h2>

                <p className="mt-1 text-xs text-[#92909C]">
                  Live question and answer preview
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                  Question
                </p>

                <p
                  className={`mt-2 whitespace-pre-wrap break-words text-sm font-bold leading-6 ${
                    trimmedQuestion
                      ? "text-[#1F2430]"
                      : "italic text-[#92909C]"
                  }`}
                >
                  {trimmedQuestion ||
                    "Your question will appear here."}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-[#F8F7FA] p-4">
                <div className="flex items-start gap-2">
                  <FileText
                    size={16}
                    className="mt-0.5 shrink-0 text-[#92909C]"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                      Answer
                    </p>

                    <p
                      className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${
                        trimmedAnswer
                          ? "text-[#44414C]"
                          : "italic text-[#92909C]"
                      }`}
                    >
                      {trimmedAnswer ||
                        "Your answer will appear here."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ListOrdered size={20} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-[#1F2430]">
                  FAQ Summary
                </h2>

                <p className="mt-1 text-xs text-[#92909C]">
                  Review before adding
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                  Product
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1F2430]">
                  #{productId}
                </p>
              </div>

              <div className="border-t border-[#EAE7EF] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                  Display Order
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1F2430]">
                  {validSortOrder
                    ? `#${parsedSortOrder}`
                    : "Invalid"}
                </p>
              </div>

              <div className="border-t border-[#EAE7EF] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                  Question
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1F2430]">
                  {trimmedQuestion
                    ? "Completed"
                    : "Required"}
                </p>
              </div>

              <div className="border-t border-[#EAE7EF] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#92909C]">
                  Answer
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1F2430]">
                  {trimmedAnswer
                    ? "Completed"
                    : "Required"}
                </p>
              </div>
            </div>

          </section>

          {/* Guidelines */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#77808E]"
              />

              <div>
                <h3 className="text-sm font-semibold text-[#1F2430]">
                  FAQ Guidelines
                </h3>

                <p className="mt-2 text-xs leading-6 text-[#77808E]">
                  Use questions that customers frequently ask,
                  provide clear answers, and choose a display
                  order that makes important information easy
                  to find.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-[#EAE7EF] pt-5 text-xs text-[#92909C] sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage product FAQs. Grow your business.</p>
      </footer>
    </div>
  );
}
