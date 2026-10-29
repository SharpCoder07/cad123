"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
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
  Loader2,
  MessageCircleQuestion,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Question = {
  id: number;
  question: string;
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]";

type Props = {
  productId: number;
  questionId: number;
  canViewProducts: boolean;
  canViewQuestions: boolean;
};

export default function NewProductAnswerForm({
  productId,
  questionId,
  canViewProducts,
  canViewQuestions,
}: Props) {
  const router = useRouter();

  const questionsUrl = `/admin/products/${productId}/questions`;

  const backUrl = canViewQuestions ? questionsUrl : "/admin";

  const [question, setQuestion] = useState<Question | null>(null);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const isValidAnswer = answer.trim().length > 0;

  const loadQuestion = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          `/api/admin/products/${productId}/questions/${questionId}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.question) {
          throw new Error(data.message || "Failed to load question.");
        }

        if (signal?.aborted) return;

        setQuestion(data.question);
      } catch (error) {
        if (signal?.aborted) return;

        console.error("Load question error:", error);

        setLoadError(
          error instanceof Error ? error.message : "Something went wrong.",
        );

        setQuestion(null);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId, questionId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadQuestion(controller.signal);

    return () => controller.abort();
  }, [loadQuestion]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || !question) return;

    if (!isValidAnswer) {
      toast.error("Answer is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/questions/${questionId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer: answer.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add answer.");
        return;
      }

      toast.success("Answer added successfully.");

      router.push(backUrl);
      router.refresh();
    } catch (error) {
      console.error("Add answer error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AddAnswerSkeleton />;
  }

  if (loadError || !question) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
        <Link
          href={backUrl}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to Questions
        </Link>

        <div
          className={`${cardClass} flex min-h-[350px] flex-col items-center justify-center p-8 text-center`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-950">
            Unable to load question
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            {loadError || "Question could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => void loadQuestion()}
            className="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
      {/* Page Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9A95A3]"
          >
            {canViewProducts ? (
              <Link
                href="/admin/products"
                className="cursor-pointer transition hover:text-gray-900"
              >
                Products
              </Link>
            ) : (
              <span>Products</span>
            )}

            <ChevronRight size={14} />

            {canViewQuestions ? (
              <Link
                href={questionsUrl}
                className="cursor-pointer transition hover:text-gray-900"
              >
                Questions
              </Link>
            ) : (
              <span>Questions</span>
            )}

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Add Answer</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <MessageSquareText size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Answer
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Respond to a customer question about this product.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={backUrl}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={17} />
          Back to Questions
        </Link>
      </section>

      {/* Main Content */}
      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        <div className="min-w-0 space-y-6">
          {/* Customer Question */}
          <section className={cardClass}>
            <SectionHeading
              icon={<MessageCircleQuestion size={19} />}
              title="Customer Question"
              description="The original question submitted by the customer."
            />

            <div className="p-5 sm:p-6">
              <div className="rounded-2xl border border-[#EAE7EF] bg-[#FBFAFD] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DDF1] bg-[#F0EBFA] px-2.5 py-1.5 text-[11px] font-semibold text-[#8065B0]">
                    <CircleHelp size={14} />
                    Question #{question.id}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <ShieldCheck size={15} />
                    Read-only
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-base font-semibold leading-8 text-[#24212D]">
                  {question.question}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />

                <p className="text-xs leading-5 text-gray-500">
                  Customer questions cannot be edited from this page. You can
                  only add a response.
                </p>
              </div>
            </div>
          </section>

          {/* Answer Editor */}
          <section className={cardClass}>
            <SectionHeading
              icon={<FileText size={19} />}
              title="Your Answer"
              description="Write a clear and helpful response for the customer."
            />

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="answer"
                  className="text-[13px] font-medium text-[#44414C]"
                >
                  Answer <span className="text-red-500">*</span>
                </label>

                <span className="text-xs text-gray-400">
                  {answer.length} characters
                </span>
              </div>

              <textarea
                id="answer"
                rows={9}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Write your answer to the customer question..."
                disabled={saving}
                required
                className="mt-2 w-full resize-y rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm leading-7 text-[#24212D] outline-none transition placeholder:text-[#9A95A3] focus:border-[#AA94D0] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs leading-5 text-gray-500">
                  Include accurate details relevant to the customer's question.
                </p>

                {isValidAnswer && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} />
                    Ready to submit
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={backUrl}
              onClick={(event) => {
                if (saving) event.preventDefault();
              }}
              className={`inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-[13px] font-medium text-[#44414C] transition hover:bg-gray-50 ${
                saving ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || !isValidAnswer}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Add Answer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Live Preview */}
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#F0EDF3] px-5 py-4">
              <h2 className="text-[14px] font-semibold text-[#1F2430]">
                Answer Preview
              </h2>

              <span className="rounded-full border border-[#E5DDF1] bg-[#F0EBFA] px-2 py-1 text-[10px] font-semibold text-[#8065B0]">
                Live
              </span>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-[#EAE7EF] bg-[#FBFAFD] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                    <UserRound size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#1F2430]">
                      Admin Response
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      New answer
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="whitespace-pre-wrap break-words text-xs leading-6 text-gray-600">
                    {answer.trim() ||
                      "Your answer will appear here as you type."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-gray-600" />

              <h2 className="text-[14px] font-semibold text-[#1F2430]">
                Form Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Required fields
              </span>

              <span className="text-sm font-bold text-gray-950">
                {isValidAnswer ? "1/1" : "0/1"}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#8065B0] transition-all duration-300"
                style={{
                  width: isValidAnswer ? "100%" : "0%",
                }}
              />
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  isValidAnswer
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isValidAnswer ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                )}
              </span>

              <span className="text-xs text-gray-600">Answer entered</span>
            </div>
          </section>

          {/* Writing Tips */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <Info size={18} className="text-gray-600" />

              <h2 className="text-[14px] font-semibold text-[#1F2430]">Writing Tips</h2>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-6 text-gray-500">
              <p>• Address the customer's specific question.</p>

              <p>• Use simple and professional language.</p>

              <p>• Double-check product details before submitting.</p>
            </div>
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
    <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-[15px] font-semibold text-[#1F2430]">{title}</h2>

        <p className="mt-0.5 text-xs leading-5 text-[#77808E]">{description}</p>
      </div>
    </div>
  );
}

function AddAnswerSkeleton() {
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
            <div className="mt-7 h-28 rounded-xl bg-gray-100" />
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="mt-7 h-48 rounded-xl bg-gray-100" />
          </div>
        </div>

        <div className="space-y-5">
          <div className={`${cardClass} p-5`}>
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="mt-6 h-40 rounded-xl bg-gray-100" />
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="h-5 w-36 rounded bg-gray-200" />
            <div className="mt-6 h-3 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
