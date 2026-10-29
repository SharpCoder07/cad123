"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  CircleHelp,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";

type User = {
  id: number;
  name: string | null;
  email: string;
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

type Props = {
  productId: number;
  questionId: number;
  canAnswer: boolean;
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]";

function displayName(user: User) {
  return user.name?.trim() || user.email;
}

function UserAvatar({ user }: { user: User }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-semibold text-[#8065B0]">
      {(displayName(user).charAt(0) || "U").toUpperCase()}
    </span>
  );
}

export default function ProductQuestionDetails({
  productId,
  questionId,
  canAnswer,
}: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const questionsUrl = `/admin/products/${productId}/questions`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestion() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/products/${productId}/questions/${questionId}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok || !data.success || !data.question) {
          if (!controller.signal.aborted) {
            toast.error(data.message || "Failed to load question.");
          }
          return;
        }
        if (!controller.signal.aborted) setQuestion(data.question);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Load question details error:", error);
        toast.error("Something went wrong.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadQuestion();
    return () => controller.abort();
  }, [productId, questionId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#77808E]">
        <Loader2 size={19} className="animate-spin text-[#8065B0]" />
        Loading question...
      </div>
    );
  }

  if (!question) {
    return (
      <div
        className={`${cardClass} flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
          <CircleHelp size={23} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#1F2430]">
            Question could not be loaded
          </h2>
          <p className="mt-1 text-sm text-[#77808E]">
            Please return to the Questions page and try again.
          </p>
        </div>
        <Link
          href={questionsUrl}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to Questions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9A95A3]"
          >
            <Link
              href={questionsUrl}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Questions
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#44414C]">Question Details</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
              <MessageSquareText size={21} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Question Details
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                View the question and all submitted answers.
              </p>
            </div>
          </div>
        </div>
        <Link
          href={questionsUrl}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to Questions
        </Link>
      </section>

      <div className="max-w-5xl space-y-5">
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3 border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <CircleHelp size={18} />
              </span>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Customer Question
              </h2>
            </div>
            <span className="rounded-full border border-[#E5DDF1] bg-[#F0EBFA] px-2.5 py-1 text-[11px] font-semibold text-[#8065B0]">
              #{question.id}
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-7 text-[#24212D]">
              {question.question}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF3] pt-4">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar user={question.user} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#24212D]">
                    {displayName(question.user)}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    Asked by{" "}
                    <span className="font-medium text-gray-700">
                      {question.user.name || question.user.email}
                    </span>{" "}
                    on {new Date(question.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <MessageSquareText size={18} />
              </span>
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Answers
              </h2>
              <span className="rounded-full border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-0.5 text-[11px] font-medium text-[#77717F]">
                {question.answers.length}
              </span>
            </div>
            {canAnswer && (
              <Link
                href={`/admin/products/${productId}/questions/${question.id}/answers/new`}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
              >
                <Plus size={16} /> Add Answer
              </Link>
            )}
          </div>

          {question.answers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
                <MessageSquareText size={23} />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold text-[#1F2430]">
                No answers yet
              </h3>
              <p className="mt-1 max-w-sm text-[13px] leading-6 text-[#77808E]">
                No answers have been submitted for this question.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EDF3]">
              {question.answers.map((answer) => (
                <article key={answer.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={answer.user} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#24212D]">
                          {displayName(answer.user)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Answered by{" "}
                          <span className="font-medium text-gray-700">
                            {answer.user.name || answer.user.email}
                          </span>{" "}
                          on {new Date(answer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-[#EAE7EF] bg-[#FBFAFD] p-4 text-[13px] leading-7 text-[#44414C]">
                    {answer.answer}
                  </p>
                  {canAnswer && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/admin/products/${productId}/questions/${question.id}/answers/${answer.id}/edit`}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
                      >
                        <Pencil size={14} /> Edit Answer
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
