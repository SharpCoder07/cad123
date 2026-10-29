import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

type BlogPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: {
      slug,
    },
    include: {
      author: true,
    },
  });
}

/* =========================================================
   Metadata
========================================================= */

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await getBlogPostBySlug(slug);

  if (!post || !post.published) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: post.title,

    description: post.excerpt || `Read ${post.title} on CADGram.`,
  };
}

/* =========================================================
   Page
========================================================= */

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;

  const post = await getBlogPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const readingTime = calculateReadingTime(post.content);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-background)" }}
    >
      {/* ===================================================
          ARTICLE HERO
      ==================================================== */}

      <section className="blog-detail-hero relative overflow-hidden border-b">
        {/* Background decoration */}
        <div className="blog-detail-glow-primary pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl" />

        <div className="blog-detail-glow-accent pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          {/* Back */}
          <Link
            href="/blog"
            className="blog-detail-back inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft size={15} />
            Back to Blog
          </Link>

          <div className="mt-10 max-w-4xl">
            {/* Label */}
            <div className="blog-detail-badge inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
              <FileText size={13} />
              CADGram Blog
            </div>

            {/* Title */}
            <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/55">
              {post.publishedAt && (
                <time
                  dateTime={new Date(post.publishedAt).toISOString()}
                  className="flex items-center gap-2"
                >
                  <CalendarDays size={15} />

                  {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}

              {post.author?.name && (
                <div className="flex items-center gap-2">
                  <UserRound size={15} />

                  <span>By {post.author.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock3 size={15} />

                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          FEATURED IMAGE
      ==================================================== */}

      {post.featuredImage && (
        <section style={{ backgroundColor: "var(--site-surface)" }}>
          <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-6 lg:px-8 lg:pt-14">
            <div className="blog-detail-featured-image overflow-hidden rounded-[28px] border shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="max-h-[620px] w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          ARTICLE CONTENT
      ==================================================== */}

      <section style={{ backgroundColor: "var(--site-surface)" }}>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
            {/* Article */}
            <article className="min-w-0">
              <div className="blog-detail-article rounded-[28px] border px-6 py-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
                {/* Intro */}
                {post.excerpt && (
                  <div className="blog-detail-intro mb-9 border-l-4 pl-5">
                    <p className="text-lg font-medium leading-8">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Actual article */}
                <div className="blog-detail-content whitespace-pre-line break-words text-[16px] leading-8 sm:text-[17px]">
                  {post.content}
                </div>
              </div>

              {/* End navigation */}
              <div className="blog-detail-navigation mt-8 flex flex-col gap-4 rounded-[24px] border p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] site-muted">
                    Continue exploring
                  </p>

                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: "var(--site-text)" }}
                  >
                    Discover more CADGram insights.
                  </p>
                </div>

                <Link
                  href="/blog"
                  className="blog-detail-link inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
                >
                  View all articles
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>

            {/* ===============================================
                SIDEBAR
            ================================================ */}

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-5">
                {/* Article details */}
                <div className="blog-detail-sidebar-card rounded-2xl border p-5">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--site-muted)" }}
                  >
                    Article
                  </p>

                  <div className="mt-5 space-y-4">
                    {post.publishedAt && (
                      <ArticleMetaItem
                        label="Published"
                        value={new Date(post.publishedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      />
                    )}

                    {post.author?.name && (
                      <ArticleMetaItem
                        label="Written by"
                        value={post.author.name}
                      />
                    )}

                    <ArticleMetaItem
                      label="Reading time"
                      value={`${readingTime} min`}
                    />
                  </div>
                </div>

                {/* Explore */}
                <div className="blog-detail-sidebar-cta relative overflow-hidden rounded-2xl p-5 text-white">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--site-accent)" }}
                  >
                    CADGram
                  </p>

                  <h3 className="mt-3 font-bold leading-6">
                    Find software for your workflow.
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Explore products or compare software side by side.
                  </p>

                  <div className="mt-5 space-y-2">
                    <Link
                      href="/products"
                      className="blog-detail-sidebar-primary flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold transition"
                    >
                      Browse Software
                      <ArrowRight size={13} />
                    </Link>

                    <Link
                      href="/compare"
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 px-3.5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Compare Products
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ===================================================
          BOTTOM CTA
      ==================================================== */}

      <section
        className="border-t"
        style={{
          borderColor: "var(--site-border)",
          backgroundColor: "var(--site-background)",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="site-primary-text text-xs font-bold uppercase tracking-[0.16em]">
              Explore CADGram
            </p>

            <h2
              className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--site-text)" }}
            >
              Make your next software decision with confidence.
            </h2>

            <p
              className="mx-auto mt-3 max-w-xl text-sm leading-6"
              style={{ color: "var(--site-muted)" }}
            >
              Browse software products and compare solutions based on features,
              pricing and specifications.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="site-primary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
              >
                Browse Software
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/compare"
                className="blog-detail-secondary-button inline-flex cursor-pointer items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition"
              >
                Compare Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   Article Meta
========================================================= */

function ArticleMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "var(--site-muted)" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-sm font-semibold"
        style={{ color: "var(--site-text)" }}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   Reading Time
========================================================= */

function calculateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}
