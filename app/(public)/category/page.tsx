import Link from "next/link";
import {
  ArrowRight,
  FolderOpen,
  Layers3,
} from "lucide-react";

import { getProductCategories } from "@/lib/data/products";

export default async function CategoryPage() {
  const categories = await getProductCategories();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* Hero */}
      <section className="category-page-hero relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="category-page-glow-primary pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="category-page-glow-accent pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full blur-[110px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="category-page-eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <Layers3 size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Explore Software
              </span>
            </div>

            <h1
              className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "var(--site-text)" }}
            >
              Software Categories
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--site-muted)" }}
            >
              Browse software by category and find solutions that match your
              business and technical requirements.
            </p>

            {categories.length > 0 && (
              <div className="mt-7 flex items-center gap-2">
                <span className="category-page-count rounded-full px-3 py-1.5 text-xs font-semibold">
                  {categories.length}{" "}
                  {categories.length === 1
                    ? "category"
                    : "categories"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          {categories.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="category-page-card group relative flex min-h-[245px] cursor-pointer flex-col overflow-hidden rounded-[24px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {/* Subtle card accent */}
                  <div
                    aria-hidden="true"
                    className={`category-page-card-accent absolute left-0 top-0 h-1 w-full ${
                      index % 3 === 1
                        ? "is-accent"
                        : index % 3 === 2
                          ? "is-accent-2"
                          : "is-primary"
                    }`}
                  />

                  <div className="category-page-card-icon flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold transition-all duration-300 group-hover:scale-105">
                    {category.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="mt-5">
                    <h2 className="category-page-card-title text-lg font-bold transition">
                      {category.name}
                    </h2>

                    {category.description ? (
                      <p
                        className="mt-2 line-clamp-3 text-sm leading-6"
                        style={{ color: "var(--site-muted)" }}
                      >
                        {category.description}
                      </p>
                    ) : (
                      <p
                        className="mt-2 text-sm leading-6"
                        style={{ color: "var(--site-muted)" }}
                      >
                        Explore software available in this category.
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-5">
                    <span className="category-page-card-action inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                      View Products
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="category-page-empty rounded-[28px] border border-dashed px-6 py-16 text-center">
              <div className="category-page-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                <FolderOpen size={22} />
              </div>

              <h2
                className="mt-5 text-xl font-bold"
                style={{ color: "var(--site-text)" }}
              >
                No categories available
              </h2>

              <p
                className="mx-auto mt-2 max-w-md text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                Software categories will appear here when they become
                available.
              </p>

              <Link
                href="/products"
                className="site-primary-button mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
              >
                Browse Software
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}