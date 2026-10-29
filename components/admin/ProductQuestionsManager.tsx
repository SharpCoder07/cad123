"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Loader2,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
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
  user: User | null;
};

type Question = {
  id: number;
  question: string;
  createdAt: string;
  user: User | null;
  answers: Answer[];
};

type DeleteTarget =
  | { type: "question"; questionId: number }
  | {
      type: "answer";
      questionId: number;
      answerId: number;
    }
  | null;

type QuestionFilter = "all" | "answered" | "unanswered";

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]";

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getUserName(user: User | null | undefined) {
  return user?.name?.trim() || user?.email || "Unknown user";
}

type Props = {
  productId: number;
  canAnswer: boolean;
  canDelete: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
};

export default function ProductQuestionsManager({
  productId,
  canAnswer,
  canDelete,
  canViewProducts,
  canEditProducts,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("all");

  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadQuestions = useCallback(
    async (signal?: AbortSignal, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setLoadError("");

        const response = await fetch(
          `/api/admin/products/${productId}/questions`,
          {
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load product questions.");
        }

        if (signal?.aborted) return;

        const loadedQuestions: Question[] = Array.isArray(data.questions)
          ? data.questions.map((question: Question) => ({
              ...question,
              answers: Array.isArray(question.answers) ? question.answers : [],
            }))
          : [];

        setQuestions(loadedQuestions);
      } catch (error) {
        if (signal?.aborted) return;

        console.error("Load product questions error:", error);

        const message =
          error instanceof Error ? error.message : "Something went wrong.";

        setLoadError(message);

        if (isRefresh) {
          toast.error(message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();

    void loadQuestions(controller.signal);

    return () => controller.abort();
  }, [productId, loadQuestions]);

  const statistics = useMemo(() => {
    const total = questions.length;

    const answered = questions.filter(
      (question) => question.answers.length > 0,
    ).length;

    const totalAnswers = questions.reduce(
      (sum, question) => sum + question.answers.length,
      0,
    );

    return {
      total,
      answered,
      unanswered: total - answered,
      totalAnswers,
      coverage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((question) => {
      const isAnswered = question.answers.length > 0;

      if (filter === "answered" && !isAnswered) {
        return false;
      }

      if (filter === "unanswered" && isAnswered) {
        return false;
      }

      if (!query) return true;

      const searchableText = [
        question.question,
        getUserName(question.user),
        question.user?.email || "",
        ...question.answers.flatMap((answer) => [
          answer.answer,
          getUserName(answer.user),
          answer.user?.email || "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [questions, search, filter]);

  const questionTarget =
    deleteTarget?.type === "question"
      ? questions.find((question) => question.id === deleteTarget.questionId)
      : null;

  const answerTarget =
    deleteTarget?.type === "answer"
      ? questions
          .find((question) => question.id === deleteTarget.questionId)
          ?.answers.find((answer) => answer.id === deleteTarget.answerId)
      : null;

  function toggleQuestion(questionId: number) {
    setExpandedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  }

  async function handleDelete() {
    if (!canDelete || !deleteTarget || deleting) return;

    const target = deleteTarget;

    const endpoint =
      target.type === "question"
        ? `/api/admin/products/${productId}/questions/${target.questionId}`
        : `/api/admin/products/${productId}/questions/${target.questionId}/answers/${target.answerId}`;

    try {
      setDeleting(true);

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || `Failed to delete ${target.type}.`);
        return;
      }

      if (target.type === "question") {
        setQuestions((current) =>
          current.filter((question) => question.id !== target.questionId),
        );
      } else {
        setQuestions((current) =>
          current.map((question) =>
            question.id === target.questionId
              ? {
                  ...question,
                  answers: question.answers.filter(
                    (answer) => answer.id !== target.answerId,
                  ),
                }
              : question,
          ),
        );
      }

      toast.success(
        target.type === "question"
          ? "Question deleted successfully."
          : "Answer deleted successfully.",
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete Q&A error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!deleteTarget) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        setDeleteTarget(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [deleteTarget, deleting]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
      {/* Header */}
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

            {canEditProducts ? (
              <Link
                href={`/admin/products/${productId}/edit`}
                className="cursor-pointer transition hover:text-gray-900"
              >
                Edit Product
              </Link>
            ) : (
              <span>Product #{productId}</span>
            )}

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Questions</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
              <MessageCircleQuestion size={22} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Questions
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Review customer questions and manage their answers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadQuestions(undefined, true)}
            disabled={loading || refreshing}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {canEditProducts && (
            <Link
              href={`/admin/questions`}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
            >
              <ArrowLeft size={16} />
              Back to Questions
            </Link>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<MessageCircleQuestion size={19} />}
          label="Total Questions"
          value={statistics.total}
          description="Customer questions"
          loading={loading}
          variant="lavender"
        />

        <StatCard
          icon={<MessageSquare size={19} />}
          label="Total Answers"
          value={statistics.totalAnswers}
          description="Responses submitted"
          loading={loading}
          variant="green"
        />

        <StatCard
          icon={<Clock3 size={19} />}
          label="Unanswered"
          value={statistics.unanswered}
          description="Questions awaiting answers"
          loading={loading}
          variant="amber"
        />

        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Response Coverage"
          value={`${statistics.coverage}%`}
          description={`${statistics.answered} questions answered`}
          loading={loading}
          variant="blue"
        />
      </section>

      {/* Q&A Workspace */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]"><MessageSquare size={19} /></div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1F2430]">Customer Q&A</h2>
                  <p className="mt-0.5 text-[12px] text-[#77808E]">Search, review, and manage product questions and answers.</p>
                </div>
              </div>


            </div>

            <span className="w-fit rounded-full border border-[#E5DDF1] bg-[#F0EBFA] px-3 py-1.5 text-xs font-semibold text-[#8065B0]">
              {filteredQuestions.length} results
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions, answers, or users..."
                className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-4 text-sm text-[#1F2430] outline-none transition placeholder:text-[#9A95A3] focus:border-[#AA94D0] focus:ring-4 focus:ring-[#F0EBFA]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "All", count: statistics.total },
                  {
                    value: "answered",
                    label: "Answered",
                    count: statistics.answered,
                  },
                  {
                    value: "unanswered",
                    label: "Unanswered",
                    count: statistics.unanswered,
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition ${
                    filter === option.value
                      ? "border-[#25232C] bg-[#25232C] text-white"
                      : "border-[#E5E2EA] bg-white text-[#77717F] hover:bg-[#F8F6FA]"
                  }`}
                >
                  {option.label}

                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      filter === option.value
                        ? "bg-white/15 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-gray-200 p-5"
              >
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
                <div className="mt-6 h-20 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
              Unable to load questions
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void loadQuestions()}
              className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              {questions.length === 0 ? (
                <CircleHelp size={25} />
              ) : (
                <Search size={25} />
              )}
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
              {questions.length === 0
                ? "No questions yet"
                : "No matching questions"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {questions.length === 0
                ? "Customer questions for this product will appear here."
                : "Try changing your search or selecting another filter."}
            </p>

            {questions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 cursor-pointer text-sm font-semibold text-gray-900 underline underline-offset-4"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQuestions.map((question) => {
              const isExpanded = expandedQuestions.includes(question.id);

              const isAnswered = question.answers.length > 0;

              return (
                <article key={question.id} className="p-5 sm:p-6">
                  {/* Question */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                        <MessageCircleQuestion size={19} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-[#E5DDF1] bg-[#F0EBFA] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8065B0]">
                            Question #{question.id}
                          </span>

                          {isAnswered ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-[10px] font-semibold text-[#278455]">
                              <CheckCircle2 size={12} />
                              Answered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#F1DFC1] bg-[#FFF8EA] px-2.5 py-1.5 text-[10px] font-semibold text-[#B77930]">
                              <Clock3 size={12} />
                              Awaiting Answer
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 break-words text-base font-bold leading-7 text-gray-950">
                          {question.question}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                          <UserRound size={13} />

                          <span className="font-medium text-gray-700">
                            {getUserName(question.user)}
                          </span>

                          <span>•</span>

                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "question",
                            questionId: question.id,
                          })
                        }
                        className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FFD9DC] bg-[#FFF4F4] px-3 text-xs font-semibold text-[#E5484D] transition hover:bg-[#FFE9EA]"
                      >
                        <Trash2 size={14} />
                        Delete Question
                      </button>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="mt-5 border-t border-gray-100 pt-5 lg:ml-14">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleQuestion(question.id)}
                        aria-expanded={isExpanded}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-900"
                      >
                        <MessageSquare size={17} className="text-gray-500" />
                        Answers ({question.answers.length})
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {canAnswer && (
                        <Link
                          href={`/admin/products/${productId}/questions/${question.id}/answers/new`}
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#25232C] px-3 text-xs font-semibold text-white transition hover:bg-[#403948]"
                        >
                          <Plus size={14} />
                          Add Answer
                        </Link>
                      )}
                    </div>

                    {!isAnswered && (
                      <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                        <p className="text-sm font-medium text-gray-700">
                          This question has no answers yet.
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Add an answer to respond to the customer.
                        </p>
                      </div>
                    )}

                    {isExpanded && isAnswered && (
                      <div className="mt-4 space-y-3">
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="rounded-2xl border border-[#EAE7EF] bg-[#FBFAFD] p-4 sm:p-5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600">
                                <UserRound size={16} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">
                                      {getUserName(answer.user)}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-400">
                                      {formatDate(answer.createdAt)}
                                    </p>
                                  </div>

                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Answer #{answer.id}
                                  </span>
                                </div>

                                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                                  {answer.answer}
                                </p>

                                {(canAnswer || canDelete) && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {canAnswer && (
                                      <Link
                                        href={`/admin/products/${productId}/questions/${question.id}/answers/${answer.id}/edit`}
                                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-xs font-semibold text-[#44414C] transition hover:bg-[#F8F6FA]"
                                      >
                                        Edit Answer
                                        <ArrowUpRight size={14} />
                                      </Link>
                                    )}

                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: "answer",
                                            questionId: question.id,
                                            answerId: answer.id,
                                          })
                                        }
                                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#FFD9DC] bg-[#FFF4F4] px-3 text-xs font-semibold text-[#E5484D] transition hover:bg-[#FFE9EA]"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5">
                      <Link
                        href={`/admin/products/${productId}/questions/${question.id}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-gray-950"
                      >
                        View Question Details
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      {canDelete &&
        mounted &&
        deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deleting) {
                setDeleteTarget(null);
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              aria-describedby="delete-description"
              className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2 size={22} />
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  aria-label="Close dialog"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>

              <h2
                id="delete-title"
                className="mt-5 text-lg font-bold text-gray-950"
              >
                Delete {deleteTarget.type}?
              </h2>

              <p
                id="delete-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                {deleteTarget.type === "question"
                  ? "This will permanently delete the question and all its answers. This action cannot be undone."
                  : "This will permanently delete this answer. This action cannot be undone."}
              </p>

              {(questionTarget || answerTarget) && (
                <div className="mt-5 max-h-40 overflow-y-auto rounded-xl bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {questionTarget?.question || answerTarget?.answer}
                  </p>

                  {questionTarget && (
                    <p className="mt-2 text-xs text-gray-400">
                      {questionTarget.answers.length} associated answer(s) will
                      also be removed.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete{" "}
                      {deleteTarget.type === "question" ? "Question" : "Answer"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  loading,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  description: string;
  loading: boolean;
  variant: "lavender" | "green" | "amber" | "blue";
}) {
  const colors = {
    lavender: "from-[#F2ECFC] via-[#F6F1FD] to-[#FBF8FF] border-[#E9DDF9] text-[#8464B5]",
    green: "from-[#E9F7F0] via-[#F0FBF5] to-[#F9FEFB] border-[#D9EFE2] text-[#38936A]",
    amber: "from-[#FFF2E6] via-[#FFF7EF] to-[#FFFCF8] border-[#F5E3D0] text-[#D18A43]",
    blue: "from-[#EAF3FF] via-[#F1F7FF] to-[#FAFCFF] border-[#DAE8FA] text-[#5A8AC6]",
  };
  const iconBg = {
    lavender: "bg-[#E7D9F7]",
    green: "bg-[#D7F0E1]",
    amber: "bg-[#FFE7CD]",
    blue: "bg-[#DAE9FC]",
  };
  return (
    <div className={`min-h-[146px] rounded-[21px] border bg-gradient-to-br p-5 shadow-[0_6px_20px_rgba(39,28,59,0.035)] ${colors[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13px] font-medium text-[#6F6A78]">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${iconBg[variant]}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-white/60" />
      ) : (
        <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#24212D]">{value}</p>
      )}
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  );
}
