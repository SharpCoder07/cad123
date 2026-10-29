"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import {
  AlertCircle,
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
  RefreshCw,
  Save,
} from "lucide-react";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

type FAQForm = {
  question: string;
  answer: string;
  sortOrder: string;
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function EditProductFAQPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const faqId = params.faqId as string;

  const faqsUrl = `/admin/products/${productId}/faqs`;

  const [form, setForm] = useState<FAQForm>({
    question: "",
    answer: "",
    sortOrder: "0",
  });

  const [originalForm, setOriginalForm] = useState<FAQForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const validQuestion = form.question.trim().length > 0;
  const validAnswer = form.answer.trim().length > 0;

  const validSortOrder =
    form.sortOrder.trim() !== "" &&
    Number.isSafeInteger(Number(form.sortOrder)) &&
    Number(form.sortOrder) >= 0;

  const completedFields =
    Number(validQuestion) + Number(validAnswer) + Number(validSortOrder);

  const hasChanges = useMemo(() => {
    if (!originalForm) return false;

    return (
      form.question !== originalForm.question ||
      form.answer !== originalForm.answer ||
      form.sortOrder !== originalForm.sortOrder
    );
  }, [form, originalForm]);

  const canSubmit =
    !loading &&
    !saving &&
    !loadError &&
    hasChanges &&
    validQuestion &&
    validAnswer &&
    validSortOrder;

  const loadFaq = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          `/api/admin/products/${productId}/faqs/${faqId}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.faq) {
          throw new Error(data.message || "Failed to load FAQ.");
        }

        if (signal?.aborted) return;

        const faq: FAQ = data.faq;

        const loadedForm: FAQForm = {
          question: faq.question ?? "",
          answer: faq.answer ?? "",
          sortOrder: String(faq.sortOrder ?? 0),
        };

        setForm(loadedForm);
        setOriginalForm(loadedForm);
      } catch (error) {
        if (signal?.aborted) return;

        console.error("Load FAQ error:", error);

        setLoadError(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId, faqId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadFaq(controller.signal);

    return () => controller.abort();
  }, [loadFaq]);

  function updateField<K extends keyof FAQForm>(field: K, value: FAQForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetChanges() {
    if (!originalForm || saving) return;

    setForm({ ...originalForm });
    toast.info("Changes discarded.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || !hasChanges) return;

    if (!validQuestion) {
      toast.error("Question is required.");
      return;
    }

    if (!validAnswer) {
      toast.error("Answer is required.");
      return;
    }

    if (!validSortOrder) {
      toast.error("Sort order must be a valid non-negative integer.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/faqs/${faqId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: form.question.trim(),
            answer: form.answer.trim(),
            sortOrder: Number(form.sortOrder),
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
      console.error("Update FAQ error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <EditFAQSkeleton />;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
        <Link
          href={faqsUrl}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to FAQs
        </Link>

        <div
          className={`${cardClass} flex min-h-[360px] flex-col items-center justify-center p-8 text-center`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-950">
            Unable to load FAQ
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => void loadFaq()}
            className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
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

            <span className="font-semibold text-gray-900">Edit FAQ</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <MessageSquareText size={22} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                  Edit Product FAQ
                </h1>

                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                  #{faqId}
                </span>
              </div>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Update the question, answer, or display order.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={faqsUrl}
          className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#4B5060] transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to FAQs
        </Link>
      </section>

      {/* Unsaved Changes Notice */}
      {hasChanges && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5">
          <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-900">
              You have unsaved changes
            </p>

            <p className="mt-0.5 text-xs leading-5 text-amber-800">
              Save your changes before leaving this page.
            </p>
          </div>
        </div>
      )}

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
              description="Edit the question and answer shown to visitors."
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
                    {form.question.length} characters
                  </span>
                </div>

                <input
                  id="question"
                  type="text"
                  value={form.question}
                  onChange={(event) =>
                    updateField("question", event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter FAQ question..."
                  required
                  className="mt-2 h-10 w-full rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Keep your question clear and easy to understand.
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
                    {form.answer.length} characters
                  </span>
                </div>

                <textarea
                  id="answer"
                  rows={8}
                  value={form.answer}
                  onChange={(event) =>
                    updateField("answer", event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter FAQ answer..."
                  required
                  className="mt-2 w-full resize-y rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-3.5 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Give an accurate and helpful answer.
                </p>
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className={cardClass}>
            <SectionHeading
              icon={<ListOrdered size={19} />}
              title="Display Settings"
              description="Change the FAQ's position in the list."
            />

            <div className="space-y-4 p-5 sm:p-6">
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
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", event.target.value)
                  }
                  disabled={saving}
                  required
                  className="mt-2 h-10 w-full rounded-lg border border-[#EAE7EF] bg-[#FCFBFE] px-3.5 text-sm text-gray-900 outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Lower numbers appear first. Duplicate order numbers are
                  allowed.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-[#F8F9FA] p-4">
                <div className="flex items-start gap-3">
                  <Info size={17} className="mt-0.5 shrink-0 text-gray-500" />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Manual ordering
                    </p>

                    <p className="mt-1 text-xs leading-6 text-gray-500">
                      This FAQ keeps its current sort order unless you change
                      it. You can assign an order already used by another FAQ.
                      When orders match, the listing uses FAQ ID as a secondary
                      sort.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={resetChanges}
              disabled={!hasChanges || saving}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Discard Changes
            </button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Link
                href={faqsUrl}
                onClick={(event) => {
                  if (saving) event.preventDefault();
                }}
                className={`inline-flex h-9 items-center justify-center rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50 ${
                  saving ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
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
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Live Preview */}
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Live Preview</h2>

              <span className="rounded-lg bg-[#F0EBFA] px-2 py-1 text-[10px] font-semibold text-gray-600">
                FAQ #{faqId}
              </span>
            </div>

            <div className="p-5">
              <div className="rounded-[16px] border border-[#EAE7EF] bg-[#FCFBFE] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600">
                    <CircleHelp size={19} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Question
                    </p>

                    <p className="mt-1.5 break-words text-sm font-semibold leading-6 text-gray-900">
                      {form.question.trim() ||
                        "Your question will appear here."}
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
                        {form.answer.trim() || "Your answer will appear here."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">Display position</span>

                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                  Order #{form.sortOrder || "0"}
                </span>
              </div>
            </div>
          </section>

          {/* Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-900">
                Form Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Required fields
              </span>

              <span className="text-sm font-bold text-gray-950">
                {completedFields}/3
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#8D70BD] transition-all duration-300"
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

          {/* Save Status */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <Info size={17} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-900">Save Status</h2>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  hasChanges ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />

              <span className="text-xs font-medium text-gray-600">
                {hasChanges ? "Unsaved changes" : "No changes to save"}
              </span>
            </div>

            <p className="mt-3 text-xs leading-6 text-gray-500">
              Changes are saved only when you click <strong>Update FAQ</strong>.
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

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
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

function EditFAQSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] animate-pulse space-y-7 pb-10">
      <div>
        <div className="h-4 w-52 rounded bg-gray-200" />

        <div className="mt-5 h-9 w-72 rounded-lg bg-gray-200" />

        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-6">
          <div className={`${cardClass} p-6`}>
            <div className="h-6 w-40 rounded bg-gray-200" />

            <div className="mt-8 h-12 rounded-xl bg-gray-100" />

            <div className="mt-7 h-40 rounded-xl bg-gray-100" />
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="h-6 w-40 rounded bg-gray-200" />

            <div className="mt-8 h-12 max-w-xs rounded-xl bg-gray-100" />
          </div>
        </div>

        <div className="space-y-5">
          <div className={`${cardClass} p-5`}>
            <div className="h-5 w-28 rounded bg-gray-200" />

            <div className="mt-6 h-44 rounded-xl bg-gray-100" />
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="h-5 w-36 rounded bg-gray-200" />

            <div className="mt-6 h-3 rounded bg-gray-100" />

            <div className="mt-4 h-3 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
