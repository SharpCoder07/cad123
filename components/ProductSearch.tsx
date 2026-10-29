"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Package,
  Building2,
  Layers3,
  Star,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

type ProductSearchProps = {
  initialSearch?: string;
  categorySlug?: string;
};

type SearchProduct = {
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

type SearchBrand = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
};

type SearchCategory = {
  id: number;
  name: string;
  slug: string;
};

type SearchResults = {
  products: SearchProduct[];
  brands: SearchBrand[];
  categories: SearchCategory[];
};

const EMPTY_RESULTS: SearchResults = {
  products: [],
  brands: [],
  categories: [],
};

export default function ProductSearch({
  initialSearch = "",
  categorySlug,
}: ProductSearchProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] =
    useState(initialSearch);

  const [results, setResults] =
    useState<SearchResults>(EMPTY_RESULTS);

  const [loading, setLoading] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  /* ---------------------------------------------
     Sync search input with URL
  --------------------------------------------- */

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  /* ---------------------------------------------
     Close dropdown when clicking outside
  --------------------------------------------- */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ---------------------------------------------
     Live search
  --------------------------------------------- */

  useEffect(() => {
    const value = search.trim();

    if (value.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller =
      new AbortController();

    const timeout = setTimeout(
      async () => {
        try {
          setLoading(true);
          setOpen(true);

          const response = await fetch(
            `/api/search?q=${encodeURIComponent(
              value
            )}`,
            {
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error(
              "Search request failed"
            );
          }

          const data =
            (await response.json()) as SearchResults;

          setResults({
            products: data.products || [],
            brands: data.brands || [],
            categories:
              data.categories || [],
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            return;
          }

          console.error(
            "Product search failed:",
            error
          );

          setResults(EMPTY_RESULTS);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      },
      350
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  /* ---------------------------------------------
     Apply normal text search with Enter
  --------------------------------------------- */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      handleClear();
      return;
    }

    const params =
      new URLSearchParams();

    if (categorySlug) {
      params.set(
        "category",
        categorySlug
      );
    }

    params.set("search", value);

    setOpen(false);

    router.push(
      `/products?${params.toString()}`
    );
  }

  /* ---------------------------------------------
     Clear search
  --------------------------------------------- */

  function handleClear() {
    setSearch("");
    setResults(EMPTY_RESULTS);
    setOpen(false);

    const params =
      new URLSearchParams();

    if (categorySlug) {
      params.set(
        "category",
        categorySlug
      );
    }

    const queryString =
      params.toString();

    router.push(
      queryString
        ? `/products?${queryString}`
        : "/products"
    );
  }

  const hasResults =
    results.products.length > 0 ||
    results.brands.length > 0 ||
    results.categories.length > 0;

  return (
    <div
      ref={searchRef}
      className="relative mt-8 max-w-3xl"
    >
      {/* Search input */}
      <form
        onSubmit={handleSubmit}
        className="relative z-30"
      >
        <div
  className={`product-search-box flex min-h-[62px] items-center border px-2 transition-all duration-200 ${
    open
      ? "rounded-t-2xl"
      : "rounded-2xl"
  }`}
>
          <div
  className="flex h-11 w-11 shrink-0 items-center justify-center"
  style={{ color: "var(--site-muted)" }}
>
  {loading ? (
    <Loader2
      size={20}
      className="animate-spin"
      style={{ color: "var(--site-primary)" }}
    />
  ) : (
    <Search size={20} />
  )}
</div>

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );
            }}
            onFocus={() => {
              if (
                search.trim().length >= 2
              ) {
                setOpen(true);
              }
            }}
            placeholder="Search software, brands or categories..."
            aria-label="Search software, brands or categories"
            autoComplete="off"
            className="product-search-input min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-medium outline-none placeholder:font-normal sm:text-base"
          />

          {search && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              title="Clear search"
              className="product-search-clear flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition"
            >
              <X size={17} />
            </button>
          )}

        </div>
      </form>

      {/* Suggestions */}
      {open &&
        search.trim().length >= 2 && (
          <div className="product-search-dropdown absolute left-0 right-0 top-full z-50 overflow-hidden rounded-b-2xl border border-t-0 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            {loading ? (
              <SearchLoading />
            ) : hasResults ? (
              <div className="max-h-[520px] overflow-y-auto p-2">
                {/* Products */}
                {results.products.length >
                  0 && (
                  <SearchGroup
                    title="Software"
                    icon={
                      <Package
                        size={14}
                      />
                    }
                  >
                    {results.products.map(
                      (product) => (
                        <Link
                          key={
                            product.id
                          }
                          href={`/products/${product.slug}`}
                          onClick={() =>
                            setOpen(
                              false
                            )
                          }
                          className="product-search-result group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition"
                        >
                          <div className="product-search-result-image flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border p-2">
                            {product
                              .images[0]
                              ?.url ? (
                              <img
                                src={
                                  product
                                    .images[0]
                                    .url
                                }
                                alt={
                                  product
                                    .images[0]
                                    .altText ||
                                  product.name
                                }
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Package
  size={20}
  style={{ color: "var(--site-muted)" }}
/>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="product-search-result-title truncate text-sm font-semibold transition">
  {product.name}
</p>

                              {product.rating !==
                                null && (
                                <span
  className="hidden items-center gap-1 text-xs font-semibold sm:flex"
  style={{ color: "var(--site-muted)" }}
>
                                  <Star
                                    size={
                                      11
                                    }
                                    className="fill-amber-400 text-amber-400"
                                  />

                                  {
                                    product.rating
                                  }
                                </span>
                              )}
                            </div>

                            <p
  className="mt-1 truncate text-xs"
  style={{ color: "var(--site-muted)" }}
>
  {product.brand.name}

  <span
    className="mx-1.5"
    style={{
      color: "var(--site-border)",
    }}
  >
    •
  </span>

  {product.category.name}
</p>
                          </div>

                          <ArrowUpRight
  size={15}
  className="product-search-result-arrow shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
/>
                        </Link>
                      )
                    )}
                  </SearchGroup>
                )}

                {/* Brands */}
                {results.brands.length >
                  0 && (
                  <SearchGroup
                    title="Brands"
                    icon={
                      <Building2
                        size={14}
                      />
                    }
                  >
                    {results.brands.map(
                      (brand) => (
                        <Link
                          key={
                            brand.id
                          }
                          href={`/products?search=${encodeURIComponent(
                            brand.name
                          )}`}
                          onClick={() =>
                            setOpen(
                              false
                            )
                          }
                          className="product-search-result group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition"
                        >
                          <div className="product-search-result-image flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border p-1.5">
                            {brand.logo ? (
                              <img
                                src={
                                  brand.logo
                                }
                                alt={`${brand.name} logo`}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Building2
  size={16}
  style={{ color: "var(--site-muted)" }}
/>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="product-search-result-title truncate text-sm font-semibold transition">
  {brand.name}
</p>

                            <p
  className="text-xs"
  style={{ color: "var(--site-muted)" }}
>
  Brand
</p>
                          </div>

                          <ArrowUpRight
  size={14}
  className="product-search-result-arrow transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
/>
                        </Link>
                      )
                    )}
                  </SearchGroup>
                )}

                {/* Categories */}
                {results.categories
                  .length > 0 && (
                  <SearchGroup
                    title="Categories"
                    icon={
                      <Layers3
                        size={14}
                      />
                    }
                  >
                    {results.categories.map(
                      (category) => (
                        <Link
                          key={
                            category.id
                          }
                          href={`/products?category=${encodeURIComponent(
                            category.slug
                          )}`}
                          onClick={() =>
                            setOpen(
                              false
                            )
                          }
                          className="product-search-result group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition"
                        >
                          <div className="product-search-category-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition">
  <Layers3 size={16} />
</div>

                          <div className="min-w-0 flex-1">
                            <p className="product-search-result-title truncate text-sm font-semibold transition">
  {category.name}
</p>

                            <p
  className="text-xs"
  style={{ color: "var(--site-muted)" }}
>
  Category
</p>
                          </div>

                          <ArrowUpRight
  size={14}
  className="product-search-result-arrow transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
/>
                        </Link>
                      )
                    )}
                  </SearchGroup>
                )}

                {/* Full search */}
               <div
  className="mt-2 border-t p-2"
  style={{
    borderColor: "var(--site-border)",
  }}
>
                  <button
                    type="button"
                    onClick={() => {
                      const value =
                        search.trim();

                      if (!value)
                        return;

                      const params =
                        new URLSearchParams();

                      if (
                        categorySlug
                      ) {
                        params.set(
                          "category",
                          categorySlug
                        );
                      }

                      params.set(
                        "search",
                        value
                      );

                      setOpen(false);

                      router.push(
                        `/products?${params.toString()}`
                      );
                    }}
                    className="product-search-all group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition"
                  >
                    <div>
                      <p
  className="text-sm font-semibold"
  style={{ color: "var(--site-text)" }}
>
  Search all products for
</p>

                      <p
  className="mt-0.5 max-w-[260px] truncate text-xs font-medium sm:max-w-md"
  style={{ color: "var(--site-primary)" }}
>
  “{search.trim()}”
</p>
                    </div>

                    <Search
  size={16}
  style={{ color: "var(--site-primary)" }}
/>
                  </button>
                </div>
              </div>
            ) : (
              <NoResults
                search={search}
              />
            )}
          </div>
        )}

      {/* Active search */}
      {initialSearch && !open && (
        <div
  className="mt-3 flex flex-wrap items-center gap-2 text-xs"
  style={{ color: "var(--site-muted)" }}
>
          <span>
            Showing results for
          </span>

          <span className="product-search-chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold">
            “{initialSearch}”

            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear current search"
              className="product-search-chip-clear cursor-pointer rounded-full transition"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

/* =============================================
   Search group
============================================= */

function SearchGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div
  className="flex items-center gap-2 px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em]"
  style={{
    color: "var(--site-muted)",
  }}
>
  {icon}
  {title}
</div>

      {children}
    </div>
  );
}

/* =============================================
   Loading
============================================= */

function SearchLoading() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-3">
        <Loader2
          size={18}
          className="animate-spin"
          style={{
            color: "var(--site-primary)",
          }}
        />

        <div>
          <p
            className="text-sm font-semibold"
            style={{
              color: "var(--site-text)",
            }}
          >
            Searching CADGram
          </p>

          <p
            className="mt-0.5 text-xs"
            style={{
              color: "var(--site-muted)",
            }}
          >
            Finding software, brands and categories...
          </p>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   No results
============================================= */

function NoResults({
  search,
}: {
  search: string;
}) {
  return (
    <div className="px-6 py-9 text-center">
      <div
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "var(--site-surface)",
          color: "var(--site-muted)",
        }}
      >
        <Search size={19} />
      </div>

      <p
        className="mt-3 text-sm font-semibold"
        style={{
          color: "var(--site-text)",
        }}
      >
        No suggestions found
      </p>

      <p
        className="mt-1 text-xs leading-5"
        style={{
          color: "var(--site-muted)",
        }}
      >
        We couldn't find anything matching{" "}
        <span
          className="font-semibold"
          style={{
            color: "var(--site-text)",
          }}
        >
          “{search.trim()}”
        </span>
        .
      </p>

      <p
        className="mt-2 text-xs"
        style={{
          color: "var(--site-muted)",
        }}
      >
        Try another product, brand or category.
      </p>
    </div>
  );
}