"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  MessageCircleQuestion,
  MessageSquare,
  Search,
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
  productId: number;

  product: {
    id: number;
    name: string;
    slug: string;
  };

  user: User;
  answers: Answer[];
};

type Filter = "ALL" | "ANSWERED" | "UNANSWERED";

export default function VendorQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/vendor/questions",
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load questions.",
          );
          return;
        }

        setQuestions(data.questions || []);
      } catch (error) {
        console.error(
          "Load vendor questions error:",
          error,
        );

        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const answeredCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.answers.length > 0,
      ).length,
    [questions],
  );

  const unansweredCount =
    questions.length - answeredCount;

  const totalAnswers = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total + question.answers.length,
        0,
      ),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return questions.filter((question) => {
      const isAnswered =
        question.answers.length > 0;

      if (
        filter === "ANSWERED" &&
        !isAnswered
      ) {
        return false;
      }

      if (
        filter === "UNANSWERED" &&
        isAnswered
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const customer =
        question.user.name ||
        question.user.email;

      return [
        question.question,
        question.product.name,
        customer,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [questions, search, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">
          Questions
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review and respond to customer
          questions across all of your products.
        </p>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Questions"
          value={questions.length}
          description="Across your products"
          icon={<MessageCircleQuestion size={18} />}
        />

        <SummaryCard
          label="Answered"
          value={answeredCount}
          description="Questions with responses"
          icon={<CheckCircle2 size={18} />}
        />

        <SummaryCard
          label="Needs Answer"
          value={unansweredCount}
          description="Waiting for a response"
          icon={<CircleHelp size={18} />}
        />

        <SummaryCard
          label="Total Answers"
          value={totalAnswers}
          description="Responses submitted"
          icon={<MessageSquare size={18} />}
        />
      </section>

      {/* Workspace */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-950">
                Customer Q&A
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredQuestions.length}{" "}
                {filteredQuestions.length === 1
                  ? "question"
                  : "questions"}{" "}
                shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search questions..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100 sm:w-64"
                />
              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as Filter,
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
              >
                <option value="ALL">
                  All questions
                </option>

                <option value="UNANSWERED">
                  Needs answer
                </option>

                <option value="ANSWERED">
                  Answered
                </option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-gray-100"
                />
              ),
            )}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <MessageCircleQuestion
                size={24}
              />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              {questions.length === 0
                ? "No customer questions yet"
                : "No matching questions"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
              {questions.length === 0
                ? "Questions submitted for your products will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQuestions.map(
              (question) => {
                const answered =
                  question.answers.length > 0;

                return (
                  <article
                    key={question.id}
                    className="p-5 transition hover:bg-gray-50/60 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white">
                          <MessageCircleQuestion
                            size={18}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {answered ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                                <CheckCircle2
                                  size={11}
                                />
                                Answered
                              </span>
                            ) : (
                              <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                                Needs Answer
                              </span>
                            )}

                            <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-500">
                              {question.product.name}
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-semibold leading-6 text-gray-950">
                            {question.question}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                            <span>
                              Asked by{" "}
                              <span className="font-semibold text-gray-600">
                                {question.user.name ||
                                  question.user.email}
                              </span>
                            </span>

                            <span>•</span>

                            <span>
                              {new Date(
                                question.createdAt,
                              ).toLocaleDateString(
                                "en-IN",
                              )}
                            </span>

                            <span>•</span>

                            <span>
                              {
                                question.answers
                                  .length
                              }{" "}
                              {question.answers
                                .length === 1
                                ? "answer"
                                : "answers"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                        {!answered && (
                          <Link
                            href={`/vendor/products/${question.productId}/questions/${question.id}/answers/new`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-950 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                          >
                            <MessageSquare
                              size={14}
                            />
                            Answer
                          </Link>
                        )}

                        <Link
                          href={`/vendor/products/${question.productId}/questions/${question.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                        >
                          View
                          <ArrowUpRight
                            size={13}
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}