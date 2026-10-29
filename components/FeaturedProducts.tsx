import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Package,
  Sparkles,
  Star,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  rating: number | null;
  reviewCount: number;
  pricing: string | null;
  freeTrial: boolean;

  brand: {
    name: string;
  };

  category: {
    name: string;
  };

  images: {
    url: string;
    altText: string | null;
  }[];
};

type FeaturedProductsProps = {
  products: Product[];
};

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const featuredProduct = products[0];
  const remainingProducts = products.slice(1);

  return (
    <section
      className="relative overflow-hidden px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
      style={{
        backgroundColor: "var(--site-surface)",
      }}
    >
      {/* Background decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-40 top-20 h-80 w-80 rounded-full blur-[100px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 10%, transparent)",
          }}
        />

        <div
          className="absolute -right-40 bottom-10 h-80 w-80 rounded-full blur-[100px]"
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
              <Sparkles size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Featured Software
              </span>
            </div>

            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              style={{
                color: "var(--site-text)",
              }}
            >
              Software worth{" "}
              <span
                style={{
                  color: "var(--site-muted)",
                }}
              >
                exploring.
              </span>
            </h2>

            <p
              className="mt-4 max-w-xl text-sm leading-7 sm:text-base"
              style={{
                color: "var(--site-muted)",
              }}
            >
              Discover highly rated software for design, engineering and modern
              business workflows.
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: "var(--site-border)",
              backgroundColor: "var(--site-background)",
              color: "var(--site-text)",
            }}
          >
            Explore all software
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              style={{
                color: "var(--site-primary)",
              }}
            />
          </Link>
        </div>

        {featuredProduct ? (
          <div className="grid gap-5 lg:grid-cols-[1.05fr_1.45fr]">
            {/* Main Featured Product */}
            <FeaturedProductCard product={featuredProduct} />

            {/* Other Products */}
            <div className="grid gap-5 sm:grid-cols-2">
              {remainingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   Main Featured Product
========================================================= */

function FeaturedProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex min-h-[520px] cursor-pointer flex-col overflow-hidden rounded-[30px] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
      style={{
        backgroundColor: "var(--site-secondary)",
      }}
    >
      {/* Background effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-[90px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 22%, transparent)",
          }}
        />

        <div
          className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-[80px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 16%, transparent)",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur"
          style={{
            borderColor:
              "color-mix(in srgb, var(--site-accent) 25%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 10%, transparent)",
            color: "var(--site-accent)",
          }}
        >
          <BadgeCheck size={14} />
          Top Rated
        </span>

        {product.freeTrial && (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            Free Trial
          </span>
        )}
      </div>

      {/* Product visual */}
      <div className="relative z-10 my-8 flex min-h-[210px] flex-1 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm">
        {image?.url ? (
          <img
            src={image.url}
            alt={image.altText || `${product.name} image`}
            className="max-h-[190px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Package size={42} />

            <span className="text-sm font-semibold">{product.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{
              color: "var(--site-accent)",
            }}
          >
            {product.brand.name}
          </span>

          <span className="text-slate-600">•</span>

          <span className="text-xs font-medium text-white/55">
            {product.category.name}
          </span>
        </div>

        <h3 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/60">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <ProductRating product={product} dark />

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            View product
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   Smaller Product Card
========================================================= */

function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="featured-product-small-card group flex min-h-[285px] cursor-pointer flex-col rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-2.5">
          {image?.url ? (
            <img
              src={image.url}
              alt={image.altText || `${product.name} image`}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Package size={23} className="text-[var(--site-muted)]" />
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {product.freeTrial && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Free Trial
            </span>
          )}

          <ArrowUpRight
            size={18}
            className="product-card-arrow transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: "var(--site-primary)",
          }}
        >
          {product.brand.name}
        </p>

        <h3 className="product-card-title mt-2 line-clamp-1 text-lg font-bold transition">
          {product.name}
        </h3>

        {product.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--site-muted)]">
            {product.shortDescription}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
            Explore features, reviews and product information.
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--site-border)] pt-4">
        <ProductRating product={product} />

        <span className="max-w-[120px] truncate text-xs font-medium text-[var(--site-muted)]">
          {product.category.name}
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   Rating
========================================================= */

function ProductRating({
  product,
  dark = false,
}: {
  product: Product;
  dark?: boolean;
}) {
  if (product.rating === null) {
    return (
      <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
        No ratings yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Star size={15} className="fill-amber-400 text-amber-400" />

        <span
          className={`text-sm font-bold ${
            dark ? "text-white" : "text-[var(--site-text)]"
          }`}
        >
          {product.rating}
        </span>
      </div>

      <span
        className={`text-xs ${
          dark ? "text-slate-500" : "text-[var(--site-muted)]"
        }`}
      >
        {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
      </span>
    </div>
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
        backgroundColor: "var(--site-background)",
      }}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--site-surface)] text-[var(--site-muted)]">
        <Package size={24} />
      </div>

      <h3 className="mt-4 font-semibold text-[var(--site-text)]">
        No featured software
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--site-muted)]">
        Featured software will appear here once products are available.
      </p>

      <Link
        href="/products"
        className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition hover:opacity-75"
        style={{
          color: "var(--site-primary)",
        }}
      >
        Browse software
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
