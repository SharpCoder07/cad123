import Link from "next/link";

import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import BlogPostCatalog from "@/components/admin/BlogPostCatalog";

const statCardBase =
  "relative min-h-[146px] overflow-hidden rounded-[21px] border p-5 shadow-[0_6px_24px_rgba(39,28,59,0.035)]";

export default async function AdminBlogPostsPage() {
  // RBAC: Require permission to view blog posts.
  const admin = await requireAdminPermission("blog_posts.view");

  // RBAC: Action permissions.
  const canCreate = admin.permissions.includes("blog_posts.create");
  const canEdit = admin.permissions.includes("blog_posts.edit");
  const canDelete = admin.permissions.includes("blog_posts.delete");
  const canPublish = admin.permissions.includes("blog_posts.publish");

  const posts = await prisma.blogPost.findMany({
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const publishedPosts = posts.filter((post) => post.published).length;
  const draftPosts = posts.length - publishedPosts;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Blog Posts
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create, edit and manage content published on the CADGram
                website.
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <Link
            href="/admin/blog-posts/new"
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] sm:self-auto"
          >
            <Plus size={17} aria-hidden="true" />
            Add Blog Post
          </Link>
        )}
      </section>

      {/* Summary */}
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Blog post statistics"
      >
        <div
          className={`${statCardBase} border-[#E6DDF6] bg-gradient-to-br from-[#F8F4FF] to-[#F1EBFD]`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#7D699F]">
              Total Posts
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#8065B0]">
              <BookOpen size={19} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#292334]">
            {posts.length}
          </p>
          <p className="mt-2 text-[12px] text-[#8D7FA3]">
            All blog posts in the system
          </p>
        </div>

        <div
          className={`${statCardBase} border-[#D8EEDF] bg-gradient-to-br from-[#F1FCF5] to-[#E8F8EF]`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#438A63]">Published</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#359267]">
              <CheckCircle2 size={19} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#263C30]">
            {publishedPosts}
          </p>
          <p className="mt-2 text-[12px] text-[#699D7D]">
            Posts currently marked as published
          </p>
        </div>

        <div
          className={`${statCardBase} border-[#F2E3CC] bg-gradient-to-br from-[#FFF9F0] to-[#FFF1DD]`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#AA7A39]">Drafts</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#B88A49]">
              <FileEdit size={19} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#433425]">
            {draftPosts}
          </p>
          <p className="mt-2 text-[12px] text-[#AE916B]">
            Posts that are not yet published
          </p>
        </div>
      </section>

      {/* Blog catalog */}
      <BlogPostCatalog
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          published: post.published,
          createdAt: post.createdAt.toISOString(),
          author: post.author
            ? {
                id: post.author.id,
                name: post.author.name,
                email: post.author.email,
              }
            : null,
        }))}
        canEdit={canEdit}
        canDelete={canDelete}
        canPublish={canPublish}
        canCreate={canCreate}
      />
    </div>
  );
}
