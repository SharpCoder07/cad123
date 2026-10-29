import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Newspaper,
} from "lucide-react";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
};

type BlogSectionProps = {
  posts: BlogPost[];
};

export default function BlogSection({
  posts,
}: BlogSectionProps) {
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <section
      className="relative overflow-hidden px-5 py-20 text-white sm:px-6 lg:px-8 lg:py-24"
      style={{
        backgroundColor: "var(--site-secondary)",
      }}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute -left-32 top-20 h-72 w-72 rounded-full blur-[100px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 13%, transparent)",
          }}
        />

        <div
          className="absolute -right-32 bottom-0 h-80 w-80 rounded-full blur-[110px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 11%, transparent)",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--site-accent) 28%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--site-accent) 10%, transparent)",
                color: "var(--site-accent)",
              }}
            >
              <Newspaper size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                CADGram Insights
              </span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Insights for smarter{" "}
              <span className="text-white/55">
                software decisions.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
              Guides, comparisons and practical
              insights to help you evaluate and
              choose the right software.
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
          >
            Explore all articles

            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Blog content */}
        {featuredPost ? (
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            {/* Featured Article */}
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="blog-featured-card group relative min-h-[480px] cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-black/10 focus-visible:outline-none focus-visible:ring-2"
            >
              {featuredPost.featuredImage ? (
                <img
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--site-secondary) 82%, white), var(--site-secondary))",
                  }}
                >
                  <FileText
                    size={56}
                    className="text-white/25"
                  />
                </div>
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--site-secondary) 0%, color-mix(in srgb, var(--site-secondary) 62%, transparent) 48%, transparent 100%)",
                }}
              />

              {/* Badge */}
              <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                <span
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--site-secondary) 68%, transparent)",
                  }}
                >
                  Featured Article
                </span>
              </div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                {featuredPost.publishedAt && (
                  <PostDate
                    date={featuredPost.publishedAt}
                  />
                )}

                <h3 className="mt-3 max-w-2xl text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {featuredPost.title}
                </h3>

                {featuredPost.excerpt && (
                  <p className="mt-3 max-w-2xl line-clamp-2 text-sm leading-6 text-white/70 sm:text-base">
                    {featuredPost.excerpt}
                  </p>
                )}

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Read article

                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </Link>

            {/* Side Articles */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {remainingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="blog-side-card group grid min-h-[230px] cursor-pointer overflow-hidden rounded-[24px] border transition focus-visible:outline-none focus-visible:ring-2 sm:block lg:grid lg:grid-cols-[180px_1fr]"
                >
                  {/* Image */}
                  <div className="relative min-h-[180px] overflow-hidden bg-white/5 sm:h-44 lg:h-auto">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText
                          size={28}
                          className="text-white/25"
                        />
                      </div>
                    )}

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, color-mix(in srgb, var(--site-secondary) 35%, transparent), transparent)",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center p-5 lg:p-6">
                    {post.publishedAt && (
                      <PostDate
                        date={post.publishedAt}
                      />
                    )}

                    <h3 className="blog-side-title mt-3 line-clamp-2 text-lg font-bold leading-6 transition">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                        {post.excerpt}
                      </p>
                    )}

                    <div
                      className="mt-4 flex items-center gap-2 text-xs font-semibold"
                      style={{
                        color: "var(--site-accent)",
                      }}
                    >
                      Read article

                      <ArrowUpRight
                        size={14}
                        className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50">
              <Newspaper size={23} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Insights are coming soon
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
              Guides, software comparisons and
              industry insights will appear here
              once articles are published.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PostDate({
  date,
}: {
  date: Date;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-white/50">
      <CalendarDays size={13} />

      <time
        dateTime={new Date(
          date
        ).toISOString()}
      >
        {new Date(
          date
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        )}
      </time>
    </div>
  );
}