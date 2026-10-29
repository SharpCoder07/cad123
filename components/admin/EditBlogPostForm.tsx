"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  Pencil,
  FileText,
  Image as ImageIcon,
  Send,
  Users,
  ListChecks,
  Info,
  Loader2,
  Save,
  BookOpen,
} from "lucide-react";

type User = {
  id: number;
  name: string | null;
  email: string;
};

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  published: boolean;
  publishedAt: string | null;
  authorId: number | null;
};

type Props = {
  postId: string;
  canPublish: boolean;
};

export default function EditBlogPostForm({ postId, canPublish }: Props) {
  const router = useRouter();

  const id = postId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [published, setPublished] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [postResponse, usersResponse] = await Promise.all([
          fetch(`/api/admin/blog-posts/${id}`),
          fetch("/api/admin/blog-posts/users"),
        ]);

        const postData = await postResponse.json();
        const usersData = await usersResponse.json();

        if (!postResponse.ok) {
          toast.error(postData.message || "Failed to load blog post.");
          return;
        }

        if (usersResponse.ok) {
          setUsers(usersData.users ?? []);
        }

        const post: BlogPost = postData.post;

        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content);
        setFeaturedImage(post.featuredImage || "");
        setAuthorId(post.authorId ? String(post.authorId) : "");
        setPublished(post.published);
      } catch (error) {
        console.error("Load blog post error:", error);

        toast.error("Something went wrong while loading the blog post.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Title, slug and content are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "PUT",
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
          ...(canPublish ? { published } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update blog post.");
        return;
      }

      toast.success("Blog post updated successfully.");

      setTimeout(() => {
        router.push("/admin/blog-posts");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Update blog post error:", error);

      toast.error("Something went wrong while updating the blog post.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-[#EAE5F1]" />

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#EAE5F1]" />

              <div className="space-y-2">
                <div className="h-7 w-48 rounded bg-[#EAE5F1]" />
                <div className="h-4 w-72 rounded bg-[#EAE5F1]" />
              </div>
            </div>
          </div>

          <div className="h-10 w-40 rounded-xl bg-[#EAE5F1]" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="h-80 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-96 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-64 rounded-[20px] border border-[#EAE7EF] bg-white" />
          </div>

          <div className="space-y-6">
            <div className="h-48 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-52 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-64 rounded-[20px] border border-[#EAE7EF] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-[#77808E]">
            <Link
              href="/admin/blog-posts"
              className="cursor-pointer transition hover:text-[#1F2430]"
            >
              Blog Posts
            </Link>

            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />

            <span className="text-[#44414C]">Edit Blog Post</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EBDEFA] text-[#8065B0]">
              <BookOpen size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Blog Post
              </h1>

              <p className="mt-1 text-sm text-[#77808E]">
                Update the content, author and publishing settings.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/blog-posts"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-sm font-semibold text-[#44414C] shadow-sm transition hover:bg-[#FAF9FC]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to Blog Posts
        </Link>
      </div>

      <form onSubmit={handleUpdate}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Post Details */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="border-b border-[#F0EDF3] px-6 py-5">
                <h2 className="text-base font-semibold text-[#1F2430]">
                  <FileText
                    className="mr-2 inline-block h-4 w-4 align-[-2px] text-[#8065B0]"
                    strokeWidth={1.8}
                  />
                  Post Details
                </h2>

                <p className="mt-1 text-sm text-[#77808E]">
                  Manage the title, URL slug and introduction shown for the
                  article.
                </p>
              </div>

              <div className="space-y-5 p-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-[#44414C]">
                    Title
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition placeholder:text-[#9A95A3] focus:border-[#BBA5DD] focus:ring-4 focus:ring-[#F4EFFB] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                    placeholder="Enter blog post title"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-sm font-semibold text-[#44414C]">
                    Slug
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-[#E5E2EA] bg-white focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
                    <div className="flex items-center border-r border-[#E5E2EA] bg-[#FAF9FC] px-3 text-xs text-[#9A95A3]">
                      /blog/
                    </div>

                    <input
                      type="text"
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                      disabled={saving}
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#1F2430] outline-none placeholder:text-[#9A95A3] disabled:cursor-not-allowed"
                      placeholder="enter-blog-post-slug"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-[#9A95A3]">
                    Keep the value lowercase and URL-friendly.
                  </p>
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-[#44414C]">
                      Excerpt
                    </label>

                    <span className="text-xs text-[#9A95A3]">
                      {excerpt.length} characters
                    </span>
                  </div>

                  <textarea
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    rows={4}
                    disabled={saving}
                    className="mt-2 w-full resize-y rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm leading-6 text-[#1F2430] outline-none transition placeholder:text-[#9A95A3] focus:border-[#BBA5DD] focus:ring-4 focus:ring-[#F4EFFB] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                    placeholder="Short description of the blog post"
                  />
                </div>
              </div>
            </section>

            {/* Article Content */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="border-b border-[#F0EDF3] px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#1F2430]">
                      <FileText
                        className="mr-2 inline-block h-4 w-4 align-[-2px] text-[#8065B0]"
                        strokeWidth={1.8}
                      />
                      Article Content
                    </h2>

                    <p className="mt-1 text-sm text-[#77808E]">
                      Update the main body of the blog post.
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
                  rows={18}
                  disabled={saving}
                  className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-white px-4 py-4 text-sm leading-7 text-[#1F2430] outline-none transition placeholder:text-[#9A95A3] focus:border-[#BBA5DD] focus:ring-4 focus:ring-[#F4EFFB] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                  placeholder="Write the blog post content..."
                />

                <div className="mt-2 text-right text-xs text-[#9A95A3] sm:hidden">
                  {content.length} characters
                </div>
              </div>
            </section>

            {/* Featured Image */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-[#F0EDF3] px-6 py-5">
                <h2 className="text-base font-semibold text-[#1F2430]">
                  <ImageIcon
                    className="mr-2 inline-block h-4 w-4 align-[-2px] text-[#8065B0]"
                    strokeWidth={1.8}
                  />
                  Featured Image
                </h2>

                <p className="mt-1 text-sm text-[#77808E]">
                  Update the image associated with this blog post.
                </p>
              </div>

              <div className="p-6">
                <label className="text-sm font-semibold text-[#44414C]">
                  Featured Image URL
                </label>

                <input
                  type="text"
                  value={featuredImage}
                  onChange={(event) => setFeaturedImage(event.target.value)}
                  disabled={saving}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition placeholder:text-[#9A95A3] focus:border-[#BBA5DD] focus:ring-4 focus:ring-[#F4EFFB] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                />

                {featuredImage.trim() && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E2EA] bg-[#FAF9FC]">
                    <div className="border-b border-[#E5E2EA] px-4 py-3">
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
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] px-5 py-3 text-sm font-semibold text-[#44414C] transition hover:bg-[#FAF9FC]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 py-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={1.8}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" strokeWidth={1.8} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Publishing */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Send className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F2430]">
                    Publishing
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Control the current post status
                  </p>
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  published
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[#E5E2EA] bg-[#FAF9FC] hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                  disabled={saving || !canPublish}
                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 accent-[#8065B0] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div>
                  <p className="text-sm font-semibold text-[#44414C]">
                    Publish this blog post
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#77808E]">
                    {!canPublish
                      ? "You can edit this post, but you do not have permission to change its publishing status."
                      : published
                        ? "This post is currently marked as published."
                        : "This post is currently unpublished."}
                  </p>
                </div>
              </label>
            </div>

            {/* Author */}
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Users className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F2430]">
                    Author
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Assign the post author
                  </p>
                </div>
              </div>

              <label className="text-sm font-semibold text-[#44414C]">
                Author
              </label>

              <select
                value={authorId}
                onChange={(event) => setAuthorId(event.target.value)}
                disabled={saving}
                className="mt-2 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition focus:border-[#BBA5DD] focus:ring-4 focus:ring-[#F4EFFB] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
              >
                <option value="">Select author</option>

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
                  <ListChecks className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F2430]">
                    Post Checklist
                  </h3>

                  <p className="text-xs text-[#77808E]">
                    Current content status
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
            <div className="rounded-2xl border border-[#E5E2EA] bg-[#FAF9FC] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                  <Info className="h-4 w-4" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F2430]">
                    Content note
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#77808E]">
                    The existing plain-text content field is preserved. No
                    editor or backend behavior has been changed.
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
