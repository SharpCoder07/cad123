import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, PackageOpen } from "lucide-react";

import { prisma } from "@/lib/prisma";

type BrandPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getBrandBySlug(slug: string) {
  return prisma.brand.findUnique({
    where: {
      slug,
    },

    include: {
      products: {
        where: {
          status: "PUBLISHED",
        },

        include: {
          category: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },
        },

        orderBy: {
          name: "asc",
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;

  const brand = await getBrandBySlug(slug);

  if (!brand) {
    return {
      title: "Brand Not Found | CADGram",
    };
  }

  return {
    title: `${brand.name} Software & Products | CADGram`,
    description:
      brand.description ||
      `Explore ${brand.name} software products, features and solutions on CADGram.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  const brand = await getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* =====================================================
          BRAND HERO
      ====================================================== */}
      <section className="brand-detail-hero relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="brand-detail-glow-primary pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="brand-detail-glow-accent pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <Link
            href="/brand"
            className="brand-detail-back group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
              className="shrink-0 transition-transform group-hover:-translate-x-1"
            />

            <span>All Brands</span>
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center lg:gap-12">
            {/* Brand logo */}
            <div className="brand-detail-logo-panel relative flex h-[190px] items-center justify-center overflow-hidden rounded-[28px] border p-7">
              <div
                aria-hidden="true"
                className="brand-detail-logo-glow pointer-events-none absolute h-32 w-32 rounded-full blur-3xl"
              />

              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="relative z-10 max-h-28 max-w-[170px] object-contain"
                />
              ) : (
                <div className="brand-detail-logo-fallback relative z-10 flex h-20 w-20 items-center justify-center rounded-[22px] text-3xl font-bold">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Brand content */}
            <div className="max-w-3xl">
              <div className="brand-detail-eyebrow inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em]">
                Software Brand
              </div>

              <h1
                className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--site-text)" }}
              >
                {brand.name}
              </h1>

              {brand.description ? (
                <p
                  className="mt-4 max-w-3xl text-base leading-7 sm:text-lg"
                  style={{ color: "var(--site-muted)" }}
                >
                  {brand.description}
                </p>
              ) : (
                <p
                  className="mt-4 max-w-3xl text-base leading-7 sm:text-lg"
                  style={{ color: "var(--site-muted)" }}
                >
                  Explore software products and solutions from {brand.name}.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="brand-detail-count inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold">
                  {brand.products.length}{" "}
                  {brand.products.length === 1 ? "product" : "products"}
                </span>

                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-detail-website inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
                  >
                    Visit Official Website
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ====================================================== */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                Products
              </p>

              <h2
                className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--site-text)" }}
              >
                {brand.name} Products
              </h2>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                Explore software and solutions available from {brand.name}.
              </p>
            </div>

            {brand.products.length > 0 && (
              <p className="text-sm" style={{ color: "var(--site-muted)" }}>
                {brand.products.length}{" "}
                {brand.products.length === 1
                  ? "product available"
                  : "products available"}
              </p>
            )}
          </div>

          {brand.products.length === 0 ? (
            <div className="brand-detail-empty rounded-[28px] border border-dashed px-6 py-16 text-center">
              <div className="brand-detail-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                <PackageOpen size={22} />
              </div>

              <h2
                className="mt-5 text-xl font-bold"
                style={{ color: "var(--site-text)" }}
              >
                No products available
              </h2>

              <p
                className="mx-auto mt-2 max-w-md text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                There are currently no software products available from{" "}
                {brand.name}.
              </p>

              <Link
                href="/products"
                className="site-primary-button mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
              >
                Browse All Software
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {brand.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="brand-product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {/* Product visual */}
                  <div className="brand-product-visual relative flex h-48 items-center justify-center overflow-hidden p-6">
                    <div
                      aria-hidden="true"
                      className="brand-product-glow absolute h-24 w-24 rounded-full blur-2xl transition duration-300 group-hover:scale-125"
                    />

                    {product.logo ? (
                      <img
                        src={product.logo}
                        alt={`${product.name} logo`}
                        className="relative z-10 max-h-24 max-w-[150px] object-contain transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="brand-product-fallback relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold transition">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="site-primary-text text-[11px] font-bold uppercase tracking-[0.13em]">
                      {product.category.name}
                    </p>

                    <h3 className="brand-product-title mt-2 text-xl font-bold transition">
                      {product.name}
                    </h3>

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
                      <span className="brand-product-action inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                        View Product
                        <ArrowRight size={14} />
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
