"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Pencil,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  LoaderCircle,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  Trash2,
  UserRound,
  X,
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

type DeleteTarget =
  | {
      type: "question";
      questionId: number;
    }
  | {
      type: "answer";
      questionId: number;
      answerId: number;
    }
  | null;

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(37,35,44,0.025)]";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProductQuestionsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!productId) return;

    async function loadQuestions() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/vendor/products/${productId}/questions`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to load product questions.");
          return;
        }

        setQuestions(data.questions || []);
        setVendorId(data.vendorId ?? null);
      } catch (error) {
        console.error("Load product questions error:", error);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    void loadQuestions();
  }, [productId]);

  async function handleDeleteQuestion(questionId: number) {
    try {
      setDeleting(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/questions/${questionId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete question.");
        return;
      }

      setQuestions((currentQuestions) =>
        currentQuestions.filter((question) => question.id !== questionId),
      );

      toast.success("Question deleted successfully.");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete question error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAnswer(questionId: number, answerId: number) {
    try {
      setDeleting(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/questions/${questionId}/answers/${answerId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete answer.");
        return;
      }

      setQuestions((currentQuestions) =>
        currentQuestions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                answers: question.answers.filter(
                  (answer) => answer.id !== answerId,
                ),
              }
            : question,
        ),
      );

      toast.success("Answer deleted successfully.");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete answer error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const answeredQuestions = questions.filter(
    (question) => question.answers.length > 0,
  ).length;

  const unansweredQuestions = questions.length - answeredQuestions;

  const totalAnswers = questions.reduce(
    (total, question) => total + question.answers.length,
    0,
  );

  const responseCoverage =
    questions.length > 0
      ? Math.round((answeredQuestions / questions.length) * 100)
      : 0;

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

  const filteredQuestions = questions
    .filter((question) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        question.question.toLowerCase().includes(query) ||
        question.user?.name?.toLowerCase().includes(query) ||
        question.user?.email?.toLowerCase().includes(query) ||
        question.answers.some((answer) =>
          answer.answer.toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "answered"
          ? question.answers.length > 0
          : question.answers.length === 0);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : sortBy === "mostAnswers"
          ? b.answers.length - a.answers.length
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || sortBy !== "newest";
  const activeFilterCount =
    Number(statusFilter !== "all") + Number(sortBy !== "newest");

  const stats = [
    {
      label: "Total Questions",
      value: questions.length.toString(),
      description: "Customer questions submitted",
      icon: MessageCircleQuestion,
    },
    {
      label: "Total Answers",
      value: totalAnswers.toString(),
      description: "Responses provided for this product",
      icon: MessageSquare,
    },
    {
      label: "Response Coverage",
      value: `${responseCoverage}%`,
      description: `${unansweredQuestions} ${
        unansweredQuestions === 1 ? "question needs" : "questions need"
      } an answer`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        <Link
          href="/vendor/products"
          className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>

        <ChevronRight size={13} />

        <Link
          href={`/vendor/products/${productId}/edit`}
          className="cursor-pointer hover:text-gray-900"
        >
          Edit Product
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">Questions</span>
      </div>

      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <MessageCircleQuestion size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Questions
              </h1>
              <span className="rounded-full border border-[#E5E2EA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#77717F]">
                #{productId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Review customer questions and manage their answers.
            </p>
          </div>
        </div>
        <Link
          href={`/vendor/products/${productId}/edit`}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Product
        </Link>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const theme = [
            "border-[#EAE2F4] bg-gradient-to-br from-[#F5F0FC] to-[#FFF0F7]",
            "border-[#DBEFE7] bg-gradient-to-br from-[#EFFBF5] to-[#E8F8F2]",
            "border-[#F4E6D8] bg-gradient-to-br from-[#FFF5E9] to-[#FFF0E7]",
          ][index];
          const iconTheme = [
            "bg-[#EAE0F8] text-[#8065B0]",
            "bg-[#DDF3E8] text-[#3C9770]",
            "bg-[#FFE7D5] text-[#C78A5B]",
          ][index];
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border p-5 ${theme}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#77717F]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTheme}`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight text-[#1F2430]">
                {loading ? "—" : stat.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#77808E]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Q&A Workspace */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F0EBFA] text-[#8065B0]">
                <MessageSquare size={20} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-[#1F2430]">
                  Customer Q&A
                </h2>
                <p className="mt-0.5 text-xs text-[#77808E]">
                  Review questions, respond to customers, and maintain answers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#EAE7EF] bg-[#F8F7FA] px-3 py-1.5 text-xs font-medium text-[#77717F]">
                {filteredQuestions.length} entries
              </span>
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${showFilters || activeFilterCount ? "border-[#D8C8EE] bg-[#F4EEFC] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#55515D] hover:bg-[#F8F6FA]"}`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#E7DCF6] px-1.5 py-0.5 text-[10px]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9993A3]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions, customers, or answers..."
                className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFD] pl-10 pr-4 text-[13px] text-[#292631] outline-none transition placeholder:text-[#A29BAA] focus:border-[#B99CE0] focus:ring-2 focus:ring-[#F0EBFA]"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSortBy("newest");
                }}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3 text-xs font-medium text-[#66606D] hover:bg-[#F8F6FA]"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
          {showFilters && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                aria-label="Filter question status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B99CE0]"
              >
                <option value="all">All statuses</option>
                <option value="answered">Answered</option>
                <option value="unanswered">Awaiting answer</option>
              </select>
              <select
                aria-label="Sort questions"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B99CE0]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="mostAnswers">Most answers</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 p-5"
              >
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-5 h-20 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F4F6] text-gray-400">
              <CircleHelp size={29} />
            </span>

            <h3 className="mt-5 text-base font-bold text-gray-900">
              {questions.length === 0
                ? "No questions yet"
                : "No matching questions"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {questions.length === 0
                ? "Questions submitted by customers for this product will appear here."
                : "Try adjusting your search or filters to see more results."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQuestions.map((question) => {
              const isAnswered = question.answers.length > 0;

              return (
                <article key={question.id} className="p-5 sm:p-6">
                  {/* Question */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                        <MessageCircleQuestion size={19} />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-[#F3F4F6] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Question #{question.id}
                          </span>

                          {isAnswered ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 size={12} />
                              Answered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700">
                              <Clock3 size={12} />
                              Awaiting Answer
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 whitespace-pre-wrap text-base font-bold leading-7 text-[#111827] sm:text-lg">
                          {question.question}
                        </h3>

                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                          <UserRound size={13} />

                          <span>
                            Asked by{" "}
                            <span className="font-semibold text-gray-700">
                              {question.user.name || question.user.email}
                            </span>
                          </span>

                          <span>•</span>

                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "question",
                          questionId: question.id,
                        })
                      }
                      disabled={deleting}
                      aria-label="Delete question"
                      title="Delete question"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center self-start rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE5E8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Answers */}
                  <div className="mt-6 border-t border-gray-100 pt-5 lg:ml-14">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={17} className="text-gray-500" />

                          <h4 className="text-sm font-bold text-gray-900">
                            Answers ({question.answers.length})
                          </h4>
                        </div>

                        <p className="mt-1 text-xs text-gray-400">
                          Responses provided to this customer question.
                        </p>
                      </div>

                      <Link
                        href={`/vendor/products/${productId}/questions/${question.id}/answers/new`}
                        className="inline-flex cursor-pointer self-start items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#403948]"
                      >
                        <Plus size={15} />
                        Add Answer
                      </Link>
                    </div>

                    {question.answers.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFB] px-5 py-7 text-center">
                        <MessageSquare
                          size={23}
                          className="mx-auto text-gray-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-gray-600">
                          No answer has been added yet.
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Add an answer to respond to the customer.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {question.answers.map((answer) => {
                          const isVendorAnswer =
                            vendorId !== null &&
                            answer.user.vendorId === vendorId;

                          return (
                            <div
                              key={answer.id}
                              className="rounded-2xl border border-[#E8EAED] bg-[#FAFAFB] p-4 sm:p-5"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                                  <UserRound size={18} />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-gray-800">
                                        {answer.user.name || answer.user.email}
                                      </p>

                                      <p className="mt-1 text-[11px] text-gray-400">
                                        {formatDate(answer.createdAt)}
                                      </p>
                                    </div>

                                    <span className="self-start rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                      Answer #{answer.id}
                                    </span>
                                  </div>

                                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                                    {answer.answer}
                                  </p>

                                  {isVendorAnswer && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                                      <Link
                                        href={`/vendor/products/${productId}/questions/${question.id}/answers/${answer.id}/edit`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-[#8065B0]"
                                      >
                                        Edit Answer
                                        <ArrowUpRight size={14} />
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: "answer",
                                            questionId: question.id,
                                            answerId: answer.id,
                                          })
                                        }
                                        disabled={deleting}
                                        aria-label="Delete answer"
                                        title="Delete answer"
                                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE5E8] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Details Link */}
                  <div className="mt-5 border-t border-gray-100 pt-4 lg:ml-14">
                    <Link
                      href={`/vendor/products/${productId}/questions/${question.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#8065B0]"
                    >
                      View Question Details
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-target-title"
            className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </span>

              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Close confirmation dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="delete-target-title"
              className="mt-5 text-lg font-bold text-gray-950"
            >
              {deleteTarget.type === "question"
                ? "Delete question?"
                : "Delete answer?"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {deleteTarget.type === "question"
                ? "This will permanently delete the question and all of its answers. This action cannot be undone."
                : "This will permanently delete this answer. This action cannot be undone."}
            </p>

            {questionTarget && deleteTarget.type === "question" && (
              <div className="mt-5 rounded-xl bg-[#F8F9FA] p-4">
                <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-800">
                  {questionTarget.question}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  {questionTarget.answers.length}{" "}
                  {questionTarget.answers.length === 1 ? "answer" : "answers"}{" "}
                  will also be removed.
                </p>
              </div>
            )}

            {answerTarget && deleteTarget.type === "answer" && (
              <div className="mt-5 rounded-xl bg-[#F8F9FA] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {answerTarget.answer}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (deleteTarget.type === "question") {
                    void handleDeleteQuestion(deleteTarget.questionId);
                    return;
                  }

                  void handleDeleteAnswer(
                    deleteTarget.questionId,
                    deleteTarget.answerId,
                  );
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C94755] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {deleteTarget.type === "question"
                      ? "Delete Question"
                      : "Delete Answer"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage customer questions. Grow your business.</p>
      </footer>
    </div>
  );
}
