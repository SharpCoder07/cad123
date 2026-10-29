"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
  Layers3,
} from "lucide-react";
import { toast } from "react-toastify";

type WebsitePage = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  status?: string | null;
  publishedVersion?: number | null;
  updatedAt?: string;
};

type ApiPayload = {
  success?: boolean;
  message?: string;
  pages?: WebsitePage[];
  data?: WebsitePage[] | { pages?: WebsitePage[] };
};

function extractPages(payload: ApiPayload | WebsitePage[]): WebsitePage[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.pages)) return payload.pages;
  if (Array.isArray(payload.data)) return payload.data;
  if (
    payload.data &&
    !Array.isArray(payload.data) &&
    Array.isArray(payload.data.pages)
  ) {
    return payload.data.pages;
  }
  return [];
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function WebsiteBuilderAdminPage() {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadPages = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/website-builder/pages", {
        cache: "no-store",
      });
      const payload: ApiPayload | WebsitePage[] = await response.json();
      if (
        !response.ok ||
        (!Array.isArray(payload) && payload.success === false)
      ) {
        throw new Error(
          !Array.isArray(payload)
            ? payload.message || "Unable to load pages."
            : "Unable to load pages.",
        );
      }
      setPages(extractPages(payload));
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to load pages.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter((page) =>
      [page.title, page.slug, page.description || ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [pages, search]);

  const publishedCount = pages.filter(
    (page) => page.publishedVersion != null,
  ).length;

  function onTitleChange(value: string) {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  async function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("Enter a page title and slug.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/website-builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || null,
        }),
      });
      const payload: { success?: boolean; message?: string } =
        await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Could not create the page.");
      }
      toast.success("Page created successfully.");
      setShowCreate(false);
      setTitle("");
      setSlug("");
      setDescription("");
      await loadPages(true);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not create the page.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Website Management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Website Builder
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage public website pages, drafts, and published content.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/admin/website-builder/global-sections"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Layers3 size={17} />
            Global Sections
          </Link>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            New Page
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Pages", value: pages.length },
          { label: "Published", value: publishedCount },
          { label: "Not Published", value: pages.length - publishedCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pages</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your CMS pages and their publication status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative flex-1 sm:w-64">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search pages"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pages..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <button
              type="button"
              aria-label="Refresh pages"
              title="Refresh pages"
              disabled={refreshing}
              onClick={() => void loadPages(true)}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading pages...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadPages(true)}
              className="mt-4 cursor-pointer text-sm font-semibold text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <FilePlus2 size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {search ? "No matching pages" : "No pages yet"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create your first CMS page to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPages.map((page) => {
              const published = page.publishedVersion != null;
              return (
                <div
                  key={page.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-slate-100 p-3 text-slate-600">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {page.title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {published ? "Published" : "Not published"}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-500">
                        /{page.slug === "home" ? "" : page.slug}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Updated {formatDate(page.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-14 sm:pl-0">
                    {published && (
                      <Link
                        href={page.slug === "home" ? "/" : `/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-sm font-semibold text-slate-600 hover:text-blue-600"
                      >
                        View live
                      </Link>
                    )}
                    <Link
                      href={`/admin/website-builder/${page.id}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Open Editor
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating)
              setShowCreate(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-page-heading"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="create-page-heading"
                  className="text-xl font-bold text-slate-900"
                >
                  Create Website Page
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  New pages are not published automatically.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={creating}
                onClick={() => setShowCreate(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(event) => void createPage(event)}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-semibold text-slate-700">
                Page title
                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="About Us"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                URL slug
                <input
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers and hyphens"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value.toLowerCase())
                  }
                  placeholder="about-us"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>
              <p className="text-xs text-slate-500">
                Use <strong>home</strong> as the slug for the homepage. Avoid
                slugs already used by existing routes.
              </p>
              <label className="block text-sm font-semibold text-slate-700">
                Description (optional)
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this page about?"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowCreate(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}{" "}
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
