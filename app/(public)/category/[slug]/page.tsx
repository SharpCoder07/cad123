import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductCategories, getProducts } from "@/lib/data/products";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const categories = await getProductCategories();

  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return {
      title: "Category Not Found | CADGram",
    };
  }

  return {
    title: `${category.name} Software - Products & Solutions | CADGram`,
    description:
      category.description ||
      `Explore ${category.name} software, compare products and find the right solution for your business.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const categories = await getProductCategories();

  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const products = await getProducts(slug);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="category-detail-hero relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="category-detail-glow-primary pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="category-detail-glow-accent pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full blur-[110px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <Link
            href="/category"
            className="category-detail-back group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
              className="shrink-0 transition-transform group-hover:-translate-x-1"
            />

            <span>All Categories</span>
          </Link>

          <div className="mt-9 max-w-3xl">
            <div className="category-detail-eyebrow inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em]">
              Software Category
            </div>

            <h1
              className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "var(--site-text)" }}
            >
              {category.name}
            </h1>

            {category.description ? (
              <p
                className="mt-4 max-w-2xl text-base leading-7 sm:text-lg"
                style={{ color: "var(--site-muted)" }}
              >
                {category.description}
              </p>
            ) : (
              <p
                className="mt-4 max-w-2xl text-base leading-7 sm:text-lg"
                style={{ color: "var(--site-muted)" }}
              >
                Explore software products and solutions available in{" "}
                {category.name}.
              </p>
            )}

            <div className="mt-7">
              <span className="category-detail-count inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ====================================================== */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                Products
              </p>

              <h2
                className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--site-text)" }}
              >
                {category.name} Software
              </h2>
            </div>

            {products.length > 0 && (
              <p className="text-sm" style={{ color: "var(--site-muted)" }}>
                Showing {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </p>
            )}
          </div>

          {products.length === 0 ? (
            <div className="category-detail-empty rounded-[28px] border border-dashed px-6 py-16 text-center">
              <div className="category-detail-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold">
                {category.name.charAt(0).toUpperCase()}
              </div>

              <h2
                className="mt-5 text-xl font-bold"
                style={{ color: "var(--site-text)" }}
              >
                No products found
              </h2>

              <p
                className="mx-auto mt-2 max-w-md text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                There are currently no products available in the {category.name}{" "}
                category.
              </p>

              <Link
                href="/products"
                className="site-primary-button mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition"
              >
                Browse All Software
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="category-product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {/* Product visual */}
                  <div className="category-product-visual relative flex h-48 items-center justify-center overflow-hidden p-6">
                    <div
                      aria-hidden="true"
                      className="category-product-glow absolute h-24 w-24 rounded-full blur-2xl transition duration-300 group-hover:scale-125"
                    />

                    {product.logo ? (
                      <img
                        src={product.logo}
                        alt={`${product.name} logo`}
                        className="relative z-10 max-h-24 max-w-[150px] object-contain transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="category-product-fallback relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold transition">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="site-primary-text text-[11px] font-bold uppercase tracking-[0.13em]">
                      {product.brand.name}
                    </p>

                    <h2 className="category-product-title mt-2 text-xl font-bold transition">
                      {product.name}
                    </h2>

                    {product.shortDescription && (
                      <p
                        className="mt-2 line-clamp-2 text-sm leading-6"
                        style={{ color: "var(--site-muted)" }}
                      >
                        {product.shortDescription}
                      </p>
                    )}

                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-amber-400">★</span>

                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--site-text)" }}
                      >
                        {product.rating ?? "N/A"}
                      </span>

                      <span
                        className="text-xs"
                        style={{ color: "var(--site-muted)" }}
                      >
                        ({product.reviewCount})
                      </span>
                    </div>

                    <div
                      className="mt-auto border-t pt-5"
                      style={{ borderColor: "var(--site-border)" }}
                    >
                      <span className="category-product-action inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                        View Product
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
