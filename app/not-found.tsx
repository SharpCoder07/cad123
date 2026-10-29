import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Search,
} from "lucide-react";

export default function NotFound() {
  return (
    <main
      className="not-found-page relative min-h-[75vh] overflow-hidden"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="not-found-glow-primary pointer-events-none absolute left-1/2 top-6 h-80 w-80 -translate-x-1/2 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="not-found-glow-accent pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full blur-[100px]"
      />

      <div className="relative mx-auto flex min-h-[75vh] max-w-7xl items-center justify-center px-5 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl text-center">
          {/* 404 */}
          <p className="not-found-number text-7xl font-black tracking-tight sm:text-8xl">
            404
          </p>

          <div className="mt-5 flex justify-center">
            <span className="not-found-badge inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
              Page not found
            </span>
          </div>

          <h1
            className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--site-text)" }}
          >
            This page doesn&apos;t exist.
          </h1>

          <p
            className="mx-auto mt-4 max-w-md text-sm leading-6"
            style={{ color: "var(--site-muted)" }}
          >
            The page may have been moved, removed or the address may
            be incorrect. You can return home or continue exploring
            software on CADGram.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="site-primary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            >
              <Search size={16} />
              Browse Software
            </Link>

            <Link
              href="/"
              className="not-found-secondary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition"
            >
              <Home size={16} />
              Go Home
            </Link>
          </div>

          <Link
            href="/"
            className="not-found-back group mt-6 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold transition"
          >
            <ArrowLeft
              size={13}
              className="shrink-0 transition-transform group-hover:-translate-x-1"
            />
            Back to CADGram
          </Link>
        </div>
      </div>
    </main>
  );
}