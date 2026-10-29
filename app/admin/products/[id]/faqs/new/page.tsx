"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  ListOrdered,
  Loader2,
  MessageSquareText,
  Plus,
  Save,
} from "lucide-react";

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function NewProductFAQPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const faqsUrl = `/admin/products/${productId}/faqs`;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  const validQuestion = question.trim().length > 0;
  const validAnswer = answer.trim().length > 0;

  const validSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(Number(sortOrder)) &&
    Number(sortOrder) >= 0;

  const completedFields =
    Number(validQuestion) + Number(validAnswer) + Number(validSortOrder);

  const canSubmit = validQuestion && validAnswer && validSortOrder && !saving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!question.trim()) {
      toast.error("Question is required.");
      return;
    }

    if (!answer.trim()) {
      toast.error("Answer is required.");
      return;
    }

    if (!validSortOrder) {
      toast.error("Sort order must be a valid non-negative integer.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/products/${productId}/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          sortOrder: Number(sortOrder),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create FAQ.");
        return;
      }

      toast.success("FAQ created successfully.");

      router.push(faqsUrl);
      router.refresh();
    } catch (error) {
      console.error("Create FAQ error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Page Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href={faqsUrl}
              className="cursor-pointer transition hover:text-gray-900"
            >
              FAQs
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Add FAQ</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <MessageSquareText size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Product FAQ
              </h1>

              <p className="mt-1 text-sm leading-6 text-[#77808E]">
                Create a frequently asked question and its answer for this
                product.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={faqsUrl}
          className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to FAQs
        </Link>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        {/* Main Form */}
        <div className="min-w-0 space-y-6">
          {/* FAQ Content */}
          <section className={cardClass}>
            <SectionHeading
              icon={<MessageSquareText size={19} />}
              title="FAQ Content"
              description="Write a clear question and a helpful answer."
            />

            <div className="space-y-6 p-5 sm:p-6">
              {/* Question */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="question"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Question <span className="text-red-500">*</span>
                  </label>

                  <span className="text-xs text-gray-400">
                    {question.length} characters
                  </span>
                </div>

                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. Does this product offer a free trial?"
                  disabled={saving}
                  required
                  className="mt-2 h-10 w-full rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Use a short, direct question that customers are likely to ask.
                </p>
              </div>

              {/* Answer */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="answer"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Answer <span className="text-red-500">*</span>
                  </label>

                  <span className="text-xs text-gray-400">
                    {answer.length} characters
                  </span>
                </div>

                <textarea
                  id="answer"
                  rows={8}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Enter a clear and helpful answer..."
                  disabled={saving}
                  required
                  className="mt-2 w-full resize-y rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Provide an accurate answer that helps visitors understand the
                  product.
                </p>
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className={cardClass}>
            <SectionHeading
              icon={<ListOrdered size={19} />}
              title="Display Settings"
              description="Control where this FAQ appears in the list."
            />

            <div className="p-5 sm:p-6">
              <div className="max-w-xs">
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Sort Order <span className="text-red-500">*</span>
                </label>

                <input
                  id="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  disabled={saving}
                  required
                  className="mt-2 h-10 w-full rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-4 text-sm text-gray-900 outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Lower numbers appear first. Use 0 for the first position.
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[22px] border border-[#E8EAED] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={faqsUrl}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#EAE7EF] bg-white px-4 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving FAQ...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save FAQ
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Live Preview */}
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Live Preview</h2>

              <span className="rounded-lg bg-[#F0EBFA] px-2 py-1 text-[10px] font-semibold text-[#8065B0]">
                FAQ
              </span>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-[#EAE7EF] bg-[#FCFBFE] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                    <CircleHelp size={19} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Question
                    </p>

                    <p className="mt-1.5 break-words text-sm font-semibold leading-6 text-gray-900">
                      {question.trim() || "Your question will appear here."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-2">
                    <FileText
                      size={15}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                        Answer
                      </p>

                      <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-6 text-gray-600">
                        {answer.trim() ||
                          "Your answer will appear here as you type."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[#77808E]">Display position</span>

                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                  Order #{sortOrder || "0"}
                </span>
              </div>
            </div>
          </section>

          {/* Form Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-900">
                Form Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-[#77808E]">
                Required fields
              </span>

              <span className="text-sm font-bold text-gray-950">
                {completedFields}/3
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#8B70B9] transition-all duration-300"
                style={{
                  width: `${(completedFields / 3) * 100}%`,
                }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <CompletionRow
                label="Question entered"
                completed={validQuestion}
              />

              <CompletionRow label="Answer entered" completed={validAnswer} />

              <CompletionRow
                label="Valid sort order"
                completed={validSortOrder}
              />
            </div>
          </section>

          {/* Tip */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-[#F8F5FC] p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-800">Writing Tips</h2>
            </div>

            <p className="mt-3 text-xs leading-6 text-[#77808E]">
              Write questions in natural language and keep answers concise,
              helpful, and accurate. Focus on common customer concerns such as
              pricing, compatibility, licensing, and free trials.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-base font-bold text-gray-950">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-[#77808E]">{description}</p>
      </div>
    </div>
  );
}

function CompletionRow({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          completed
            ? "bg-emerald-50 text-emerald-600"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {completed ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>

      <span
        className={`text-xs ${completed ? "text-gray-700" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}
