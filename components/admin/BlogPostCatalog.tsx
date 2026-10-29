"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  BookOpen,
  CheckCircle2,
  FileEdit,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import DeleteBlogPostButton from "@/components/admin/DeleteBlogPostButton";

type BlogAuthor = {
  id: number;
  name: string | null;
  email: string;
};

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  author: BlogAuthor | null;
};

type Props = {
  posts: BlogPost[];
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canCreate?: boolean;
};

type StatusFilter = "all" | "published" | "draft";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export default function BlogPostCatalog({
  posts,
  canEdit,
  canDelete,
  canPublish,
  canCreate = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [authorFilter, setAuthorFilter] = useState("all");

  const [sort, setSort] = useState<SortOption>("newest");

  const authors = useMemo(() => {
    const map = new Map<number, BlogAuthor>();

    posts.forEach((post) => {
      if (post.author) {
        map.set(post.author.id, post.author);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aName = a.name || a.email;

      const bName = b.name || b.email;

      return aName.localeCompare(bName);
    });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = posts.filter((post) => {
      const authorName = post.author?.name || "";

      const authorEmail = post.author?.email || "";

      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        authorName.toLowerCase().includes(query) ||
        authorEmail.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "draft" && !post.published);

      const matchesAuthor =
        authorFilter === "all" || String(post.author?.id) === authorFilter;

      return matchesSearch && matchesStatus && matchesAuthor;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [posts, search, statusFilter, authorFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, authorFilter, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    authorFilter !== "all" ||
    sort !== "newest";

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setAuthorFilter("all");
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
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1F2430]">
                Blog Library
              </h2>
              <p className="mt-0.5 text-[13px] text-[#77808E]">
                Search and manage published and draft content.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E5DDF1] bg-[#F5F1FB] px-3 py-1.5 text-xs font-medium text-[#8065B0]">
              {filteredPosts.length} of {posts.length}{" "}
              {posts.length === 1 ? "post" : "posts"}
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
            placeholder="Search by title, slug, author or email..."
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
              aria-label="Filter publication status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-10 min-w-[150px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              aria-label="Filter author"
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
              className="h-10 min-w-[170px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]"
            >
              <option value="all">All authors</option>
              {authors.map((author) => (
                <option key={author.id} value={String(author.id)}>
                  {author.name || author.email}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort posts"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-10 min-w-[150px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
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

      {filteredPosts.length > 0 ? (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#EAE7EF] bg-[#F8F6FB]">
                  <Heading>Post</Heading>

                  <Heading>Slug</Heading>

                  <Heading>Status</Heading>

                  <Heading>Author</Heading>

                  <Heading>Date</Heading>

                  {(canEdit || canDelete) && (
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EDF3]">
                {pagedPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="group transition hover:bg-[#FBFAFD]"
                  >
                    <td className="px-5 py-4">
                      <PostIdentity post={post} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex max-w-[230px] truncate rounded-lg border border-[#EAE7EF] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-medium text-[#77717F]">
                        {post.slug}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge published={post.published} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[180px] truncate text-sm font-medium text-gray-600">
                        {getAuthorName(post)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(post.createdAt)}
                      </span>
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/blog-posts/${post.id}/edit`}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white px-3 py-2 text-xs font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
                            >
                              Edit
                              <ArrowUpRight size={14} />
                            </Link>
                          )}

                          {canDelete && (
                            <DeleteBlogPostButton postId={post.id} />
                          )}
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
            {pagedPosts.map((post) => (
              <div key={post.id} className="p-5">
                <div className="flex items-start gap-3">
                  <PostIcon />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-[#24212D]">
                      {post.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">ID #{post.id}</p>
                  </div>

                  <StatusBadge published={post.published} />
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Slug
                  </p>

                  <p className="mt-1 break-all text-sm text-gray-600">
                    {post.slug}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoBox label="Author" value={getAuthorName(post)} />

                  <InfoBox label="Created" value={formatDate(post.createdAt)} />
                </div>

                {(canEdit || canDelete) && (
                  <div className="mt-5 flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={`/admin/blog-posts/${post.id}/edit`}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#25232C] px-3 py-2.5 text-xs font-medium text-white transition hover:bg-[#403948]"
                      >
                        Edit
                        <ArrowUpRight size={14} />
                      </Link>
                    )}

                    {canDelete && <DeleteBlogPostButton postId={post.id} />}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF3] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 text-xs text-[#77808E]">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredPosts.length)} of{" "}
                {filteredPosts.length}
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
          postsExist={posts.length > 0}
          hasFilters={hasFilters}
          onReset={resetFilters}
          canCreate={canCreate}
        />
      )}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
      {children}
    </th>
  );
}

function PostIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
      <BookOpen size={18} />
    </div>
  );
}

function PostIdentity({ post }: { post: BlogPost }) {
  return (
    <div className="flex items-center gap-3">
      <PostIcon />

      <div className="min-w-0">
        <p className="max-w-[320px] truncate text-sm font-semibold text-[#24212D]">
          {post.title}
        </p>

        <p className="mt-1 text-xs text-gray-400">ID #{post.id}</p>
      </div>
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
        published
          ? "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]"
          : "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]"
      }`}
    >
      {published ? <CheckCircle2 size={13} /> : <FileEdit size={13} />}

      {published ? "Published" : "Draft"}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F8F6FB] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

function getAuthorName(post: BlogPost) {
  return post.author?.name || post.author?.email || "Unknown";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN");
}

function EmptyState({
  postsExist,
  hasFilters,
  onReset,
  canCreate,
}: {
  postsExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
        {postsExist ? <Search size={23} /> : <BookOpen size={24} />}
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {postsExist ? "No matching blog posts" : "No blog posts yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {postsExist
          ? "Try changing your search, status, author or sorting options."
          : "Create your first blog post to start publishing content on CADGram."}
      </p>

      {postsExist && hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#403948]"
        >
          Clear filters
        </button>
      ) : !postsExist && canCreate ? (
        <Link
          href="/admin/blog-posts/new"
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={17} />
          Add Blog Post
        </Link>
      ) : null}
    </div>
  );
}
