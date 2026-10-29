
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  GitCompareArrows,
  Info,
  Loader2,
  Package,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function NewProductAlternativePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const alternativesUrl =
    `/admin/products/${productId}/alternatives`;

  const [products, setProducts] = useState<Product[]>([]);
  const [alternativeId, setAlternativeId] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          "/api/admin/products",
          {
            cache: "no-store",
            signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load products."
          );
        }

        if (signal?.aborted) return;

        const availableProducts: Product[] = (
          Array.isArray(data.products)
            ? data.products
            : []
        ).filter(
          (product: Product) =>
            product.id !== Number(productId)
        );

        setProducts(availableProducts);
      } catch (error) {
        if (signal?.aborted) return;

        console.error("Load products error:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadProducts(controller.signal);

    return () => controller.abort();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search]);

  const selectedProduct = products.find(
    (product) => String(product.id) === alternativeId
  );

  const isValidSelection = Boolean(selectedProduct);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || loading) return;

    if (!selectedProduct) {
      toast.error("Please select an alternative product.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/alternatives`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alternativeId: selectedProduct.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to add alternative product."
        );
        return;
      }

      toast.success(
        "Alternative product added successfully."
      );

      router.push(alternativesUrl);
      router.refresh();
    } catch (error) {
      console.error(
        "Add alternative product error:",
        error
      );

      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9297A4]"
          >
            <Link
              href="/admin/products"
              className="cursor-pointer hover:text-gray-900"
            >
              Products
            </Link>

            <ChevronRight size={14} />

            <Link
              href={alternativesUrl}
              className="cursor-pointer hover:text-gray-900"
            >
              Alternatives
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-[#252B37]">
              Add Alternative
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <GitCompareArrows size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Alternative Product
              </h1>

              <p className="mt-1 text-[13px] leading-5 text-[#77808E]">
                Select an existing product to recommend as
                an alternative.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={alternativesUrl}
          className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#EAE7EF] bg-white px-3.5 text-[13px] font-medium text-[#525A68] transition hover:bg-[#F8F5FC]"
        >
          <ArrowLeft size={17} />
          Back to Alternatives
        </Link>
      </section>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        <div className="min-w-0 space-y-5">
          {/* Product Selection */}
          <section className={cardClass}>
            <SectionHeading
              icon={<Package size={19} />}
              title="Select Alternative Product"
              description="Choose one product from your existing product catalog."
            />

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="product-search"
                  className="text-[13px] font-semibold text-[#414A58]"
                >
                  Alternative Product{" "}
                  <span className="text-red-500">*</span>
                </label>

                {!loading && !loadError && (
                  <span className="text-xs text-[#9298A5]">
                    {products.length} available
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="product-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products by name or slug..."
                  disabled={loading || saving || !!loadError}
                  className="h-10 w-full rounded-[10px] border border-[#EAE7EF] bg-[#FCFBFE] pl-10 pr-10 text-[13px] text-[#252B37] outline-none transition placeholder:text-[#9A9BA8] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    disabled={saving}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#818998] transition hover:bg-[#F0EBFA] hover:text-[#8065B0] disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Product List */}
              <div className="mt-4 overflow-hidden rounded-[14px] border border-[#EAE7EF]">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map(
                      (_, index) => (
                        <div
                          key={index}
                          className="flex animate-pulse items-center gap-3 rounded-xl p-3"
                        >
                          <div className="h-11 w-11 rounded-xl bg-[#F3F0F8]" />

                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/3 rounded bg-[#EAE7EF]" />
                            <div className="h-3 w-1/3 rounded bg-[#F3F0F8]" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : loadError ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                    <AlertCircle
                      size={27}
                      className="text-red-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#252B37]">
                      Unable to load products
                    </p>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-[#818998]">
                      {loadError}
                    </p>

                    <button
                      type="button"
                      onClick={() => void loadProducts()}
                      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#403948]"
                    >
                      <RefreshCw size={14} />
                      Try Again
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F0F8] text-gray-400">
                      <Search size={21} />
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-[#252B37]">
                      {products.length === 0
                        ? "No products available"
                        : "No matching products"}
                    </h3>

                    <p className="mt-2 max-w-xs text-xs leading-5 text-[#818998]">
                      {products.length === 0
                        ? "Create another product before adding an alternative."
                        : "Try searching with another product name or slug."}
                    </p>

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="mt-4 cursor-pointer text-xs font-semibold text-[#252B37] underline underline-offset-4"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label="Alternative product"
                    className="max-h-[430px] space-y-1 overflow-y-auto p-2"
                  >
                    {filteredProducts.map((product) => {
                      const selected =
                        alternativeId === String(product.id);

                      return (
                        <label
                          key={product.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-3 py-2.5 transition ${
                            selected
                              ? "border-[#B49BD6] bg-[#F8F4FD]"
                              : "border-transparent hover:border-[#E5D9F2] hover:bg-[#FCFAFE]"
                          } ${
                            saving
                              ? "pointer-events-none opacity-60"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="alternativeId"
                            value={product.id}
                            checked={selected}
                            onChange={() =>
                              setAlternativeId(
                                String(product.id)
                              )
                            }
                            disabled={saving}
                            className="sr-only"
                          />

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#EDE4F7] text-[15px] font-semibold text-[#8065B0]">
                            {product.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#252B37]">
                              {product.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#9298A5]">
                              {product.slug}
                            </p>
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#8065B0] bg-[#8065B0] text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selected && (
                              <Check
                                size={12}
                                strokeWidth={3}
                              />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {!loading && !loadError && (
                <p className="mt-3 text-xs leading-5 text-[#818998]">
                  Showing {filteredProducts.length} of{" "}
                  {products.length} available products.
                  The current product is excluded.
                </p>
              )}
            </div>
          </section>

          {/* Selected Product */}
          {selectedProduct && (
            <section className={cardClass}>
              <SectionHeading
                icon={<CheckCircle2 size={19} />}
                title="Selected Product"
                description="Review the product before adding it as an alternative."
              />

              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-2xl border border-[#EAE7EF] bg-[#FCFAFE] p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#EDE4F7] text-lg font-semibold text-[#8065B0]">
                    {selectedProduct.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-[#252B37]">
                      {selectedProduct.name}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#818998]">
                      {selectedProduct.slug}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={14} />
                      Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAlternativeId("")}
                    disabled={saving}
                    aria-label="Clear selected product"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#7D8390] transition hover:bg-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={alternativesUrl}
              onClick={(event) => {
                if (saving) event.preventDefault();
              }}
              className={`inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-[13px] font-semibold text-[#414A58] transition hover:bg-[#FCFAFE] ${
                saving
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                loading ||
                !!loadError ||
                !isValidSelection
              }
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Alternative
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Preview */}
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#F0EDF4] px-5 py-4">
              <h2 className="text-sm font-bold text-[#252B37]">
                Selection Preview
              </h2>

              <span className="rounded-lg bg-[#F0EBFA] px-2 py-1 text-[10px] font-semibold text-[#8065B0]">
                Live
              </span>
            </div>

            <div className="p-5">
              {selectedProduct ? (
                <div className="rounded-[14px] border border-[#EAE7EF] bg-[#FCFAFE] p-4">
                  <div className="flex h-24 items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EDE4F7] text-xl font-semibold text-[#8065B0]">
                      {selectedProduct.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 text-center">
                    <p className="break-words text-sm font-bold text-[#252B37]">
                      {selectedProduct.name}
                    </p>

                    <p className="mt-1 break-all text-xs text-[#9298A5]">
                      {selectedProduct.slug}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDD2EC] bg-[#FCFAFE] p-5 text-center">
                  <Package
                    size={26}
                    className="text-gray-300"
                  />

                  <p className="mt-3 text-xs leading-5 text-gray-400">
                    Select a product to see its preview.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Form Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-[#677080]"
              />

              <h2 className="text-sm font-bold text-[#252B37]">
                Form Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-[#818998]">
                Required fields
              </span>

              <span className="text-sm font-bold text-[#252B37]">
                {isValidSelection ? "1/1" : "0/1"}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3F0F8]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isValidSelection
                    ? "w-full bg-[#8065B0]"
                    : "w-0 bg-[#8065B0]"
                }`}
              />
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  isValidSelection
                    ? "bg-[#EFF9F3] text-[#278455]"
                    : "bg-[#F3F0F8] text-gray-400"
                }`}
              >
                {isValidSelection ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                )}
              </span>

              <span className="text-xs text-[#677080]">
                Alternative product selected
              </span>
            </div>
          </section>

          {/* Information */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <Info size={18} className="text-[#677080]" />

              <h2 className="text-sm font-bold text-[#252B37]">
                Important Information
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <InfoRow
                icon={<ShieldCheck size={16} />}
                text="The selected product will be linked as an alternative."
              />

              <InfoRow
                icon={<CircleHelp size={16} />}
                text="The current product cannot be its own alternative."
              />

              <InfoRow
                icon={<GitCompareArrows size={16} />}
                text="Removing an alternative later will not delete the product."
              />
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#F0EDF4] px-5 py-4 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-[15px] font-semibold text-[#252B37]">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#818998]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gray-400">
        {icon}
      </span>

      <p className="text-xs leading-6 text-[#818998]">
        {text}
      </p>
    </div>
  );
}
