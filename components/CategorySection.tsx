import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Layers3,
  Sparkles,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

type CategorySectionProps = {
  categories: Category[];
};

export default function CategorySection({
  categories,
}: CategorySectionProps) {
  const primaryCategories = categories.slice(0, 2);
  const otherCategories = categories.slice(2);

  return (
    <section
      className="relative overflow-hidden px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
      style={{
        backgroundColor: "var(--site-background)",
      }}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute -left-40 top-20 h-80 w-80 rounded-full blur-[110px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 10%, transparent)",
          }}
        />

        <div
          className="absolute -right-40 bottom-0 h-80 w-80 rounded-full blur-[110px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 9%, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--site-primary) 18%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--site-primary) 7%, transparent)",
                color: "var(--site-primary)",
              }}
            >
              <Layers3 size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Explore Categories
              </span>
            </div>

            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              style={{
                color: "var(--site-text)",
              }}
            >
              Find software by{" "}
              <span
                style={{
                  color: "var(--site-muted)",
                }}
              >
                what you need.
              </span>
            </h2>

            <p
              className="mt-4 max-w-xl text-sm leading-7 sm:text-base"
              style={{
                color: "var(--site-muted)",
              }}
            >
              Browse software by category and discover tools
              built for your workflow, industry and business
              requirements.
            </p>
          </div>

          <Link
            href="/category"
            className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: "var(--site-border)",
              backgroundColor: "var(--site-background)",
              color: "var(--site-text)",
            }}
          >
            Browse all categories

            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              style={{
                color: "var(--site-primary)",
              }}
            />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-5">
            {/* Featured Categories */}
            {primaryCategories.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">
                {primaryCategories.map(
                  (category, index) => (
                    <FeaturedCategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                    />
                  )
                )}
              </div>
            )}

            {/* Other Categories */}
            {otherCategories.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherCategories.map(
                  (category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      index={index + 2}
                    />
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   Featured Category
========================================================= */

function FeaturedCategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative min-h-[300px] cursor-pointer overflow-hidden rounded-[30px] p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
      style={{
        backgroundColor: "var(--site-secondary)",
      }}
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[80px]"
          style={{
            backgroundColor:
              index === 0
                ? "color-mix(in srgb, var(--site-primary) 28%, transparent)"
                : "color-mix(in srgb, var(--site-accent) 25%, transparent)",
          }}
        />

        <div
          className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full blur-[70px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent-2) 12%, transparent)",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>

      <div className="relative z-10 flex h-full min-h-[236px] flex-col">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-bold backdrop-blur-sm"
            style={{
              borderColor:
                "color-mix(in srgb, white 12%, transparent)",
              backgroundColor:
                "color-mix(in srgb, white 10%, transparent)",
              color: "var(--site-accent)",
            }}
          >
            {category.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition-all group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white">
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-auto pt-10">
          <div
            className="mb-3 flex items-center gap-2"
            style={{
              color: "var(--site-accent)",
            }}
          >
            <Sparkles size={13} />

            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
              Featured Category
            </span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {category.name}
          </h3>

          <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
            {category.description ||
              "Discover software solutions, compare products and find the right tools for your requirements."}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white">
            Explore category

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   Standard Category
========================================================= */

function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const number = String(index + 1).padStart(
    2,
    "0"
  );

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex min-h-[220px] cursor-pointer flex-col overflow-hidden rounded-[24px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderColor: "var(--site-border)",
        backgroundColor: "var(--site-background)",
      }}
    >
      {/* Subtle decoration */}
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--site-primary) 10%, transparent)",
        }}
      />

      {/* Top */}
      <div className="relative flex items-start justify-between">
        <div
  className="category-card-icon flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold transition-all group-hover:scale-105"
>
  {category.name
    .charAt(0)
    .toUpperCase()}
</div>

        <span
          className="text-xs font-bold tracking-wider"
          style={{
            color:
              "color-mix(in srgb, var(--site-muted) 55%, transparent)",
          }}
        >
          {number}
        </span>
      </div>

      {/* Content */}
      <div className="relative mt-7 flex flex-1 flex-col">
        <h3
          className="text-lg font-bold transition"
          style={{
            color: "var(--site-text)",
          }}
        >
          {category.name}
        </h3>

        <p
          className="mt-2 line-clamp-2 text-sm leading-6"
          style={{
            color: "var(--site-muted)",
          }}
        >
          {category.description ||
            "Discover software solutions and compare products in this category."}
        </p>

        <div
          className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold"
          style={{
            color: "var(--site-primary)",
          }}
        >
          Explore

          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   Empty State
========================================================= */

function EmptyState() {
  return (
    <div
      className="rounded-[28px] border border-dashed px-6 py-16 text-center"
      style={{
        borderColor: "var(--site-border)",
        backgroundColor: "var(--site-surface)",
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
        style={{
          backgroundColor: "var(--site-background)",
          color: "var(--site-muted)",
        }}
      >
        <Boxes size={24} />
      </div>

      <h3
        className="mt-4 font-semibold"
        style={{
          color: "var(--site-text)",
        }}
      >
        No categories available
      </h3>

      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{
          color: "var(--site-muted)",
        }}
      >
        Software categories will appear here once
        they are available.
      </p>
    </div>
  );
}