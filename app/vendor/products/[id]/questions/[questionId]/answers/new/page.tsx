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
  Info,
  LoaderCircle,
  MessageCircleQuestion,
  MessageSquare,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

type Question = { id: number; question: string };

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";
const iconClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm";
const primaryClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]";

export default function NewVendorProductAnswerPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const trimmedAnswer = answer.trim();
  const canSubmit =
    !loading && !!question && !saving && trimmedAnswer.length > 0;
  const questionsUrl = `/vendor/products/${productId}/questions`;
  const questionDetailsUrl = `/vendor/products/${productId}/questions/${questionId}`;

  useEffect(() => {
    if (!productId || !questionId) return;
    let active = true;
    async function loadQuestion() {
      try {
        setLoading(true);
        setQuestion(null);
        const response = await fetch(
          `/api/vendor/products/${productId}/questions/${questionId}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (active) toast.error(data.message || "Failed to load question.");
          return;
        }
        if (active) setQuestion(data.question);
      } catch (error) {
        console.error("Load vendor question error:", error);
        if (active) toast.error("Something went wrong.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadQuestion();
    return () => {
      active = false;
    };
  }, [productId, questionId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || !question) return;
    if (!trimmedAnswer) {
      toast.error("Answer is required.");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(
        `/api/vendor/products/${productId}/questions/${questionId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: trimmedAnswer }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add answer.");
        return;
      }
      toast.success("Answer added successfully.");
      router.push(questionsUrl);
      router.refresh();
    } catch (error) {
      console.error("Add vendor answer error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-52 animate-pulse rounded-lg bg-[#EAE7EF]" />
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-[#EAE7EF]" />
          <div className="h-12 w-56 animate-pulse rounded-xl bg-[#EAE7EF]" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="h-[520px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-80 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );

  if (!question)
    return (
      <section className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
          <CircleHelp size={23} />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-[#1F2430]">
          Question unavailable
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[#77808E]">
          This question could not be loaded or does not belong to one of your
          products.
        </p>
        <Link href={questionsUrl} className={`${primaryClass} mt-6`}>
          <ArrowLeft size={16} />
          Back to Questions
        </Link>
      </section>
    );

  return (
    <div className="space-y-6 pb-8">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#9893A1]"
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
        <span className="text-[#44414C]">Add Answer</span>
      </nav>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className={iconClass}>
            <MessageSquare size={22} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Add Answer
            </h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Respond to a customer question about your product.
            </p>
          </div>
        </div>
        <Link
          href={questionDetailsUrl}
          className={`${secondaryClass} self-start`}
        >
          <ArrowLeft size={16} />
          Back to Question
        </Link>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <form
          id="add-answer-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="border-b border-[#EAE7EF] bg-[#FBFAFD] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className={iconClass}>
                <MessageCircleQuestion size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77717F]">
                    Customer Question
                  </span>
                  <span className="rounded-lg border border-[#E7E0F1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8065B0]">
                    #{question.id}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-[15px] font-semibold leading-7 text-[#1F2430]">
                  {question.question}
                </p>
                <Link
                  href={questionDetailsUrl}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#8065B0] hover:text-[#654B97]"
                >
                  View Question Details
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className={iconClass}>
                <MessageSquare size={20} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-[#1F2430]">
                  Your Response
                </h2>
                <p className="mt-0.5 text-xs text-[#77808E]">
                  Write a helpful answer for this customer.
                </p>
              </div>
            </div>
            <label
              htmlFor="answer"
              className="mb-2 block text-[13px] font-medium text-[#44414C]"
            >
              Your Answer <span className="text-[#DC5361]">*</span>
            </label>
            <textarea
              id="answer"
              name="answer"
              rows={9}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write a clear and helpful answer..."
              disabled={saving}
              required
              className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm leading-7 text-[#1F2430] outline-none transition placeholder:text-[#AAA4B1] hover:border-[#C9B7E5] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs leading-5 text-[#77808E]">
                Your answer will be associated with your authenticated vendor
                account.
              </p>
              <span className="text-xs font-medium text-[#9893A1]">
                {answer.length} characters
              </span>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#EAE7EF] bg-[#F9F7FC] p-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${trimmedAnswer ? "bg-[#EFF9F3] text-[#278455]" : "bg-[#F0EBFA] text-[#8065B0]"}`}
              >
                <CheckCircle2 size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1F2430]">
                  {trimmedAnswer ? "Answer Ready" : "Answer Required"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#77808E]">
                  {trimmedAnswer
                    ? "Your response is ready to be submitted."
                    : "Enter an answer before submitting your response."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#EAE7EF] bg-[#FBFAFD] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link href={questionDetailsUrl} className={secondaryClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className={primaryClass}
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Save Answer
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-[#EAE7EF] px-5 py-4">
              <span className={iconClass}>
                <MessageSquare size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#1F2430]">
                  Answer Preview
                </h2>
                <p className="mt-0.5 text-xs text-[#77808E]">
                  Live response preview
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <UserRound size={17} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#1F2430]">
                    Your Response
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9893A1]">
                    Draft preview
                  </p>
                </div>
              </div>
              <div className="mt-4 min-h-[110px] rounded-2xl bg-[#F8F6FB] p-4">
                <p
                  className={`whitespace-pre-wrap break-words text-sm leading-7 ${trimmedAnswer ? "text-[#44414C]" : "italic text-[#9893A1]"}`}
                >
                  {trimmedAnswer || "Your answer will appear here as you type."}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[#9893A1]">
                <span>Characters</span>
                <span className="font-semibold text-[#44414C]">
                  {answer.length}
                </span>
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className={iconClass}>
                <Info size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#1F2430]">
                  Submission Summary
                </h2>
                <p className="mt-0.5 text-xs text-[#77808E]">
                  Review before submitting
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F6FB] p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9893A1]">
                  Question ID
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#1F2430]">
                  #{question.id}
                </p>
              </div>
              <div className="border-t border-[#EAE7EF] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9893A1]">
                  Response Status
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#44414C]">
                  {trimmedAnswer ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#278455]" />
                      Ready to Submit
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} className="text-[#8065B0]" />
                      Draft
                    </>
                  )}
                </p>
              </div>
              <div className="border-t border-[#EAE7EF] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9893A1]">
                  Character Count
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#1F2430]">
                  {answer.length}
                </p>
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-5`}>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#1F2430]">
                  Response Guidelines
                </h3>
                <p className="mt-2 text-xs leading-6 text-[#77808E]">
                  Provide accurate, clear, and relevant information. Your
                  response will be linked to your authenticated vendor account.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
      <footer className="flex flex-col gap-2 border-t border-[#EAE7EF] pt-5 text-xs text-[#9893A1] sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage customer questions. Grow your business.</p>
      </footer>
    </div>
  );
}
