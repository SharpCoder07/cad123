"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "react-toastify";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleX,
  GitCompareArrows,
  Layers3,
  Package,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

type CompareProduct = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  rating: number | null;
  reviewCount: number;
  pricing: string | null;
  freeTrial: boolean;
  deployment: string | null;
  supportedPlatforms: string | null;
  targetAudience: string | null;

  brand: {
    name: string;
  };

  category: {
    name: string;
  };

  features: {
    feature: {
      name: string;
    };
  }[];

  pricingPlans: {
    name: string;
    price: number | null;
    billing: string | null;
    currency: string;
  }[];

  specifications: {
    value: string;
    specification: {
      name: string;
    };
  }[];
};

type CompareSelectorProps = {
  products: CompareProduct[];
};

const EMPTY_SLOTS: (number | null)[] = [null, null, null];

export default function CompareSelector({ products }: CompareSelectorProps) {
  const [selectedProducts, setSelectedProducts] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);

  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [productSearch, setProductSearch] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  /* =======================================================
     Read selected products from URL
  ======================================================== */

  useEffect(() => {
    const productSlugs = searchParams.get("products");

    if (!productSlugs) {
      setSelectedProducts([null, null, null]);

      return;
    }

    const slugs = productSlugs.split(",").filter(Boolean);

    /*
      Preserve the exact order supplied in the URL.

      Example:
      ?products=autocad,revit,sketchup

      should stay:
      AutoCAD | Revit | SketchUp
    */
    const productIds = slugs
      .map((slug) => products.find((product) => product.slug === slug)?.id)
      .filter((id): id is number => typeof id === "number")
      .slice(0, 3);

    setSelectedProducts([
      productIds[0] ?? null,
      productIds[1] ?? null,
      productIds[2] ?? null,
    ]);
  }, [searchParams, products]);

  /* =======================================================
     URL sync
  ======================================================== */

  function updateUrl(productIds: (number | null)[]) {
    const selectedSlugs = productIds
      .filter((id): id is number => id !== null)
      .map((id) => products.find((product) => product.id === id)?.slug)
      .filter((slug): slug is string => Boolean(slug));

    const params = new URLSearchParams();

    if (selectedSlugs.length > 0) {
      params.set("products", selectedSlugs.join(","));
    }

    const queryString = params.toString();

    router.replace(queryString ? `/compare?${queryString}` : "/compare", {
      scroll: false,
    });
  }

  /* =======================================================
     Modal
  ======================================================== */

  function openProductModal(slotIndex: number) {
    setActiveSlot(slotIndex);
    setProductSearch("");
    setModalOpen(true);
  }

  function closeProductModal() {
    setModalOpen(false);
    setActiveSlot(null);
    setProductSearch("");
  }

  /* =======================================================
     Select product
  ======================================================== */

  function handleProductSelect(productId: number) {
    if (activeSlot === null) {
      return;
    }

    const alreadySelected = selectedProducts.some(
      (id, index) => id === productId && index !== activeSlot,
    );

    if (alreadySelected) {
      toast.info("This product is already selected.");

      return;
    }

    const updated = [...selectedProducts];

    updated[activeSlot] = productId;

    setSelectedProducts(updated);
    updateUrl(updated);
    closeProductModal();
  }

  /* =======================================================
     Remove
  ======================================================== */

  function handleRemove(slotIndex: number) {
    const updated = [...selectedProducts];

    updated[slotIndex] = null;

    setSelectedProducts(updated);
    updateUrl(updated);
  }

  function handleClearAll() {
    const cleared = [...EMPTY_SLOTS];

    setSelectedProducts(cleared);
    updateUrl(cleared);

    toast.success("Comparison cleared.");
  }

  /* =======================================================
     Selected products
  ======================================================== */

  const selected = selectedProducts
    .filter((id): id is number => id !== null)
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as CompareProduct[];

  /* =======================================================
     Comparison fields
  ======================================================== */

  const allFeatures = Array.from(
    new Set(
      selected.flatMap((product) =>
        product.features.map((item) => item.feature.name),
      ),
    ),
  );

  const allSpecifications = Array.from(
    new Set(
      selected.flatMap((product) =>
        product.specifications.map((item) => item.specification.name),
      ),
    ),
  );

  /* =======================================================
     Modal search
  ======================================================== */

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.brand.name.toLowerCase().includes(search) ||
        product.category.name.toLowerCase().includes(search),
    );
  }, [products, productSearch]);

  return (
    <>
      {/* ===================================================
          SELECTOR WORKSPACE
      ==================================================== */}

      <div className="compare-workspace rounded-[30px] border p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-7">
        {/* Header */}
        <div className="compare-divider flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="compare-primary-icon flex h-9 w-9 items-center justify-center rounded-xl">
                <GitCompareArrows size={17} />
              </div>

              <div>
                <h2 className="compare-title font-bold">Choose products</h2>

                <p className="compare-muted mt-0.5 text-xs">
                  Select up to three products to compare.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="compare-selected-count rounded-full px-3 py-1.5 text-xs font-bold">
              {selected.length}/3 selected
            </span>

            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={13} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Slots */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {selectedProducts.map((productId, slotIndex) => {
            const product = productId
              ? products.find((item) => item.id === productId)
              : null;

            return (
              <div
                key={slotIndex}
                className={`compare-slot relative overflow-hidden rounded-[24px] border transition ${
                  product
                    ? "is-selected shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
                    : "is-empty border-dashed"
                }`}
              >
                {/* Slot number */}
                <div className="absolute left-4 top-4 z-10">
                  <span className="compare-slot-number flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {slotIndex + 1}
                  </span>
                </div>

                {product ? (
                  <div className="flex min-h-[270px] flex-col p-5 pt-14">
                    {/* Logo */}
                    <div className="compare-product-logo flex h-16 w-16 items-center justify-center rounded-2xl border p-2">
                      {product.logo ? (
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="max-h-12 max-w-12 object-contain"
                        />
                      ) : (
                        <span className="compare-muted text-xl font-bold">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="compare-primary-text mt-5 text-[10px] font-bold uppercase tracking-[0.14em]">
                      {product.brand.name}
                    </p>

                    <h3 className="compare-title mt-1 line-clamp-1 text-lg font-bold">
                      {product.name}
                    </h3>

                    <p className="compare-muted mt-1 text-xs">
                      {product.category.name}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      {product.rating !== null ? (
                        <>
                          <Star
                            size={14}
                            className="fill-amber-400 text-amber-400"
                          />

                          <span className="compare-title text-sm font-bold">
                            {product.rating}
                          </span>

                          <span className="compare-muted text-xs">
                            ({product.reviewCount})
                          </span>
                        </>
                      ) : (
                        <span className="compare-muted text-xs">
                          No ratings yet
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex gap-2 pt-5">
                      <button
                        type="button"
                        onClick={() => openProductModal(slotIndex)}
                        className="compare-change-button flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(slotIndex)}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${product.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openProductModal(slotIndex)}
                    className="group flex min-h-[270px] w-full cursor-pointer flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="compare-add-icon flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed transition">
                      <Plus size={24} />
                    </div>

                    <h3 className="compare-add-title mt-4 font-bold transition">
                      Add Product
                    </h3>

                    <p className="compare-muted mt-1 max-w-[170px] text-xs leading-5">
                      Choose software to add to this comparison slot.
                    </p>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================
          EMPTY COMPARISON
      ==================================================== */}

      {selected.length === 0 && (
        <div className="compare-empty mt-6 rounded-[28px] border border-dashed px-6 py-14 text-center">
          <div className="compare-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <GitCompareArrows size={23} />
          </div>

          <h3 className="compare-title mt-5 text-lg font-bold">
            Start your comparison
          </h3>

          <p className="compare-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Add at least one product above. Add two or three to compare software
            side by side.
          </p>
        </div>
      )}

      {/* ===================================================
          COMPARISON
      ==================================================== */}

      {selected.length > 0 && (
        <div className="compare-table-card mt-8 overflow-hidden rounded-[30px] border shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          {/* Comparison heading */}
         <div className="compare-divider flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="compare-primary-text text-xs font-bold uppercase tracking-[0.14em]">
                Comparison
              </p>

              <h2 className="compare-title mt-1 text-2xl font-bold tracking-tight">
                Software Comparison
              </h2>

              <p className="compare-muted mt-1 text-sm">
                Comparing {selected.length}{" "}
                {selected.length === 1 ? "product" : "products"}
              </p>
            </div>

            {selected.length === 1 && (
              <p className="compare-hint max-w-sm rounded-xl px-4 py-3 text-xs leading-5">
  Add another product above to start comparing differences.
</p>
            )}
          </div>

          {/* Mobile hint */}
          <div className="compare-mobile-hint border-b px-5 py-2.5 text-center text-[11px] font-medium sm:hidden">
            Swipe horizontally to view the full comparison →
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              {/* Product header */}
              <thead>
                <tr className="compare-table-header">
                  <th className="compare-sticky-header sticky left-0 z-20 w-[210px] min-w-[210px] border-b border-r px-5 py-5 text-left text-xs font-bold uppercase tracking-[0.1em]">
                    Compare
                  </th>

                  {selected.map((product) => (
                    <th
  key={product.id}
  className="compare-table-cell min-w-[220px] border-b px-5 py-5 text-left"
>
                      <div className="flex items-start gap-3">
                        <div className="compare-product-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border p-1.5">
                          {product.logo ? (
                            <img
                              src={product.logo}
                              alt={product.name}
                              className="max-h-8 max-w-8 object-contain"
                            />
                          ) : (
                            <Package
  size={17}
  className="compare-muted"
/>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="compare-title truncate text-sm font-bold">
                            {product.name}
                          </p>

                          <p className="compare-muted mt-0.5 truncate text-xs font-normal">
                            {product.brand.name}
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              const slotIndex = selectedProducts.findIndex(
                                (id) => id === product.id,
                              );

                              if (slotIndex !== -1) {
                                handleRemove(slotIndex);
                              }
                            }}
                            className="mt-2 cursor-pointer text-[11px] font-semibold text-red-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* General */}
                <ComparisonGroupRow title="General" columns={selected.length} />

                <ComparisonRow
                  label="Brand"
                  values={selected.map((product) => product.brand.name)}
                />

                <ComparisonRow
                  label="Category"
                  values={selected.map((product) => product.category.name)}
                />

                <ComparisonRow
                  label="Rating"
                  values={selected.map((product) =>
                    product.rating !== null ? `${product.rating} / 5` : "N/A",
                  )}
                />

                <ComparisonRow
                  label="Reviews"
                  values={selected.map((product) =>
                    product.reviewCount.toLocaleString("en-IN"),
                  )}
                />

                <ComparisonRow
                  label="Free Trial"
                  values={selected.map((product) =>
                    product.freeTrial ? "Yes" : "No",
                  )}
                  booleanValues={selected.map((product) => product.freeTrial)}
                />

                {/* Product information */}
                <ComparisonGroupRow
                  title="Product Information"
                  columns={selected.length}
                />

                <ComparisonRow
                  label="Deployment"
                  values={selected.map(
                    (product) => product.deployment || "N/A",
                  )}
                />

                <ComparisonRow
                  label="Platforms"
                  values={selected.map(
                    (product) => product.supportedPlatforms || "N/A",
                  )}
                />

                <ComparisonRow
                  label="Target Audience"
                  values={selected.map(
                    (product) => product.targetAudience || "N/A",
                  )}
                />

                {/* Pricing */}
                <ComparisonGroupRow title="Pricing" columns={selected.length} />

                <ComparisonRow
                  label="Pricing"
                  values={selected.map(
                    (product) => product.pricing || "Contact for pricing",
                  )}
                />

                <tr>
                  <ComparisonLabel>Pricing Plans</ComparisonLabel>

                  {selected.map((product) => (
                    <td
                      key={product.id}
                      className="compare-table-cell border-b px-5 py-5 align-top"
                    >
                      {product.pricingPlans.length === 0 ? (
                        <span className="compare-muted text-sm">
                          Contact for pricing
                        </span>
                      ) : (
                        <div className="space-y-3">
                          {product.pricingPlans.map((plan) => (
<div
  key={plan.name}
  className="compare-pricing-plan rounded-xl p-3"
>                              <p className="compare-title text-sm font-bold">
                                {plan.name}
                              </p>

                              {plan.price !== null ? (
                                <p className="compare-muted mt-1 text-xs leading-5">
                                  {formatPlanPrice(plan)}
                                </p>
                              ) : (
                                <p className="compare-muted mt-1 text-xs leading-5">
                                  Contact for pricing
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Specifications */}
                {allSpecifications.length > 0 && (
                  <>
                    <ComparisonGroupRow
                      title="Specifications"
                      columns={selected.length}
                    />

                    {allSpecifications.map((specificationName) => (
                      <ComparisonRow
                        key={specificationName}
                        label={specificationName}
                        values={selected.map((product) => {
                          const specification = product.specifications.find(
                            (item) =>
                              item.specification.name === specificationName,
                          );

                          return specification?.value || "—";
                        })}
                      />
                    ))}
                  </>
                )}

                {/* Features */}
                {allFeatures.length > 0 && (
                  <>
                    <ComparisonGroupRow
                      title="Features"
                      columns={selected.length}
                    />

                    {allFeatures.map((featureName) => (
                      <tr key={featureName}>
                        <ComparisonLabel>{featureName}</ComparisonLabel>

                        {selected.map((product) => {
                          const hasFeature = product.features.some(
                            (item) => item.feature.name === featureName,
                          );

                          return (
                            <td
                              key={product.id}
                              className="compare-table-cell border-b px-5 py-4 text-center"
                            >
                              {hasFeature ? (
                                <CheckCircle2
                                  size={19}
                                  className="mx-auto text-emerald-500"
                                />
                              ) : (
                                <CircleX
  size={18}
  className="compare-unavailable mx-auto"
/>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {/* Product links */}
                <ComparisonGroupRow title="Explore" columns={selected.length} />

                <tr>
                  <ComparisonLabel>Product</ComparisonLabel>

                  {selected.map((product) => (
                    <td
                      key={product.id}
                      className="border-b border-slate-100 px-5 py-5"
                    >
                      <a
                        href={`/products/${product.slug}`}
                        className="compare-product-link inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold transition"
                      >
                        View {product.name}
                        <ArrowRight size={13} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================
          PRODUCT MODAL
      ==================================================== */}

      {modalOpen && (
        <div
          className="compare-modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm"
          onClick={closeProductModal}
        >
          <div
            className="compare-modal flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="compare-divider flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6">
              <div>
                <p className="compare-primary-text text-[10px] font-bold uppercase tracking-[0.15em]">
                  Comparison slot {activeSlot !== null ? activeSlot + 1 : ""}
                </p>

                <h2 className="compare-title mt-1 text-xl font-bold">
                  Choose Product
                </h2>

                <p className="compare-muted mt-1 text-sm">
                  Search by product, brand or category.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProductModal}
                className="compare-modal-close flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="compare-divider border-b p-5 sm:px-6">
              <div className="relative">
                <Search
  size={17}
  className="compare-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
/>

                <input
                  type="text"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search software..."
                  className="compare-search-input h-12 w-full rounded-xl border py-2 pl-11 pr-4 text-sm outline-none transition"
                />
              </div>

              <p className="compare-muted mt-2 text-xs">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {filteredProducts.length > 0 ? (
                <div className="space-y-1">
                  {filteredProducts.map((product) => {
                    const selectedElsewhere = selectedProducts.some(
                      (id, index) => id === product.id && index !== activeSlot,
                    );

                    const currentlySelected =
                      activeSlot !== null &&
                      selectedProducts[activeSlot] === product.id;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={selectedElsewhere}
                        onClick={() => handleProductSelect(product.id)}
                        className={`compare-modal-product flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
  currentlySelected ? "is-selected" : ""
}`}
                      >
                        <div className="compare-product-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border p-1.5">
                          {product.logo ? (
                            <img
                              src={product.logo}
                              alt={product.name}
                              className="max-h-8 max-w-8 object-contain"
                            />
                          ) : (
                            <span className="compare-muted text-sm font-bold">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="compare-title truncate text-sm font-bold">
                            {product.name}
                          </p>

                          <p className="compare-muted mt-0.5 truncate text-xs">
                            {product.brand.name} · {product.category.name}
                          </p>

                          {selectedElsewhere && (
                            <p className="compare-muted mt-1 text-[10px] font-semibold">
                              Already selected
                            </p>
                          )}
                        </div>

                        {currentlySelected && (
                          <div className="compare-selected-check flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white">
  <Check size={14} />
</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <div className="compare-empty-icon mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
                    <Search size={20} />
                  </div>

                  <p className="compare-title mt-4 font-semibold">
  No products found
</p>

<p className="compare-muted mt-1 text-sm">
  Try another product, brand or category.
</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   Comparison Row
========================================================= */

function ComparisonRow({
  label,
  values,
  booleanValues,
}: {
  label: string;
  values: string[];
  booleanValues?: boolean[];
}) {
  return (
    <tr className="compare-row transition">
      <ComparisonLabel>{label}</ComparisonLabel>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="compare-table-cell border-b px-5 py-4 text-sm font-medium"
        >
          {booleanValues ? (
            <div className="flex items-center gap-2">
              {booleanValues[index] ? (
                <CheckCircle2 size={17} className="text-emerald-500" />
              ) : (
                <CircleX
  size={17}
  className="compare-unavailable"
/>
              )}

              <span>{value}</span>
            </div>
          ) : (
            value
          )}
        </td>
      ))}
    </tr>
  );
}

/* =========================================================
   Label Cell
========================================================= */

function ComparisonLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="compare-label sticky left-0 z-10 w-[210px] min-w-[210px] border-b border-r px-5 py-4 text-sm font-semibold">
      {children}
    </td>
  );
}

/* =========================================================
   Group Row
========================================================= */

function ComparisonGroupRow({
  title,
  columns,
}: {
  title: string;
  columns: number;
}) {
  return (
    <tr>
      <td
        colSpan={columns + 1}
        className="compare-group-row border-y px-5 py-3 text-[11px] font-bold uppercase tracking-[0.13em]"
      >
        {title}
      </td>
    </tr>
  );
}

/* =========================================================
   Pricing formatter
========================================================= */

function formatPlanPrice(plan: CompareProduct["pricingPlans"][number]) {
  if (plan.price === null) {
    return "Contact for pricing";
  }

  const currency = plan.currency === "INR" ? "₹" : plan.currency;

  return `${currency}${plan.price.toLocaleString("en-IN")}${
    plan.billing ? ` / ${plan.billing}` : ""
  }`;
}
