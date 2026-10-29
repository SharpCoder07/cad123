"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircleQuestion,
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import DeleteQuestionButton from "@/components/admin/DeleteQuestionButton";

type Question = {
  id: number;
  question: string;
  answerCount: number;
  createdAt: string;
  user: { id: number; name: string | null; email: string };
  product: { id: number; name: string; slug: string };
};
type Props = { questions: Question[]; canAnswer: boolean; canDelete: boolean };
type SortOption = "newest" | "oldest" | "answers-high" | "answers-low";
type AnswerFilter = "all" | "answered" | "unanswered";

export default function QuestionCatalog({ questions, canAnswer, canDelete }: Props) {
  const [search, setSearch] = useState("");
  const [answerFilter, setAnswerFilter] = useState<AnswerFilter>("all");
  const [productId, setProductId] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const products = useMemo(() => {
    const map = new Map<number, string>();
    questions.forEach((question) => map.set(question.product.id, question.product.name));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((question) => {
      const searchable = [question.question, question.user.name, question.user.email, question.product.name]
        .filter(Boolean).join(" ").toLowerCase();
      return (!query || searchable.includes(query)) &&
        (answerFilter === "all" || (answerFilter === "answered" && question.answerCount > 0) || (answerFilter === "unanswered" && question.answerCount === 0)) &&
        (productId === "all" || String(question.product.id) === productId);
    }).sort((a, b) => {
      if (sort === "answers-high") return b.answerCount - a.answerCount;
      if (sort === "answers-low") return a.answerCount - b.answerCount;
      const difference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "oldest" ? -difference : difference;
    });
  }, [questions, search, answerFilter, productId, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const first = filteredQuestions.length ? (currentPage - 1) * pageSize + 1 : 0;
  const last = Math.min(currentPage * pageSize, filteredQuestions.length);
  const activeFilters = Number(answerFilter !== "all") + Number(productId !== "all") + Number(sort !== "newest");
  const hasFilters = Boolean(search.trim()) || activeFilters > 0;

  function resetFilters() {
    setSearch(""); setAnswerFilter("all"); setProductId("all"); setSort("newest"); setPage(1);
  }

  const selectClass = "h-10 min-w-0 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B6A3D8] focus:ring-2 focus:ring-[#F0EBFA]";

  return (
    <section className="min-w-0 overflow-hidden rounded-[21px] border border-[#EAE7EF] bg-white shadow-[0_8px_28px_rgba(43,32,60,0.035)]">
      <div className="px-5 pb-5 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <MessageCircleQuestion size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#1F2430]">Question Library</h2>
              <p className="mt-0.5 text-[13px] text-[#77808E]">Search and manage product questions and answers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F0EBFA] px-3 py-1.5 text-[12px] font-medium text-[#8065B0]">
              {filteredQuestions.length} of {questions.length} questions
            </span>
            <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
              <SlidersHorizontal size={16} /> Filters
              {activeFilters > 0 && <span className="rounded-full bg-[#F0EBFA] px-1.5 py-0.5 text-[11px] text-[#8065B0]">{activeFilters}</span>}
            </button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A95A3]" />
          <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by user, product or question..."
            className="h-10 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-10 pr-10 text-[13px] text-[#1F2430] outline-none placeholder:text-[#A39CAB] focus:border-[#B6A3D8] focus:ring-2 focus:ring-[#F0EBFA]" />
          {search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9A95A3] hover:text-[#44414C]"><X size={16} /></button>}
        </div>
        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-xl border border-[#EEEAF2] bg-[#FBFAFD] p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_auto]">
            <select aria-label="Filter by answer status" value={answerFilter} onChange={(event) => { setAnswerFilter(event.target.value as AnswerFilter); setPage(1); }} className={selectClass}>
              <option value="all">All questions</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
            </select>
            <select aria-label="Filter by product" value={productId} onChange={(event) => { setProductId(event.target.value); setPage(1); }} className={selectClass}>
              <option value="all">All products</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select aria-label="Sort questions" value={sort} onChange={(event) => { setSort(event.target.value as SortOption); setPage(1); }} className={selectClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="answers-high">Most answers</option>
              <option value="answers-low">Fewest answers</option>
            </select>
            <button type="button" disabled={!hasFilters} onClick={resetFilters}
              className="h-10 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50">Reset</button>
          </div>
        )}
      </div>

      {filteredQuestions.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[990px] border-collapse text-left">
              <thead className="border-y border-[#EEEAF2] bg-[#FAF9FC]">
                <tr>
                  <Heading>User</Heading><Heading>Product</Heading><Heading>Question</Heading><Heading>Answers</Heading><Heading>Date</Heading>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9891A3]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAF2]">
                {visibleQuestions.map((question) => (
                  <tr key={question.id} className="transition hover:bg-[#FBFAFD]">
                    <td className="px-5 py-3.5"><QuestionUser question={question} /></td>
                    <td className="px-5 py-3.5"><span className="block max-w-[170px] truncate text-[13px] font-medium text-[#44414C]" title={question.product.name}>{question.product.name}</span></td>
                    <td className="px-5 py-3.5"><div className="max-w-[260px]">
                      <p className="line-clamp-2 text-[13px] leading-5 text-[#44414C]">{question.question}</p>
                    </div></td>
                    <td className="px-5 py-3.5"><AnswerBadge count={question.answerCount} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-[#77808E]">{formatDate(question.createdAt)}</td>
                    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/questions/${question.id}`}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
                        {canAnswer ? "Manage" : "View"} <ArrowUpRight size={14} />
                      </Link>
                      {canDelete && <DeleteQuestionButton questionId={question.id} />}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[#EEEAF2] border-t border-[#EEEAF2] md:hidden">
            {visibleQuestions.map((question) => (
              <div key={question.id} className="p-5">
                <div className="flex items-start justify-between gap-3"><QuestionUser question={question} /><AnswerBadge count={question.answerCount} /></div>
                <div className="mt-3 rounded-xl border border-[#EEEAF2] bg-[#FBFAFD] p-3">
                  <p className="text-[13px] leading-5 text-[#44414C]">{question.question}</p>
                </div>
                <p className="mt-3 truncate text-[13px] font-medium text-[#44414C]">{question.product.name}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[#9A95A3]">{formatDate(question.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/questions/${question.id}`}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] hover:bg-[#F8F6FA]">{canAnswer ? "Manage" : "View"} <ArrowUpRight size={14} /></Link>
                    {canDelete && <DeleteQuestionButton questionId={question.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#EEEAF2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#77808E]">
              <span>Showing <strong className="text-[#292633]">{first}–{last}</strong> of <strong className="text-[#292633]">{filteredQuestions.length}</strong> questions</span>
              <select aria-label="Questions per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                className="h-9 cursor-pointer rounded-lg border border-[#E5E2EA] bg-white px-2 text-[12px] text-[#44414C]">
                {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#44414C]">
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="min-w-16 text-center">{currentPage} / {totalPages}</span>
              <button type="button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] bg-white hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            {questions.length ? <Search size={22} /> : <MessageCircleQuestion size={22} />}
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-[#292633]">{questions.length ? "No matching questions" : "No questions yet"}</h3>
          <p className="mt-1 max-w-sm text-[13px] text-[#77808E]">{questions.length ? "Try adjusting your search or filters." : "Product questions submitted by users will appear here."}</p>
          {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 h-9 cursor-pointer rounded-xl bg-[#25232C] px-4 text-[12px] font-medium text-white hover:bg-[#403948]">Clear filters</button>}
        </div>
      )}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9891A3]">{children}</th>;
}
function QuestionUser({ question }: { question: Question }) {
  const initial = (question.user.name || question.user.email || "U").charAt(0).toUpperCase();
  return <div className="flex min-w-0 items-center gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[14px] font-semibold text-[#8065B0]">{initial}</span>
    <div className="min-w-0"><p className="max-w-[180px] truncate text-[13px] font-semibold text-[#292633]">{question.user.name || "Unknown"}</p>
      <p className="mt-0.5 max-w-[180px] truncate text-[12px] text-[#9A95A3]" title={question.user.email}>{question.user.email}</p></div>
  </div>;
}
function AnswerBadge({ count }: { count: number }) {
  const answered = count > 0;
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium ${answered ? "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]" : "border-[#F1DFC1] bg-[#FFF8EA] text-[#A16C19]"}`}>
    <MessageSquare size={13} /> {count} {count === 1 ? "answer" : "answers"}
  </span>;
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN");
}
