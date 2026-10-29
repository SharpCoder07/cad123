"use client";

import {
  AlertTriangle,
  RefreshCw,
  Home,
} from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <main
      className="error-page relative min-h-[70vh] overflow-hidden"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="error-page-glow-primary pointer-events-none absolute left-1/2 top-8 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]"
      />

      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg text-center">
          {/* Icon */}
          <div className="error-page-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
            <AlertTriangle size={28} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-red-500">
            Something went wrong
          </p>

          <h1
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--site-text)" }}
          >
            We couldn&apos;t load this page.
          </h1>

          <p
            className="mx-auto mt-4 max-w-md text-sm leading-6"
            style={{ color: "var(--site-muted)" }}
          >
            An unexpected error occurred while loading this content. You can
            try again or return to the homepage.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="site-primary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <Link
              href="/"
              className="error-page-secondary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition"
            >
              <Home size={16} />
              Go Home
            </Link>
          </div>

          {/* Development-only error detail */}
          {process.env.NODE_ENV === "development" && error?.message && (
            <div className="mt-8 rounded-xl border border-red-100 bg-red-50/60 p-4 text-left">
              <p className="text-xs font-bold text-red-700">
                Development error
              </p>

              <p className="mt-2 break-words font-mono text-xs leading-5 text-red-600">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}