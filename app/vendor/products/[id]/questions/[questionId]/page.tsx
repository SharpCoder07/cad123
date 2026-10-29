"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

type User = {
  id: number;
  name: string | null;
  email: string;
  vendorId?: number | null;
};

type Answer = {
  id: number;
  answer: string;
  createdAt: string;
  user: User;
};

type Question = {
  id: number;
  question: string;
  createdAt: string;
  user: User;
  answers: Answer[];
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(45,33,65,0.025)]";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VendorProductQuestionDetailsPage() {
  const params = useParams();

  const productId = params.id as string;
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
          toast.error(data.message || "Failed to load question.");
          return;
        }

        if (!active) return;

        setQuestion(data.question);
        setVendorId(data.vendorId ?? null);
      } catch (error) {
        console.error("Load vendor question details error:", error);

        if (active) {
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadQuestion();

    return () => {
      active = false;
    };
  }, [productId, questionId]);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-56 animate-pulse rounded-lg bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-12 w-72 max-w-full animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <div className="h-60 animate-pulse rounded-[20px] bg-white" />
            <div className="h-80 animate-pulse rounded-[20px] bg-white" />
          </div>

          <div className="h-72 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#DC0000]">
          <MessageCircleQuestion size={23} />
        </span>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          Question unavailable
        </h2>

        <p className="mt-2 max-w-lg text-[14px] leading-6 text-[#77808E]">
          This question could not be loaded or does not belong to one of your
          products.
        </p>

        <Link
          href={`/vendor/products/${productId}/questions`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Questions
        </Link>
      </div>
    );
  }

  const hasAnswers = question.answers.length > 0;

  const vendorAnswers = question.answers.filter(
    (answer) => vendorId !== null && answer.user.vendorId === vendorId,
  ).length;

  const addAnswerUrl = `/vendor/products/${productId}/questions/${question.id}/answers/new`;

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        <Link
          href={`/vendor/products/${productId}/questions`}
          className="cursor-pointer hover:text-gray-900"
        >
          Questions
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">Question</span>
      </div>

      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <MessageCircleQuestion size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Question Details
              </h1>
              <span className="rounded-lg border border-[#EAE7EF] bg-white px-2.5 py-1 text-xs font-medium text-[#77717F]">
                #{question.id}
              </span>
              {hasAnswers ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1 text-xs font-medium text-[#278455]">
                  <CheckCircle2 size={13} /> Answered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#F3E6CE] bg-[#FFF7E8] px-2.5 py-1 text-xs font-medium text-[#9A742F]">
                  <Clock3 size={13} /> Awaiting Answer
                </span>
              )}
            </div>
            <p className="mt-1 text-[14px] leading-5 text-[#77808E]">
              Review the customer question and manage your responses.
            </p>
          </div>
        </div>
        <Link
          href={`/vendor/products/${productId}/questions`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to Questions
        </Link>
      </section>

      {/* Main Layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-6">
          {/* Customer Question */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <MessageCircleQuestion size={21} />
              </span>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Customer Question
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Original question submitted for this product.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <MessageCircleQuestion size={19} />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-lg bg-[#F3F4F6] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Question #{question.id}
                  </span>

                  <h2 className="mt-4 whitespace-pre-wrap break-words text-lg font-bold leading-8 text-[#111827] sm:text-xl">
                    {question.question}
                  </h2>

                  <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound size={14} />
                      <span className="font-semibold text-gray-700">
                        {question.user.name || question.user.email}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {formatDate(question.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Answers */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <MessageSquare size={21} />
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">
                      Answers
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      {question.answers.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Responses submitted for this customer question.
                  </p>
                </div>
              </div>

              <Link
                href={addAnswerUrl}
                className="inline-flex self-start items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#403948]"
              >
                <Plus size={15} />
                Add Answer
              </Link>
            </div>

            {question.answers.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
                  <MessageSquare size={29} />
                </span>

                <h3 className="mt-5 text-base font-bold text-gray-900">
                  No answers yet
                </h3>

                <p className="mt-2 max-w-sm text-[14px] leading-6 text-[#77808E]">
                  This customer question has not received an answer yet. Add the
                  first response to help the customer.
                </p>

                <Link
                  href={addAnswerUrl}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-[13px] font-medium text-white transition hover:bg-[#403948]"
                >
                  <Plus size={17} />
                  Add First Answer
                </Link>
              </div>
            ) : (
              <div className="space-y-4 p-5 sm:p-6">
                {question.answers.map((answer) => {
                  const canManage =
                    vendorId !== null && answer.user.vendorId === vendorId;

                  return (
                    <article
                      key={answer.id}
                      className="rounded-2xl border border-[#EAE7EF] bg-[#FAFAFB] p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                          <UserRound size={18} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-bold text-gray-900">
                                {answer.user.name || answer.user.email}
                              </p>

                              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                <CalendarDays size={13} />
                                {formatDate(answer.createdAt)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {canManage && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-[10px] font-semibold text-[#278455]">
                                  <CheckCircle2 size={12} />
                                  Vendor Response
                                </span>
                              )}

                              <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Answer #{answer.id}
                              </span>
                            </div>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                            {answer.answer}
                          </p>

                          {canManage && (
                            <div className="mt-5 border-t border-gray-200 pt-4">
                              <Link
                                href={`/vendor/products/${productId}/questions/${question.id}/answers/${answer.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-[#8065B0]"
                              >
                                Edit Answer
                                <ArrowUpRight size={14} />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          {/* Question Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={20} />
              </span>

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Question Summary
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Customer Q&A overview
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#FAF8FD] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Question ID
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  #{question.id}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Status
                </p>

                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  {hasAnswers ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Answered
                    </>
                  ) : (
                    <>
                      <Clock3 size={16} className="text-amber-600" />
                      Awaiting Answer
                    </>
                  )}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total Answers
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {question.answers.length}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Vendor Responses
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {vendorAnswers}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Date Submitted
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDate(question.createdAt)}
                </p>
              </div>
            </div>
          </section>

          {/* Help */}
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
                  Provide clear and accurate answers to customer questions. You
                  can edit responses associated with your vendor account.
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
