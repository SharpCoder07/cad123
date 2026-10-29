"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Send,
  Users,
  ListChecks,
  Info,
  Loader2,
  Save,
  BookOpen,
} from "lucide-react";

type BlogUser = {
  id: number;
  name: string | null;
  email: string;
};

type Props = {
  canPublish: boolean;
};

export default function NewBlogPostForm({ canPublish }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [published, setPublished] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [users, setUsers] = useState<BlogUser[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);

        const response = await fetch("/api/admin/blog-posts/users");
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to load authors.");
          return;
        }

        setUsers(data.users ?? []);
      } catch (error) {
        console.error("Load users error:", error);
        toast.error("Something went wrong while loading authors.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Title, slug and content are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          featuredImage,
          authorId,
          published: canPublish ? published : false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to create blog post.");
        return;
      }

      toast.success("Blog post created successfully.");

      setTimeout(() => {
        router.push("/admin/blog-posts");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Create blog post error:", error);

      toast.error("Something went wrong while creating the blog post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[#9A95A3]">
            <Link
              href="/admin/blog-posts"
              className="cursor-pointer hover:text-gray-900"
            >
              Blog Posts
            </Link>

            <ChevronRight size={14} aria-hidden="true" />

            <span className="text-[#44414C]">Add Blog Post</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <BookOpen size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Blog Post
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create and publish a new article for the CADGram blog.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/blog-posts"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Blog Posts
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main Content */}
          <div className="space-y-5">
            {/* Post Details */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="border-b border-[#F0EDF4] px-6 py-5">
                <h2 className="text-base font-semibold text-[#292532]">
                  Post Details
                </h2>

                <p className="mt-1 text-sm text-[#77808E]">
                  Add the title, URL slug and introductory content for the
                  article.
                </p>
              </div>

              <div className="space-y-5 p-6">
                {/* Title */}
                <div>
                  <label className="text-[13px] font-medium text-[#44414C]">
                    Title
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter blog post title"
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm text-[#292532] outline-none transition placeholder:text-[#9A95A3] focus:border-[#A78CCF] focus:ring-4 focus:ring-[#F3EDFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-[13px] font-medium text-[#44414C]">
                    Slug
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-[#EAE7EF] bg-white focus-within:border-[#A78CCF] focus-within:ring-4 focus-within:ring-[#F3EDFA]">
                    <div className="flex items-center border-r border-[#EAE7EF] bg-[#FAF9FC] px-3 text-xs text-[#9A95A3]">
                      /blog/
                    </div>

                    <input
                      type="text"
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                      placeholder="enter-blog-post-slug"
                      disabled={loading}
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#292532] outline-none placeholder:text-[#9A95A3] disabled:cursor-not-allowed"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-[#9A95A3]">
                    Use a lowercase, URL-friendly value.
                  </p>
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] font-medium text-[#44414C]">
                      Excerpt
                    </label>

                    <span className="text-xs text-[#9A95A3]">
                      {excerpt.length} characters
                    </span>
                  </div>

                  <textarea
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    placeholder="Short description of the blog post"
                    rows={4}
                    disabled={loading}
                    className="mt-2 w-full resize-y rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm leading-6 text-[#292532] outline-none transition placeholder:text-[#9A95A3] focus:border-[#A78CCF] focus:ring-4 focus:ring-[#F3EDFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                  />
                </div>
              </div>
            </section>

            {/* Content */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="border-b border-[#F0EDF4] px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#292532]">
                      Article Content
                    </h2>

                    <p className="mt-1 text-sm text-[#77808E]">
                      Write the main content of the blog post.
                    </p>
                  </div>

                  <span className="hidden text-xs text-[#9A95A3] sm:block">
                    {content.length} characters
                  </span>
                </div>
              </div>

              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write the blog post content..."
                  rows={18}
                  disabled={loading}
                  className="w-full resize-y rounded-xl border border-[#EAE7EF] bg-white px-4 py-4 text-sm leading-7 text-[#292532] outline-none transition placeholder:text-[#9A95A3] focus:border-[#A78CCF] focus:ring-4 focus:ring-[#F3EDFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                />

                <div className="mt-2 text-right text-xs text-[#9A95A3] sm:hidden">
                  {content.length} characters
                </div>
              </div>
            </section>

            {/* Featured Image */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="border-b border-[#F0EDF4] px-6 py-5">
                <h2 className="text-base font-semibold text-[#292532]">
                  Featured Image
                </h2>

                <p className="mt-1 text-sm text-[#77808E]">
                  Add the image displayed with the blog post.
                </p>
              </div>

              <div className="p-6">
                <label className="text-[13px] font-medium text-[#44414C]">
                  Featured Image URL
                </label>

                <input
                  type="text"
                  value={featuredImage}
                  onChange={(event) => setFeaturedImage(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm text-[#292532] outline-none transition placeholder:text-[#9A95A3] focus:border-[#A78CCF] focus:ring-4 focus:ring-[#F3EDFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                />

                {featuredImage.trim() && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#EAE7EF] bg-[#FAF9FC]">
                    <div className="border-b border-[#EAE7EF] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9A95A3]">
                        Image Preview
                      </p>
                    </div>

                    <div className="flex min-h-48 items-center justify-center bg-white p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredImage}
                        alt={title || "Featured image preview"}
                        className="max-h-72 max-w-full rounded-lg object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 shadow-[0_6px_24px_rgba(39,28,59,0.035)] sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/admin/blog-posts"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#EAE7EF] px-5 py-3 text-[13px] font-medium text-[#44414C] transition hover:bg-[#FAF9FC]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 py-3 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} aria-hidden="true" />
                    Save Blog Post
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Publishing */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Send size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#292532]">
                    Publishing
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Control the post status
                  </p>
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  published
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[#EAE7EF] bg-[#FAF9FC] hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                  disabled={loading || !canPublish}
                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 accent-[#8065B0] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div>
                  <p className="text-[13px] font-medium text-[#44414C]">
                    Publish this blog post
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#77808E]">
                    {!canPublish
                      ? "You do not have permission to publish blog posts. This post will be saved as a draft."
                      : published
                        ? "The post will be created as published."
                        : "The post will remain unpublished."}
                  </p>
                </div>
              </label>
            </div>

            {/* Author */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Users size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#292532]">
                    Author
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Assign the post author
                  </p>
                </div>
              </div>

              <label className="text-[13px] font-medium text-[#44414C]">
                Author
              </label>

              <select
                value={authorId}
                onChange={(event) => setAuthorId(event.target.value)}
                disabled={loading || loadingUsers}
                className="mt-2 w-full cursor-pointer rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm text-[#292532] outline-none transition focus:border-[#A78CCF] focus:ring-4 focus:ring-[#F3EDFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
              >
                <option value="">
                  {loadingUsers ? "Loading authors..." : "Select author"}
                </option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Checklist */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <ListChecks size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#292532]">
                    Post Checklist
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Required before creation
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77808E]">Title</span>

                  <span
                    className={`text-xs font-semibold ${
                      title.trim() ? "text-emerald-600" : "text-[#9A95A3]"
                    }`}
                  >
                    {title.trim() ? "Complete" : "Required"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77808E]">Slug</span>

                  <span
                    className={`text-xs font-semibold ${
                      slug.trim() ? "text-emerald-600" : "text-[#9A95A3]"
                    }`}
                  >
                    {slug.trim() ? "Complete" : "Required"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77808E]">Content</span>

                  <span
                    className={`text-xs font-semibold ${
                      content.trim() ? "text-emerald-600" : "text-[#9A95A3]"
                    }`}
                  >
                    {content.trim() ? "Complete" : "Required"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77808E]">Author</span>

                  <span
                    className={`text-xs font-semibold ${
                      authorId ? "text-emerald-600" : "text-[#9A95A3]"
                    }`}
                  >
                    {authorId ? "Selected" : "Optional"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77808E]">Featured image</span>

                  <span
                    className={`text-xs font-semibold ${
                      featuredImage.trim()
                        ? "text-emerald-600"
                        : "text-[#9A95A3]"
                    }`}
                  >
                    {featuredImage.trim() ? "Added" : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-[#F8F6FC] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                  <Info size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#292532]">
                    Content note
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#77808E]">
                    The content field currently uses the existing plain-text
                    editor. No editor functionality has been changed here.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
