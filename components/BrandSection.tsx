import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
} from "lucide-react";

type Brand = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
};

type BrandSectionProps = {
  brands: Brand[];
};

export default function BrandSection({
  brands,
}: BrandSectionProps) {
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
          className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 7%, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-[0.18em]"
              style={{
                color: "var(--site-primary)",
              }}
            >
              Software Brands
            </p>

            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              style={{
                color: "var(--site-text)",
              }}
            >
              Technology behind{" "}
              <span
                style={{
                  color: "var(--site-muted)",
                }}
              >
                great work.
              </span>
            </h2>

            <p
              className="mt-4 max-w-2xl text-sm leading-7 sm:text-base"
              style={{
                color: "var(--site-muted)",
              }}
            >
              Discover software from established
              design, engineering and business
              technology brands.
            </p>
          </div>

          <Link
            href="/brand"
            className="brand-header-link group inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            View all brands

            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {brands.length > 0 ? (
          <div
            className="overflow-hidden rounded-[32px] border shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
            style={{
              borderColor: "var(--site-border)",
              backgroundColor: "var(--site-surface)",
            }}
          >
            {/* Logo wall */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {brands.map((brand) => (
                <BrandLogo
                  key={brand.id}
                  brand={brand}
                />
              ))}
            </div>

            {/* Bottom CTA */}
            <div
              className="border-t px-6 py-5 sm:px-8"
              style={{
                borderColor: "var(--site-border)",
                backgroundColor: "var(--site-background)",
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--site-primary) 8%, transparent)",
                      color: "var(--site-primary)",
                    }}
                  >
                    <Building2 size={18} />
                  </div>

                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: "var(--site-text)",
                      }}
                    >
                      Explore the complete brand
                      directory
                    </p>

                    <p
                      className="mt-0.5 text-xs"
                      style={{
                        color: "var(--site-muted)",
                      }}
                    >
                      Browse brands and discover
                      their software products.
                    </p>
                  </div>
                </div>

                <Link
                  href="/brand"
                  className="brand-primary-link group inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold transition"
                >
                  Browse brands

                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
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
   Brand Logo
========================================================= */

function BrandLogo({
  brand,
}: {
  brand: Brand;
}) {
  return (
    <Link
      href={`/brand/${brand.slug}`}
      aria-label={`Explore ${brand.name}`}
      className="brand-logo-card group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center border-b border-r p-6 text-center transition-all duration-300 hover:z-10 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      {/* Logo */}
      <div className="flex h-16 w-full items-center justify-center">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={`${brand.name} logo`}
            className="max-h-12 max-w-[130px] object-contain transition-all duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="brand-logo-fallback flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold transition-all duration-300">
            {brand.name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      <h3 className="brand-logo-name mt-5 line-clamp-1 text-sm font-semibold transition">
        {brand.name}
      </h3>

      {/* Hover action */}
      <div className="brand-logo-action mt-2 flex translate-y-1 items-center gap-1 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        Explore

        <ArrowUpRight size={12} />
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
      className="rounded-[30px] border border-dashed px-6 py-16 text-center"
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
        <Building2 size={24} />
      </div>

      <h3
        className="mt-4 font-semibold"
        style={{
          color: "var(--site-text)",
        }}
      >
        No brands available
      </h3>

      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{
          color: "var(--site-muted)",
        }}
      >
        Software brands will appear here once
        they are available.
      </p>
    </div>
  );
}