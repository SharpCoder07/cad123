"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import DeleteContactMessageButton from "@/components/admin/DeleteContactMessageButton";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string | null;
  createdAt: string;
};

type Props = {
  messages: ContactMessage[];
  canDelete: boolean;
};

type DateFilter = "all" | "today" | "7days" | "30days";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

export default function ContactMessageCatalog({ messages, canDelete }: Props) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [sort, setSort] = useState<SortOption>("newest");

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    const now = new Date();

    const result = messages.filter((message) => {
      const matchesSearch =
        !query ||
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.message?.toLowerCase().includes(query);

      const createdAt = new Date(message.createdAt);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          createdAt.getFullYear() === now.getFullYear() &&
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getDate() === now.getDate();
      }

      if (dateFilter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        matchesDate = createdAt >= sevenDaysAgo;
      }

      if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        matchesDate = createdAt >= thirtyDaysAgo;
      }

      return matchesSearch && matchesDate;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "name-asc":
          return a.name.localeCompare(b.name);

        case "name-desc":
          return b.name.localeCompare(a.name);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [messages, search, dateFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMessages = filteredMessages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasFilters =
    search.trim() !== "" || dateFilter !== "all" || sort !== "newest";

  function resetFilters() {
    setSearch("");
    setDateFilter("all");
    setSort("newest");
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
      {/* Catalog header */}
      <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1F2430]">
                Message Inbox
              </h2>
              <p className="mt-0.5 text-[13px] text-[#77808E]">
                Search and review messages received from visitors and customers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E5DDF1] bg-[#F5F1FB] px-3 py-1.5 text-xs font-medium text-[#8065B0]">
              {filteredMessages.length} of {messages.length}{" "}
              {messages.length === 1 ? "message" : "messages"}
            </span>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-[13px] font-medium transition ${showFilters ? "border-[#D9CBEF] bg-[#F0EBFA] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>
        <div className="relative mt-5">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A95A3]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sender, email or message..."
            className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-10 text-sm text-[#24212D] outline-none transition placeholder:text-[#9A95A3] focus:border-[#AA94D0] focus:ring-4 focus:ring-[#F0EBFA]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9A95A3] hover:text-[#24212D]"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EAE7EF] bg-[#FBFAFD] p-4">
            <select
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }
              className="h-10 min-w-[160px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
            <select
              aria-label="Sort messages"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-10 min-w-[160px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA]"
              >
                <X size={15} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {filteredMessages.length > 0 ? (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#EAE7EF] bg-[#F8F6FB]">
                  <TableHeading>Sender</TableHeading>

                  <TableHeading>Message</TableHeading>

                  <TableHeading>Received</TableHeading>

                  {canDelete && (
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EDF3]">
                {pagedMessages.map((message) => (
                  <tr
                    key={message.id}
                    className="group transition hover:bg-[#FBFAFD]"
                  >
                    <td className="px-5 py-4">
                      <Sender message={message} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="max-w-[500px]">
                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                          {message.message || "No message provided."}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <ReceivedDate date={message.createdAt} />
                    </td>

                    {canDelete && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <DeleteContactMessageButton messageId={message.id} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-[#F0EDF3] md:hidden">
            {pagedMessages.map((message) => (
              <div key={message.id} className="p-5">
                <Sender message={message} />

                <div className="mt-4 rounded-xl bg-[#F8F6FB] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Message
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {message.message || "No message provided."}
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Received
                    </p>

                    <div className="mt-1">
                      <ReceivedDate date={message.createdAt} />
                    </div>
                  </div>

                  {canDelete && (
                    <DeleteContactMessageButton messageId={message.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF3] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 text-xs text-[#77808E]">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredMessages.length)} of{" "}
                {filteredMessages.length}
              </span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-[#E5E2EA] bg-white px-2 text-xs text-[#44414C]"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs text-[#77808E]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          messagesExist={messages.length > 0}
          hasFilters={hasFilters}
          onReset={resetFilters}
        />
      )}
    </section>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
      {children}
    </th>
  );
}

function Sender({ message }: { message: ContactMessage }) {
  const initial = message.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-xs font-bold text-[#8065B0]">
        {initial}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#24212D]">
          {message.name}
        </p>

        <p className="mt-1 max-w-[260px] truncate text-xs text-[#85808D]">
          {message.email}
        </p>
      </div>
    </div>
  );
}

function ReceivedDate({ date }: { date: string }) {
  const createdAt = new Date(date);

  return (
    <div>
      <p className="text-xs font-medium text-gray-600">
        {createdAt.toLocaleDateString("en-IN")}
      </p>
    </div>
  );
}

function EmptyState({
  messagesExist,
  hasFilters,
  onReset,
}: {
  messagesExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
        {messagesExist ? <Search size={23} /> : <Mail size={24} />}
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {messagesExist ? "No matching messages" : "No contact messages yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {messagesExist
          ? "Try changing your search, date filter or sorting options."
          : "Messages submitted through the website contact form will appear here."}
      </p>

      {messagesExist && hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#403948]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
