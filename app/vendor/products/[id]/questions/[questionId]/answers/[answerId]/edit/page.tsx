
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  LoaderCircle,
  MessageSquare,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

type Answer = {
  id: number;
  answer: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(55,38,81,0.025)]";

export default function EditVendorProductAnswerPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const questionId = params.questionId as string;
  const answerId = params.answerId as string;

  const [answer, setAnswer] = useState("");
  const [originalAnswer, setOriginalAnswer] = useState("");
  const [authorName, setAuthorName] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const questionsUrl =
    `/vendor/products/${productId}/questions`;

  const questionDetailsUrl =
    `/vendor/products/${productId}/questions/${questionId}`;

  const trimmedAnswer = answer.trim();

  const hasChanges = trimmedAnswer !== originalAnswer;

  const canSubmit =
    !saving &&
    !loading &&
    trimmedAnswer.length > 0 &&
    hasChanges;

  useEffect(() => {
    if (!productId || !questionId || !answerId) return;

    let active = true;

    async function loadAnswer() {
      try {
        setLoading(true);
        setLoadFailed(false);

        const response = await fetch(
          `/api/vendor/products/${productId}/questions/${questionId}/answers/${answerId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            toast.error(
              data.message || "Failed to load answer."
            );
            setLoadFailed(true);
          }
          return;
        }

        if (!active) return;

        const answerData: Answer = data.answer;

        setAnswer(answerData.answer);
        setOriginalAnswer(answerData.answer);
        setAuthorName(
          answerData.user.name || answerData.user.email
        );
      } catch (error) {
        console.error("Load vendor answer error:", error);

        if (active) {
          toast.error("Something went wrong.");
          setLoadFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAnswer();

    return () => {
      active = false;
    };
  }, [productId, questionId, answerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedAnswer) {
      toast.error("Answer is required.");
      return;
    }

    if (!hasChanges || saving) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/questions/${questionId}/answers/${answerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer: trimmedAnswer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to update answer."
        );
        return;
      }

      toast.success("Answer updated successfully.");

      router.push(questionsUrl);
      router.refresh();
    } catch (error) {
      console.error("Update vendor answer error:", error);
      toast.error("Something went wrong.");
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
          <div className="h-[520px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-80 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
          <MessageSquare size={22} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Answer unavailable
        </h1>

        <p className="mt-2 max-w-lg text-[14px] leading-5 text-[#77808E]">
          This answer could not be loaded or may not be
          accessible to your vendor account.
        </p>

        <Link
          href={questionDetailsUrl}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Questions
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
        <Link
          href={questionsUrl}
          className="cursor-pointer hover:text-gray-900"
        >
          Questions
        </Link>

        <ChevronRight size={13} />

        <Link
          href={questionDetailsUrl}
          className="cursor-pointer hover:text-gray-900"
        >
          Question
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">Edit Answer</span>
      </nav>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <MessageSquare size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Edit Answer</h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-3 py-1 text-xs font-medium text-[#77717F]">#{answerId}</span>
            </div>
            <p className="mt-1 text-[14px] leading-5 text-[#77808E]">Update your response to this customer question.</p>
          </div>
        </div>
        <Link
          href={questionDetailsUrl}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Question
        </Link>
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Form */}
        <form
          id="edit-answer-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          {/* Author */}
          <div className="border-b border-gray-100 bg-[#FCFAFE] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                <UserRound size={19} />
              </span>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Answered By
                </p>

                <p className="mt-1 break-words text-sm font-bold text-gray-900">
                  {authorName || "Vendor"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Answer author
                </p>
              </div>
            </div>
          </div>

          {/* Answer Editor */}
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <MessageSquare size={21} />
              </span>

              <div>
                <h2 className="text-base font-semibold text-[#1F2430]">
                  Answer Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Edit the existing response below.
                </p>
              </div>
            </div>

            <label
              htmlFor="answer"
              className="mb-2 block text-[13px] font-semibold text-gray-700"
            >
              Your Answer
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
              disabled={saving}
              required
              className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFAFE] px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#A78CD0] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-gray-500">
                Changes will update the answer shown for this
                product question.
              </p>

              <span className="shrink-0 text-xs font-medium text-gray-400">
                {answer.length} characters
              </span>
            </div>

            {/* Change Detection */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#FAF8FD] p-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  hasChanges
                    ? "bg-[#FFF2DE] text-[#A77734]"
                    : "bg-[#F0EBFA] text-[#8065B0]"
                }`}
              >
                {hasChanges ? (
                  <Clock3 size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
              </span>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  {hasChanges
                    ? "Unsaved Changes"
                    : "No Changes Yet"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {hasChanges
                    ? "You have modified this answer. Save your changes to apply the update."
                    : "Your answer currently matches the saved response."}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FCFAFE] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={questionDetailsUrl}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
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
                <MessageSquare size={19} />
              </span>

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Answer Preview
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Live response preview
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <UserRound size={17} />
                </span>

                <div className="min-w-0">
                  <p className="break-words text-xs font-bold text-gray-900">
                    {authorName || "Vendor"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Updated response preview
                  </p>
                </div>
              </div>

              <div className="mt-4 min-h-[110px] rounded-2xl bg-[#FAF8FD] p-4">
                <p
                  className={`whitespace-pre-wrap break-words text-sm leading-7 ${
                    trimmedAnswer
                      ? "text-gray-700"
                      : "italic text-gray-400"
                  }`}
                >
                  {trimmedAnswer ||
                    "Your updated answer will appear here."}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Characters</span>

                <span className="font-semibold text-gray-700">
                  {answer.length}
                </span>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={20} />
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  hasChanges
                    ? "border border-[#F5E2C7] bg-[#FFF8ED] text-[#A77734]"
                    : "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]"
                }`}
              >
                {hasChanges ? "Unsaved" : "Unchanged"}
              </span>
            </div>

            <h2 className="mt-5 text-base font-semibold text-[#1F2430]">
              Answer Summary
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Review the response details before saving.
            </p>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#FAF8FD] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Answer ID
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  #{answerId}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Question ID
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  #{questionId}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Answer Author
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                  {authorName || "Vendor"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Original Length
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {originalAnswer.length} characters
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Updated Length
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {answer.length} characters
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
                  Response Guidelines
                </h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  Keep your answer accurate, relevant, and helpful.
                  Updates to this response will be reflected in the
                  product's customer Q&A section.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage customer questions. Grow your business.</p>
      </footer>
    </div>
  );
}
