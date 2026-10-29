import Link from "next/link";
import { ArrowRight, Building2, Shapes } from "lucide-react";

import { prisma } from "@/lib/prisma";

export default async function BrandPage() {
  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="brands-page-hero relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="brands-page-glow-primary pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="brands-page-glow-accent pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full blur-[110px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="brands-page-eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <Building2 size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Software Brands
              </span>
            </div>

            <h1
              className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "var(--site-text)" }}
            >
              Browse Software Brands
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--site-muted)" }}
            >
              Explore software products from leading technology and engineering
              brands.
            </p>

            {brands.length > 0 && (
              <div className="mt-7">
                <span className="brands-page-count inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold">
                  {brands.length} {brands.length === 1 ? "brand" : "brands"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND DIRECTORY
      ====================================================== */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          {brands.length > 0 ? (
            <>
              <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                    Directory
                  </p>

                  <h2
                    className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{ color: "var(--site-text)" }}
                  >
                    Explore by brand
                  </h2>
                </div>

                <p className="text-sm" style={{ color: "var(--site-muted)" }}>
                  Select a brand to explore its software.
                </p>
              </div>

              <div className="brands-page-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brand/${brand.slug}`}
                    className="brands-page-card group flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-[24px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {/* Logo area */}
                    <div className="brands-page-logo-area relative flex h-32 items-center justify-center overflow-hidden px-6">
                      <div
                        aria-hidden="true"
                        className="brands-page-logo-glow absolute h-24 w-24 rounded-full blur-2xl transition duration-300 group-hover:scale-125"
                      />

                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          className="relative z-10 max-h-16 max-w-[170px] object-contain transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="brands-page-logo-fallback relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold transition-all duration-300 group-hover:scale-105">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="brands-page-card-title text-xl font-bold transition">
                        {brand.name}
                      </h2>

                      {brand.description ? (
                        <p
                          className="mt-2 line-clamp-3 text-sm leading-6"
                          style={{ color: "var(--site-muted)" }}
                        >
                          {brand.description}
                        </p>
                      ) : (
                        <p
                          className="mt-2 text-sm leading-6"
                          style={{ color: "var(--site-muted)" }}
                        >
                          Explore software products and solutions from{" "}
                          {brand.name}.
                        </p>
                      )}

                      <div className="mt-auto pt-5">
                        <span className="brands-page-card-action inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                          View Products
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="brands-page-empty rounded-[28px] border border-dashed px-6 py-16 text-center">
              <div className="brands-page-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                <Shapes size={22} />
              </div>

              <h2
                className="mt-5 text-xl font-bold"
                style={{ color: "var(--site-text)" }}
              >
                No brands available
              </h2>

              <p
                className="mx-auto mt-2 max-w-md text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                Software brands will appear here when they become available.
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
