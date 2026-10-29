"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

type GlobalSection = {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { sections?: number };
};

type WebsitePage = {
  id: number;
  title: string;
  slug: string;
};

type DraftSection = {
  id: number;
  name: string;
  type: string;
  key?: string;
  sortOrder?: number;
};

type ApiResult<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  pages?: T;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Unable to complete the request.");
  }

  return payload as T;
}

function unwrap<T>(payload: unknown): T {
  let value = payload as Record<string, unknown>;

  for (let i = 0; i < 3; i++) {
    if (value && value.data && !Array.isArray(value.data)) {
      value = value.data as Record<string, unknown>;
    } else {
      break;
    }
  }

  return value as T;
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

export default function GlobalSectionsPage() {
  const [sections, setSections] = useState<GlobalSection[]>([]);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pageId, setPageId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [draftSections, setDraftSections] = useState<DraftSection[]>([]);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSection, setEditingSection] = useState<GlobalSection | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingSection, setDeletingSection] = useState<GlobalSection | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadSections = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [globalPayload, pagesPayload] = await Promise.all([
        request<ApiResult<GlobalSection[]> | GlobalSection[]>(
          "/api/admin/website-builder/global-sections",
        ),
        request<ApiResult<WebsitePage[]> | WebsitePage[]>(
          "/api/admin/website-builder/pages",
        ),
      ]);

      const globalData = Array.isArray(globalPayload)
        ? globalPayload
        : Array.isArray(globalPayload.data)
          ? globalPayload.data
          : [];

      const pageData = Array.isArray(pagesPayload)
        ? pagesPayload
        : Array.isArray(pagesPayload.pages)
          ? pagesPayload.pages
          : Array.isArray(pagesPayload.data)
            ? pagesPayload.data
            : [];

      setSections(globalData);
      setPages(pageData);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to load Global Sections.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sections;

    return sections.filter((section) =>
      [section.name, section.type, section.description || ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [sections, search]);

  const totalUsages = sections.reduce(
    (total, section) => total + (section._count?.sections ?? 0),
    0,
  );

  async function loadDraftSections(selectedPageId: string) {
    setPageId(selectedPageId);
    setSectionId("");
    setDraftSections([]);

    if (!selectedPageId) return;

    setLoadingDraft(true);

    try {
      const payload = await request<unknown>(
        `/api/admin/website-builder/pages/${selectedPageId}`,
      );

      const page = unwrap<{
        versions?: Array<{
          status: string;
          sections?: Array<
            DraftSection & {
              globalSectionId?: number | null;
            }
          >;
        }>;
      }>(payload);

      const draft = page.versions?.find(
        (version) => version.status === "DRAFT",
      );

      const availableSections = (draft?.sections ?? [])
        .filter((section) => section.globalSectionId == null)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);

      setDraftSections(availableSections);

      if (!draft) {
        toast.info("This page has no draft version.");
      } else if (availableSections.length === 0) {
        toast.info("No unlinked sections are available in this draft.");
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to load draft sections.",
      );
    } finally {
      setLoadingDraft(false);
    }
  }

  function openCreate() {
    setName("");
    setDescription("");
    setPageId("");
    setSectionId("");
    setDraftSections([]);
    setShowCreate(true);
  }

  async function createGlobalSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !sectionId) {
      toast.error("Enter a name and select a source draft section.");
      return;
    }

    setCreating(true);

    try {
      const payload = await request<{ message?: string }>(
        "/api/admin/website-builder/global-sections",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            sectionId: Number(sectionId),
          }),
        },
      );

      toast.success(payload.message || "Global Section created.");
      setShowCreate(false);
      await loadSections(true);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to create Global Section.",
      );
    } finally {
      setCreating(false);
    }
  }

  function openEdit(section: GlobalSection) {
    setEditingSection(section);
    setEditName(section.name);
    setEditDescription(section.description ?? "");
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingSection) return;

    const trimmedName = editName.trim();

    if (!trimmedName) {
      toast.error("Global Section name is required.");
      return;
    }

    setSavingEdit(true);

    try {
      const payload = await request<{ message?: string }>(
        `/api/admin/website-builder/global-sections/${editingSection.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            description: editDescription.trim() || null,
          }),
        },
      );

      toast.success(payload.message || "Global Section updated successfully.");
      setEditingSection(null);
      await loadSections(true);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to update Global Section.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deletingSection) return;

    setDeleting(true);

    try {
      const payload = await request<{ message?: string }>(
        `/api/admin/website-builder/global-sections/${deletingSection.id}`,
        {
          method: "DELETE",
        },
      );

      toast.success(payload.message || "Global Section deleted successfully.");
      setDeletingSection(null);
      await loadSections(true);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to delete Global Section.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/website-builder"
            className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Website Builder
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Website Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Global Sections
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage shared website sections. Updates to a shared section can be
            reflected wherever that section is used.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Create Global Section
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Global Sections", value: sections.length },
          { label: "Total Usages", value: totalUsages },
          {
            label: "Unused Sections",
            value: sections.filter(
              (section) => (section._count?.sections ?? 0) === 0,
            ).length,
          },
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
            <h2 className="text-lg font-bold text-slate-900">
              Shared Sections
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Headers, footers, navigation and other reusable sections
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative flex-1 sm:w-64">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search Global Sections"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sections..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="button"
              aria-label="Refresh Global Sections"
              title="Refresh"
              disabled={refreshing}
              onClick={() => void loadSections(true)}
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
            <Loader2 size={18} className="animate-spin" />
            Loading Global Sections...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadSections(true)}
              className="mt-4 cursor-pointer text-sm font-semibold text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <Layers3 size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {search ? "No matching sections" : "No Global Sections yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create a shared section from a draft page to start reusing it across your website."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Create your first Global Section
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Layers3 size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{section.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Type: {section.type}
                    </p>
                    {section.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {section.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Updated {formatDate(section.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {section._count?.sections ?? 0}{" "}
                    {(section._count?.sections ?? 0) === 1 ? "usage" : "usages"}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEdit(section)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`Edit ${section.name}`}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingSection(section)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    aria-label={`Delete ${section.name}`}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowCreate(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-global-heading"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="create-global-heading"
                  className="text-xl font-bold text-slate-900"
                >
                  Create Global Section
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a section from an existing draft.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={creating}
                onClick={() => setShowCreate(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => void createGlobalSection(event)}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-semibold text-slate-700">
                Global Section name
                <input
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Main Header"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Description (optional)
                <textarea
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Shared header used across website pages"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Source page
                <select
                  required
                  value={pageId}
                  onChange={(event) =>
                    void loadDraftSections(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                >
                  <option value="">Select a page</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title} (/{page.slug})
                    </option>
                  ))}
                </select>
              </label>

              {pageId && (
                <label className="block text-sm font-semibold text-slate-700">
                  Source draft section
                  <select
                    required
                    value={sectionId}
                    onChange={(event) => setSectionId(event.target.value)}
                    disabled={loadingDraft || draftSections.length === 0}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-blue-500 disabled:bg-slate-50"
                  >
                    <option value="">
                      {loadingDraft
                        ? "Loading draft sections..."
                        : draftSections.length === 0
                          ? "No sections available in the draft"
                          : "Select a section"}
                    </option>
                    {draftSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.type})
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs font-normal text-slate-500">
                    Only sections from the page&apos;s current draft are
                    available.
                  </span>
                </label>
              )}

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
                  disabled={creating || loadingDraft || !sectionId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Create Global Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingEdit) {
              setEditingSection(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-global-heading"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="edit-global-heading"
                  className="text-xl font-bold text-slate-900"
                >
                  Edit Global Section
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the name and description of this shared section.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={savingEdit}
                onClick={() => setEditingSection(null)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => void saveEdit(event)}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-semibold text-slate-700">
                Global Section name
                <input
                  required
                  maxLength={120}
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Main Header"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Description (optional)
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Shared header used across website pages"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingSection(null)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEdit && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingSection && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeletingSection(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-global-heading"
            aria-describedby="delete-global-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Trash2 size={22} />
              </div>

              <div className="min-w-0">
                <h2
                  id="delete-global-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Delete Global Section?
                </h2>

                <p
                  id="delete-global-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  Are you sure you want to delete{" "}
                  <strong className="break-words text-slate-900">
                    {deletingSection.name}
                  </strong>
                  ? This action cannot be undone. Sections currently using this
                  Global Section cannot be deleted until they are unlinked.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingSection(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Deleting..." : "Delete Section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
