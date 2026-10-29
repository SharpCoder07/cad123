import Link from "next/link";
import {
  ArrowRight,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { getProducts, getProductCategories } from "@/lib/data/products";

import ProductSearch from "@/components/ProductSearch";
import ProductSort from "@/components/ProductSort";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;

  const categorySlug = params.category;
  const search = params.search;
  const sort = params.sort;

  const [products, categories] = await Promise.all([
    getProducts(categorySlug, search, sort),
    getProductCategories(),
  ]);

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug,
  );

  const hasFilters = Boolean(categorySlug) || Boolean(search);

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "var(--site-surface)",
      }}
    >
      {/* =====================================================
          Hero / Search
      ====================================================== */}

      <section
        className="relative overflow-visible border-b"
        style={{
          borderColor: "var(--site-border)",
          backgroundColor: "var(--site-background)",
        }}
      >
        {/* Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -left-40 top-0 h-80 w-80 rounded-full blur-[110px]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--site-primary) 10%, transparent)",
            }}
          />

          <div
            className="absolute -right-40 top-20 h-80 w-80 rounded-full blur-[110px]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--site-accent) 8%, transparent)",
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--site-primary) 18%, var(--site-border))",
                backgroundColor:
                  "color-mix(in srgb, var(--site-primary) 8%, var(--site-background))",
                color: "var(--site-primary)",
              }}
            >
              <Sparkles size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Software Directory
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                color: "var(--site-text)",
              }}
            >
              Find software that{" "}
              <span
                style={{
                  color: "var(--site-muted)",
                }}
              >
                fits your workflow.
              </span>
            </h1>

            <p
              className="mt-5 max-w-2xl text-sm leading-7 sm:text-base"
              style={{
                color: "var(--site-muted)",
              }}
            >
              Explore software for design, engineering, architecture and
              business. Compare products, ratings and features to find the right
              solution.
            </p>

            {/* Live Search */}
            <ProductSearch initialSearch={search} categorySlug={categorySlug} />
          </div>
        </div>
      </section>

      {/* =====================================================
          Main Content
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* Category filter */}
        <div
          className="rounded-[24px] border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"
          style={{
            borderColor: "var(--site-border)",
            backgroundColor: "var(--site-background)",
          }}
        >
          <div className="mb-5 flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--site-surface)",
                color: "var(--site-primary)",
              }}
            >
              <SlidersHorizontal size={16} />
            </div>

            <div>
              <h2
                className="text-sm font-bold"
                style={{
                  color: "var(--site-text)",
                }}
              >
                Browse by category
              </h2>

              <p
                className="mt-0.5 text-xs"
                style={{
                  color: "var(--site-muted)",
                }}
              >
                Narrow your software results by category.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* All */}
            <Link
              href={buildProductsUrl({
                search,
                sort,
              })}
              className={`product-category-filter cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !categorySlug ? "is-active" : ""
              }`}
            >
              All Software
            </Link>

            {/* Categories */}
            {categories.map((category) => {
              const active = category.slug === categorySlug;

              return (
                <Link
                  key={category.id}
                  href={buildProductsUrl({
                    category: category.slug,
                    search,
                    sort,
                  })}
                  className={`product-category-filter cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active ? "is-active" : ""
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* =================================================
            Results Toolbar
        ================================================== */}

        <div
          className="mt-8 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"
          style={{
            borderColor: "var(--site-border)",
          }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-xl font-bold tracking-tight sm:text-2xl"
                style={{
                  color: "var(--site-text)",
                }}
              >
                {activeCategory
                  ? activeCategory.name
                  : search
                    ? "Search Results"
                    : "All Software"}
              </h2>

              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: "var(--site-border)",
                  color: "var(--site-muted)",
                }}
              >
                {products.length}
              </span>
            </div>

            <p
              className="mt-1.5 text-sm"
              style={{
                color: "var(--site-muted)",
              }}
            >
              {getResultDescription({
                count: products.length,
                category: activeCategory?.name,
                search,
              })}
            </p>

            {/* Active filters */}
            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className="mr-1 text-xs font-medium"
                  style={{
                    color: "var(--site-muted)",
                  }}
                >
                  Active:
                </span>

                {activeCategory && (
                  <Link
                    href={buildProductsUrl({
                      search,
                      sort,
                    })}
                    className="product-active-filter group inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                  >
                    {activeCategory.name}

                    <X
                      size={12}
                      className="transition group-hover:text-blue-950"
                    />
                  </Link>
                )}

                {search && (
                  <Link
                    href={buildProductsUrl({
                      category: categorySlug,
                      sort,
                    })}
                    className="product-active-filter group inline-flex max-w-[250px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                  >
                    <Search size={11} />

                    <span className="truncate">“{search}”</span>

                    <X size={12} className="shrink-0" />
                  </Link>
                )}

                <Link
                  href="/products"
                  className="product-clear-filters cursor-pointer px-2 py-1.5 text-xs font-semibold transition"
                >
                  Clear all
                </Link>
              </div>
            )}
          </div>

          <ProductSort
            currentSort={sort}
            categorySlug={categorySlug}
            search={search}
          />
        </div>

        {/* =================================================
            Product Grid
        ================================================== */}

        {products.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <NoResults search={search} category={activeCategory?.name} />
        )}
      </section>
    </main>
  );
}

/* =========================================================
   Product Card
========================================================= */

type ProductCardProps = {
  product: Awaited<ReturnType<typeof getProducts>>[number];
};

function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`product-list-card group flex min-h-[410px] cursor-pointer flex-col overflow-hidden rounded-[26px] border-2 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        product.isFeatured
          ? "!border-[#8B5CF6] !bg-[#FAF7FF] shadow-[0_8px_30px_rgba(139,92,246,0.18)] hover:shadow-[0_15px_45px_rgba(139,92,246,0.28)]"
          : "border-transparent hover:shadow-[0_22px_60px_rgba(15,23,42,0.09)]"
      }`}
    >
      {/* Image */}
      <div
        className={`product-list-image relative flex h-[210px] items-center justify-center overflow-hidden border-b p-7 ${
          product.isFeatured ? "!bg-[#F0E9FF]" : ""
        }`}
      >
        {/* Category */}
        <div className="absolute left-4 top-4 z-10">
          <span className="product-list-category rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
            {product.category.name}
          </span>
        </div>

        {/* Featured and Free Trial badges */}
        <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
          {product.isFeatured && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--site-primary) 10%, var(--site-background))",
                borderColor:
                  "color-mix(in srgb, var(--site-primary) 20%, var(--site-border))",
                color: "var(--site-primary)",
              }}
            >
              <Star size={12} className="fill-current" />
              Featured
            </span>
          )}

          {product.freeTrial && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              Free Trial
            </span>
          )}
        </div>

        {image?.url ? (
          <img
            src={image.url}
            alt={image.altText || `${product.name} image`}
            className="max-h-[150px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex flex-col items-center gap-3"
            style={{
              color: "var(--site-muted)",
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
              style={{
                backgroundColor: "var(--site-background)",
              }}
            >
              <Package size={24} />
            </div>

            <span className="text-xs font-medium">No image available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Brand */}
        <p
          className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{
            color: "var(--site-primary)",
          }}
        >
          {product.brand.name}
        </p>

        {/* Product */}
        <h3 className="product-list-title mt-2 line-clamp-1 text-xl font-bold tracking-tight transition">
          {product.name}
        </h3>

        {/* Description */}
        <p
          className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6"
          style={{
            color: "var(--site-muted)",
          }}
        >
          {product.shortDescription ||
            "Explore product features, reviews and software information."}
        </p>

        {/* Rating */}
        <div className="mt-5">
          {product.rating !== null ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={15} className="fill-amber-400 text-amber-400" />

                <span
                  className="text-sm font-bold"
                  style={{
                    color: "var(--site-text)",
                  }}
                >
                  {product.rating}
                </span>
              </div>

              <span
                className="text-xs"
                style={{
                  color: "var(--site-muted)",
                }}
              >
                {product.reviewCount}{" "}
                {product.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            <span
              className="text-xs font-medium"
              style={{
                color: "var(--site-muted)",
              }}
            >
              No ratings yet
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          className="mt-auto flex items-center justify-between border-t pt-5"
          style={{
            borderColor: "var(--site-border)",
          }}
        >
          <span className="product-list-action text-sm font-semibold transition">
            View details
          </span>

          <div className="product-list-arrow flex h-9 w-9 items-center justify-center rounded-full transition-all">
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   No Results
========================================================= */

function NoResults({
  search,
  category,
}: {
  search?: string;
  category?: string;
}) {
  return (
    <div
      className="mt-8 rounded-[30px] border border-dashed px-6 py-16 text-center sm:py-20"
      style={{
        borderColor: "var(--site-border)",
        backgroundColor: "var(--site-background)",
      }}
    >
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "var(--site-surface)",
          color: "var(--site-muted)",
        }}
      >
        <Search size={25} />
      </div>

      <h3
        className="mt-5 text-lg font-bold"
        style={{
          color: "var(--site-text)",
        }}
      >
        No software found
      </h3>

      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{
          color: "var(--site-muted)",
        }}
      >
        {search && category
          ? `We couldn't find software matching “${search}” in ${category}.`
          : search
            ? `We couldn't find software matching “${search}”.`
            : category
              ? `There are currently no software products available in ${category}.`
              : "There are currently no software products available."}
      </p>

      <Link
        href="/products"
        className="site-primary-button mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition"
      >
        View all software
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

/* =========================================================
   URL Helper
========================================================= */

function buildProductsUrl({
  category,
  search,
  sort,
}: {
  category?: string;
  search?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (search) {
    params.set("search", search);
  }

  if (sort) {
    params.set("sort", sort);
  }

  const queryString = params.toString();

  return queryString ? `/products?${queryString}` : "/products";
}

/* =========================================================
   Results Description
========================================================= */

function getResultDescription({
  count,
  category,
  search,
}: {
  count: number;
  category?: string;
  search?: string;
}) {
  const productLabel = count === 1 ? "product" : "products";

  if (category && search) {
    return `${count} ${productLabel} matching “${search}” in ${category}`;
  }

  if (category) {
    return `${count} ${productLabel} in ${category}`;
  }

  if (search) {
    return `${count} ${productLabel} matching “${search}”`;
  }

  return `${count} software ${productLabel} available to explore`;
}
