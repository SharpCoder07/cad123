"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  FolderOpen,
  Loader2,
  Package,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type ProductResult = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  rating: number | null;

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

type BrandResult = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
};

type CategoryResult = {
  id: number;
  name: string;
  slug: string;
};

type SearchResults = {
  products: ProductResult[];
  brands: BrandResult[];
  categories: CategoryResult[];
};

const emptyResults: SearchResults = {
  products: [],
  brands: [],
  categories: [],
};

export default function Hero() {
  const [search, setSearch] = useState("");

  const [results, setResults] = useState<SearchResults>(emptyResults);

  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = search.trim();

    if (value.length < 2) {
      setResults(emptyResults);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setOpen(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(value)}`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Search failed");
        }

        setResults({
          products: data.products || [],
          brands: data.brands || [],
          categories: data.categories || [],
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Search failed:", error);

        setResults(emptyResults);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const hasResults =
    results.products.length > 0 ||
    results.brands.length > 0 ||
    results.categories.length > 0;

  function clearSearch() {
    setSearch("");
    setResults(emptyResults);
    setOpen(false);
  }

  return (
    <section
      className="relative overflow-visible text-white"
      style={{
        backgroundColor: "var(--site-secondary)",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 18%, transparent)",
          }}
        />

        <div
          className="absolute bottom-[-180px] right-[-100px] h-[360px] w-[360px] rounded-full blur-[100px]"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 14%, transparent)",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur"
            style={{
              color: "var(--site-accent)",
              borderColor:
                "color-mix(in srgb, var(--site-accent) 25%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--site-accent) 8%, transparent)",
            }}
          >
            <Sparkles size={14} />
            Software Discovery Platform
          </div>

          <h1 className="mt-7 text-4xl font-bold tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Find the right software
            <span
              className="block"
              style={{
                color: "color-mix(in srgb, white 75%, var(--site-primary))",
              }}
            >
              for your business
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Discover, compare and choose CAD, design, engineering and business
            software that fits your needs.
          </p>

          {/* Search */}
          <div
            ref={searchRef}
            className="relative z-50 mx-auto mt-9 max-w-3xl text-left"
          >
            <div
              className="relative rounded-2xl border p-2 shadow-2xl shadow-black/20"
              style={{
                borderColor: "var(--site-border)",
                backgroundColor: "var(--site-background)",
              }}
            >
              <Search
                size={20}
                className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2"
                style={{
                  color: "var(--site-muted)",
                }}
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                onFocus={() => {
                  if (search.trim().length >= 2) {
                    setOpen(true);
                  }
                }}
                placeholder="Search software, brands or categories..."
                aria-label="Search software"
                autoComplete="off"
                className="h-[52px] w-full rounded-xl bg-transparent pl-12 pr-12 text-sm outline-none sm:text-base"
                style={{
                  color: "var(--site-text)",
                }}
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg p-1 transition hover:opacity-70"
                  style={{
                    color: "var(--site-muted)",
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {/* Suggestions */}
            {open && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  borderColor: "var(--site-border)",
                  backgroundColor: "var(--site-background)",
                  color: "var(--site-text)",
                }}
              >
                {loading ? (
                  <div
                    className="flex min-h-[130px] items-center justify-center gap-2 text-sm"
                    style={{
                      color: "var(--site-muted)",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                    Searching...
                  </div>
                ) : hasResults ? (
                  <div className="max-h-[430px] overflow-y-auto p-2">
                    {/* Products */}
                    {results.products.length > 0 && (
                      <div>
                        <SearchHeading>Products</SearchHeading>

                        {results.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--site-surface)]"
                          >
                            <ProductImage product={product} />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--site-text)]">
                                  {product.name}
                                </p>

                                {product.rating !== null && (
                                  <span className="shrink-0 text-xs font-semibold text-amber-500">
                                    ★ {product.rating}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-[var(--site-muted)]">
                                {product.brand.name}

                                {" · "}

                                {product.category.name}
                              </p>
                            </div>

                            <ArrowRight
                              size={15}
                              className="shrink-0 text-gray-300"
                            />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Brands */}
                    {results.brands.length > 0 && (
                      <div className="mt-1 border-t border-[var(--site-border)] pt-1">
                        <SearchHeading>Brands</SearchHeading>

                        {results.brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/products?search=${encodeURIComponent(
                              brand.name,
                            )}`}
                            onClick={() => setOpen(false)}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[var(--site-surface)]"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--site-surface)] text-[var(--site-muted)]">
                              <Building2 size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--site-text)]">
                                {brand.name}
                              </p>

                              <p className="text-xs text-[var(--site-muted)]">
                                Brand
                              </p>
                            </div>

                            <ArrowRight size={14} className="text-gray-300" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {results.categories.length > 0 && (
                      <div className="mt-1 border-t border-[var(--site-border)] pt-1">
                        <SearchHeading>Categories</SearchHeading>

                        {results.categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/products?category=${category.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[var(--site-surface)]"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--site-surface)] text-[var(--site-muted)]">
                              <FolderOpen size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--site-text)]">
                                {category.name}
                              </p>

                              <p className="text-xs text-[var(--site-muted)]">
                                Category
                              </p>
                            </div>

                            <ArrowRight size={14} className="text-gray-300" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[150px] flex-col items-center justify-center px-5 py-8 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <Package size={19} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[var(--site-text)]">
                      No results found
                    </p>

                    <p className="mt-1 text-xs text-[var(--site-muted)]">
                      Try another software, brand or category.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-white/45">
            Type at least 2 characters to see suggestions
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor: "var(--site-primary)",
              }}
            >
              Browse Products
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/compare"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--site-accent) 45%, transparent)",
                color: "var(--site-accent)",
                backgroundColor:
                  "color-mix(in srgb, var(--site-accent) 8%, transparent)",
              }}
            >
              Compare Software
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
      {children}
    </p>
  );
}

function ProductImage({ product }: { product: ProductResult }) {
  const image = product.images[0];

  if (image?.url) {
    return (
      <img
        src={image.url}
        alt={image.altText || product.name}
        className="h-11 w-11 shrink-0 rounded-xl border border-[var(--site-border)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--site-surface)] text-[var(--site-muted)]">
      <Package size={18} />
    </div>
  );
}
