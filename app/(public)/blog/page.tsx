import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, FileText } from "lucide-react";

import { getBlogPosts } from "@/lib/data/blog";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-background)" }}
    >
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="blog-page-hero relative overflow-hidden border-b">
        {/* Decoration */}
        <div className="blog-page-glow-primary pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full blur-3xl" />

        <div className="blog-page-glow-accent pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="blog-page-badge inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
              <BookOpen size={14} />
              CADGram Resources
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Insights for smarter
              <span className="block" style={{ color: "var(--site-accent)" }}>
                software decisions.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              Explore software guides, comparisons, practical tips and industry
              insights to help you choose tools that fit your workflow.
            </p>

            {posts.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {posts.length} {posts.length === 1 ? "article" : "articles"}
                </span>

                <span>Guides · Comparisons · Insights</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <section style={{ backgroundColor: "var(--site-surface)" }}>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          {posts.length === 0 ? (
            <EmptyBlogState />
          ) : (
            <>
              {/* =============================================
                  FEATURED / LATEST POST
              ============================================== */}
              <div>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="site-primary-text text-xs font-bold uppercase tracking-[0.16em]">
                      Latest
                    </p>

                    <h2
                      className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                      style={{ color: "var(--site-text)" }}
                    >
                      Latest from CADGram
                    </h2>
                  </div>
                </div>

                <article className="blog-page-featured group overflow-hidden rounded-[28px] border shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                  <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                    {/* Image */}
                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="relative block min-h-[280px] cursor-pointer overflow-hidden sm:min-h-[360px] lg:min-h-[430px]"
                      style={{ backgroundColor: "var(--site-surface)" }}
                    >
                      {featuredPost.featuredImage ? (
                        <img
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="blog-page-image-fallback absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
                              <FileText size={26} />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-white/65">
                              CADGram Insights
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-5 top-5">
                        <span className="blog-page-image-badge rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm backdrop-blur">
                          Latest Article
                        </span>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <BlogDate date={featuredPost.publishedAt} />

                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="mt-4 cursor-pointer"
                      >
                        <h2 className="blog-page-featured-title text-2xl font-bold leading-tight tracking-tight transition sm:text-3xl">
                          {featuredPost.title}
                        </h2>
                      </Link>

                      {featuredPost.excerpt && (
                        <p
                          className="mt-5 line-clamp-4 text-sm leading-7 sm:text-base"
                          style={{ color: "var(--site-muted)" }}
                        >
                          {featuredPost.excerpt}
                        </p>
                      )}

                      <div className="mt-7">
                        <Link
                          href={`/blog/${featuredPost.slug}`}
                          className="site-secondary-button inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                        >
                          Read Article
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* =============================================
                  MORE ARTICLES
              ============================================== */}
              {remainingPosts.length > 0 && (
                <div className="mt-16 lg:mt-20">
                  <div className="mb-7">
                    <p className="site-primary-text text-xs font-bold uppercase tracking-[0.16em]">
                      Explore
                    </p>

                    <h2
                      className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                      style={{ color: "var(--site-text)" }}
                    >
                      More articles
                    </h2>

                    <p
                      className="mt-2 max-w-2xl text-sm leading-6"
                      style={{ color: "var(--site-muted)" }}
                    >
                      Browse guides, comparisons and insights from the CADGram
                      team.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {remainingPosts.map((post) => (
                      <article
                        key={post.id}
                        className="blog-page-card group flex h-full flex-col overflow-hidden rounded-[24px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                      >
                        {/* Image */}
                        <Link
                          href={`/blog/${post.slug}`}
                          className="relative block h-52 cursor-pointer overflow-hidden"
                          style={{ backgroundColor: "var(--site-surface)" }}
                        >
                          {post.featuredImage ? (
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="blog-page-card-fallback flex h-full items-center justify-center">
                              <div className="blog-page-card-fallback-icon flex h-12 w-12 items-center justify-center rounded-xl shadow-sm">
                                <FileText size={20} />
                              </div>
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex flex-1 flex-col p-6">
                          <BlogDate date={post.publishedAt} />

                          <Link
                            href={`/blog/${post.slug}`}
                            className="cursor-pointer"
                          >
                            <h3 className="blog-page-card-title mt-3 line-clamp-2 text-xl font-bold leading-snug transition">
                              {post.title}
                            </h3>
                          </Link>

                          {post.excerpt && (
                            <p
                              className="mt-3 line-clamp-3 text-sm leading-6"
                              style={{ color: "var(--site-muted)" }}
                            >
                              {post.excerpt}
                            </p>
                          )}

                          <div className="mt-auto pt-6">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="blog-page-read-link inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold transition hover:gap-2.5"
                            >
                              Read article
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          BOTTOM CTA
      ====================================================== */}
      {posts.length > 0 && (
        <section
          className="border-t"
          style={{
            borderColor: "var(--site-border)",
            backgroundColor: "var(--site-background)",
          }}
        >
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
            <div className="blog-page-cta relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
              <div
                aria-hidden="true"
                className="blog-page-cta-primary-glow pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full blur-3xl"
              />

              <div
                aria-hidden="true"
                className="blog-page-cta-accent-glow pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full blur-3xl"
              />

              <div className="relative max-w-2xl">
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: "var(--site-accent)" }}
                >
                  Explore software
                </p>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Ready to find the right software?
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/60">
                  Browse software products, explore categories and compare
                  solutions side by side.
                </p>
              </div>

              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Link
                  href="/products"
                  className="blog-page-cta-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                >
                  Browse Software
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/compare"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Compare Products
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/* =========================================================
   Blog Date
========================================================= */

function BlogDate({ date }: { date: Date | string | null }) {
  if (!date) {
    return null;
  }

  return (
    <time
      dateTime={new Date(date).toISOString()}
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: "var(--site-muted)" }}
    >
      <CalendarDays size={13} />

      {new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}
    </time>
  );
}

/* =========================================================
   Empty State
========================================================= */

function EmptyBlogState() {
  return (
    <div className="blog-page-empty rounded-[28px] border border-dashed px-6 py-16 text-center">
      <div className="blog-page-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
        <BookOpen size={22} />
      </div>

      <h2
        className="mt-5 text-xl font-bold"
        style={{ color: "var(--site-text)" }}
      >
        No articles yet
      </h2>

      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{ color: "var(--site-muted)" }}
      >
        New software guides, comparisons and insights will appear here when they
        are published.
      </p>

      <Link
        href="/products"
        className="site-primary-button mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
      >
        Browse Software
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
