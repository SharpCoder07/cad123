import Link from "next/link";
import {
  ArrowLeft,
  GitCompareArrows,
  Sparkles,
} from "lucide-react";

import { getCompareProducts } from "@/lib/data/products";
import CompareSelector from "@/components/CompareSelector";

export default async function ComparePage() {
  const products = await getCompareProducts();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* Hero */}
      <section className="compare-page-hero relative overflow-hidden border-b">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="compare-page-glow-primary absolute -left-40 top-0 h-80 w-80 rounded-full blur-[110px]" />

          <div className="compare-page-glow-accent absolute -right-40 top-10 h-80 w-80 rounded-full blur-[110px]" />

          <div className="compare-page-grid absolute inset-0" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* Back */}
          <Link
            href="/products"
            className="compare-page-back group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-1"
            />

            Browse Products
          </Link>

          {/* Heading */}
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <div className="compare-page-eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <Sparkles size={13} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Software Comparison
              </span>
            </div>

            <div className="compare-page-icon mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg">
              <GitCompareArrows size={23} />
            </div>

            <h1
              className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "var(--site-text)" }}
            >
              Compare software
              <span
                style={{ color: "var(--site-muted)" }}
              >
                {" "}
                side by side.
              </span>
            </h1>

            <p
              className="mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base"
              style={{ color: "var(--site-muted)" }}
            >
              Select up to 3 products and compare
              their features, pricing, specifications
              and other important details in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison workspace */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <CompareSelector products={products} />
      </section>
    </main>
  );
}