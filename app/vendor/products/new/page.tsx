"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  Info,
  Layers3,
  LoaderCircle,
  Package,
  PackagePlus,
  Save,
  ShieldCheck,
  Tag,
  Wallet,
} from "lucide-react";

import { toast } from "react-toastify";

type Option = {
  id: number;
  name: string;
};

type ProductOptionsResponse = {
  success?: boolean;
  brands?: Option[];
  categories?: Option[];
  message?: string;
};

type CreateProductResponse = {
  success?: boolean;
  message?: string;
  product?: {
    id: number;
  };
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFD] px-4 py-3 text-sm text-[#1F2430] outline-none transition placeholder:text-gray-400 focus:border-[#A78BD6] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass = "mb-2 block text-[13px] font-semibold text-[#44414C]";

const sectionClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)] sm:p-6";

export default function NewVendorProductPage() {
  const router = useRouter();

  const [brands, setBrands] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [pricing, setPricing] = useState("");
  const [freeTrial, setFreeTrial] = useState(false);

  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);

        const response = await fetch("/api/vendor/product-options", {
          cache: "no-store",
        });

        const data: ProductOptionsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load product options.");
        }

        setBrands(data.brands ?? []);
        setCategories(data.categories ?? []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load product options.",
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(
      name.trim() &&
      slug.trim() &&
      brandId &&
      categoryId &&
      !saving &&
      !loadingOptions,
    );
  }, [name, slug, brandId, categoryId, saving, loadingOptions]);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(createSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(createSlug(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }

    if (!brandId) {
      toast.error("Please select a brand.");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          website: website.trim(),
          pricing: pricing.trim(),
          freeTrial,
          brandId: Number(brandId),
          categoryId: Number(categoryId),

          // Vendor ownership and initial status
          // remain controlled by the backend.
        }),
      });

      const data: CreateProductResponse = await response.json();

      if (!response.ok || !data.success || !data.product) {
        throw new Error(data.message || "Failed to create product.");
      }

      toast.success("Product draft created successfully.");

      router.push(`/vendor/products/${data.product.id}/edit`);

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb and heading */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href="/vendor/products"
              className="cursor-pointer transition hover:text-gray-900"
            >
              Products
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Add Product</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA]  text-[#8059BD] shadow-sm">
              <Package size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Product
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a new software product for the CADGram catalog.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/vendor/products"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </section>

      {/* Draft info banner */}
      <div className="flex items-start gap-3 rounded-[20px] border border-[#EAE7EF] bg-white px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
          <Info size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Your product will be saved as a draft
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            You can add more details and submit the product for review after
            creating it. Draft products are not visible on the public website.
          </p>
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          Draft
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main form */}
          <div className="min-w-0 space-y-6">
            {/* Basic Information */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Package size={21} />
                </span>

                <div>
                  <h2 className="text-base font-semibold text-[#1F2430]">
                    Basic Information
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Enter the product name and customer-facing description.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Product Name
                    <span className="ml-1 text-[#8065B0]">*</span>
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="Example: Acme Design Pro"
                    disabled={saving}
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Use the official product name customers will recognize.
                  </p>
                </div>

                <div>
                  <label htmlFor="slug" className={labelClass}>
                    Product Slug
                    <span className="ml-1 text-[#8065B0]">*</span>
                  </label>

                  <div className="relative">
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(event) => handleSlugChange(event.target.value)}
                      placeholder="acme-design-pro"
                      disabled={saving}
                      className={inputClass}
                    />
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                    <Globe2 size={13} />
                    Used in the public product URL after approval.
                  </p>
                </div>

                <div>
                  <label htmlFor="shortDescription" className={labelClass}>
                    Short Description
                  </label>

                  <textarea
                    id="shortDescription"
                    rows={3}
                    value={shortDescription}
                    onChange={(event) =>
                      setShortDescription(event.target.value)
                    }
                    placeholder="A short summary of your product..."
                    disabled={saving}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    Full Description
                  </label>

                  <textarea
                    id="description"
                    rows={8}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe your product, its capabilities and use cases..."
                    disabled={saving}
                    className={`${inputClass} resize-y leading-6`}
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Include important features, benefits and typical use cases.
                  </p>
                </div>
              </div>
            </section>

            {/* Classification */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Layers3 size={21} />
                </span>

                <div>
                  <h2 className="text-base font-semibold text-[#1F2430]">
                    Product Classification
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Choose the brand and category for your product.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="brand" className={labelClass}>
                    Brand
                    <span className="ml-1 text-[#8065B0]">*</span>
                  </label>

                  <div className="relative">
                    <select
                      id="brand"
                      value={brandId}
                      onChange={(event) => setBrandId(event.target.value)}
                      disabled={loadingOptions || saving}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">
                        {loadingOptions ? "Loading brands..." : "Select brand"}
                      </option>

                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className={labelClass}>
                    Category
                    <span className="ml-1 text-[#8065B0]">*</span>
                  </label>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    disabled={loadingOptions || saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F9F7FC] p-4 text-xs leading-5 text-gray-500">
                <Tag size={16} className="mt-0.5 shrink-0" />

                <p>
                  Select the most relevant brand and category to help customers
                  discover your product.
                </p>
              </div>
            </section>

            {/* Commercial Information */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Wallet size={21} />
                </span>

                <div>
                  <h2 className="text-base font-semibold text-[#1F2430]">
                    Commercial Information
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Provide pricing, trial availability and website details.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="pricing" className={labelClass}>
                    Pricing Summary
                  </label>

                  <input
                    id="pricing"
                    type="text"
                    value={pricing}
                    onChange={(event) => setPricing(event.target.value)}
                    placeholder="Example: Starts at ₹999/month"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#EAE7EF] bg-[#FCFBFD] p-4 transition hover:border-gray-300 hover:bg-[#F9F7FC]">
                  <input
                    type="checkbox"
                    checked={freeTrial}
                    onChange={(event) => setFreeTrial(event.target.checked)}
                    disabled={saving}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-[#8065B0]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">
                      Free trial available
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      Enable this if customers can try the product before making
                      a purchase.
                    </span>
                  </span>

                  <CheckCircle2
                    size={19}
                    className={freeTrial ? "text-[#8065B0]" : "text-gray-300"}
                  />
                </label>

                <div>
                  <label htmlFor="website" className={labelClass}>
                    Product Website
                  </label>

                  <div className="relative">
                    <Globe2
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      placeholder="https://example.com/product"
                      disabled={saving}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-[112px]">
            {/* Create Draft */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)]">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <PackagePlus size={21} />
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  Draft
                </span>
              </div>

              <h2 className="mt-5 text-base font-semibold text-[#1F2430]">
                Create Product Draft
              </h2>

              <p className="mt-2 text-xs leading-6 text-gray-500">
                Save your product to your vendor catalog. You can complete
                additional details before submitting it for approval.
              </p>

              <div className="mt-5 rounded-2xl bg-[#F9F7FC] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Initial Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    Draft
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Create Draft
                  </>
                )}
              </button>

              <Link
                href="/vendor/products"
                className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
              >
                Cancel
              </Link>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="flex items-start gap-2 text-xs leading-5 text-gray-500">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  Products require admin approval before they can be published.
                </p>
              </div>
            </section>

            {/* Next Steps */}
            <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)]">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <FileText size={18} />
                </span>

                <h3 className="text-sm font-semibold text-gray-900">
                  What happens next?
                </h3>
              </div>

              <div className="mt-5 space-y-5">
                {[
                  {
                    number: "01",
                    title: "Create draft",
                    description: "Save the initial product details.",
                  },
                  {
                    number: "02",
                    title: "Complete details",
                    description: "Add more information on the edit page.",
                  },
                  {
                    number: "03",
                    title: "Submit for review",
                    description: "Request admin approval before publishing.",
                  },
                ].map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[11px] font-bold text-gray-600">
                      {step.number}
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {step.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </form>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Create products. Manage your catalog.</p>
      </footer>
    </div>
  );
}
