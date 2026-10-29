"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  Globe2,
  Info,
  Loader2,
  Package,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Option = {
  id: number;
  name: string;
};

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#E8E3F0] bg-[#FBFAFE] px-4 text-sm text-[#292438] outline-none transition placeholder:text-[#A39BAF] focus:border-[#B6A2E8] focus:bg-white focus:ring-4 focus:ring-violet-100/70 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "mt-2 w-full resize-y rounded-xl border border-[#E8E3F0] bg-[#FBFAFE] px-4 py-3 text-sm leading-6 text-[#292438] outline-none transition placeholder:text-[#A39BAF] focus:border-[#B6A2E8] focus:bg-white focus:ring-4 focus:ring-violet-100/70 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-[13px] font-semibold text-[#514B62]";

export default function NewProductForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [pricing, setPricing] = useState("");
  const [freeTrial, setFreeTrial] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [brands, setBrands] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch("/api/admin/product-options");

        if (!response.ok) {
          throw new Error("Failed to load product options.");
        }

        const data = await response.json();

        if (!active) return;

        setBrands(data.brands ?? []);
        setCategories(data.categories ?? []);
      } catch (error) {
        console.error("Failed to load product options:", error);

        if (active) {
          toast.error("Unable to load brands and categories.");
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const requiredFields = [
    { label: "Product name", complete: Boolean(name.trim()) },
    { label: "Brand", complete: Boolean(brandId) },
    { label: "Category", complete: Boolean(categoryId) },
    { label: "Slug", complete: Boolean(slug.trim()) },
  ];

  const completedFields = requiredFields.filter(
    (field) => field.complete,
  ).length;

  const progress = (completedFields / requiredFields.length) * 100;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (creating) return;

    if (!name.trim()) {
      toast.error("Product name is required.");
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

    if (!slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          shortDescription,
          description,
          website,
          pricing,
          freeTrial,
          isFeatured,
          brandId,
          categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to create product.");
        return;
      }

      toast.success("Product created successfully.");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Create product error:", error);

      toast.error("Something went wrong while creating the product.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-12">
      {/* Page header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href="/admin/products"
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
          href="/admin/products"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]"
      >
        {/* Main content */}
        <div className="min-w-0 space-y-6">
          {/* Basic information */}
          <section className="overflow-hidden rounded-[22px] border border-[#EAE5F2] bg-white shadow-[0_8px_32px_rgba(63,45,95,0.045)]">
            <SectionHeading
              icon={<Package size={19} />}
              title="Basic Information"
              description="Set the core identity and classification of your product."
            />

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="product-name" className={labelClass}>
                  Product Name <Required />
                </label>

                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. AutoCAD"
                  disabled={creating}
                  className={inputClass}
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Enter the official product name.
                </p>
              </div>

              <div>
                <label htmlFor="product-brand" className={labelClass}>
                  Brand <Required />
                </label>

                <select
                  id="product-brand"
                  value={brandId}
                  onChange={(event) => setBrandId(event.target.value)}
                  disabled={loadingOptions || creating}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">
                    {loadingOptions ? "Loading brands..." : "Select Brand"}
                  </option>

                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-category" className={labelClass}>
                  Category <Required />
                </label>

                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={loadingOptions || creating}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="product-slug" className={labelClass}>
                  Product Slug <Required />
                </label>

                <div className="mt-2 flex h-11 overflow-hidden rounded-xl border border-[#E8E3F0] bg-[#FBFAFE] transition focus-within:border-[#B6A2E8] focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100/70">
                  <span className="flex shrink-0 items-center border-r border-[#E8E3F0] bg-[#F3EFF9] px-3 text-xs text-[#81778F]">
                    /products/
                  </span>

                  <input
                    id="product-slug"
                    type="text"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="autocad"
                    disabled={creating}
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-400">
                  Use a lowercase, URL-friendly value such as "autocad".
                </p>
              </div>
            </div>
          </section>

          {/* Product content */}
          <section className="overflow-hidden rounded-[22px] border border-[#EAE5F2] bg-white shadow-[0_8px_32px_rgba(63,45,95,0.045)]">
            <SectionHeading
              icon={<FileText size={19} />}
              title="Product Content"
              description="Add descriptions customers will see on the product page."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="product-short-description"
                    className={labelClass}
                  >
                    Short Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {shortDescription.length} characters
                  </span>
                </div>

                <textarea
                  id="product-short-description"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  rows={4}
                  placeholder="Write a concise summary of the product..."
                  disabled={creating}
                  className={textareaClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="product-description" className={labelClass}>
                    Full Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {description.length} characters
                  </span>
                </div>

                <textarea
                  id="product-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={8}
                  placeholder="Add a detailed description of the product, its capabilities, and key use cases..."
                  disabled={creating}
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* Commercial information */}
          <section className="overflow-hidden rounded-[22px] border border-[#EAE5F2] bg-white shadow-[0_8px_32px_rgba(63,45,95,0.045)]">
            <SectionHeading
              icon={<Globe2 size={19} />}
              title="Commercial Information"
              description="Configure website, pricing, and trial availability."
            />

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="product-website" className={labelClass}>
                  Official Website
                </label>

                <div className="relative">
                  <input
                    id="product-website"
                    type="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://example.com"
                    disabled={creating}
                    className={`${inputClass} pr-11`}
                  />

                  <ExternalLink
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="product-pricing" className={labelClass}>
                  Pricing
                </label>

                <input
                  id="product-pricing"
                  type="text"
                  value={pricing}
                  onChange={(event) => setPricing(event.target.value)}
                  placeholder="e.g. Starting at $50/month"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <span className={labelClass}>Trial Availability</span>

                <label
                  className={`mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition ${
                    freeTrial
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-[#E7E8EC] bg-[#FAFAFB] hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2
                      size={17}
                      className={
                        freeTrial ? "text-emerald-600" : "text-gray-400"
                      }
                    />

                    <span className="text-sm font-medium text-gray-700">
                      Free Trial Available
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={freeTrial}
                    onChange={(event) => setFreeTrial(event.target.checked)}
                    disabled={creating}
                    className="h-4 w-4 cursor-pointer accent-[#111111]"
                  />
                </label>
              </div>

              {/* Featured Product */}
              <div className="md:col-span-2">
                <label
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                    isFeatured
                      ? "border-violet-200 bg-violet-50/60"
                      : "border-[#E7E8EC] bg-[#FAFAFB] hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isFeatured
                          ? "bg-violet-100 text-violet-700"
                          : "bg-white text-gray-400"
                      }`}
                    >
                      <Sparkles size={18} />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Featured Product
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Highlight this product on the CADGram homepage once it
                        is published.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(event) => setIsFeatured(event.target.checked)}
                    disabled={creating}
                    aria-label="Featured Product"
                    className="h-5 w-5 shrink-0 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[22px] border border-[#EAE5F2] bg-white p-4 shadow-[0_8px_32px_rgba(63,45,95,0.045)] sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/admin/products"
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={creating || loadingOptions}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Product
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5 xl:sticky xl:top-6">
          {/* Setup progress */}
          <section className="rounded-[22px] border border-[#EAE5F2] bg-white p-5 shadow-[0_8px_32px_rgba(63,45,95,0.045)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEE8FA] text-[#8059BD]">
                <ShieldCheck size={20} />
              </span>

              <div>
                <h3 className="text-sm font-bold text-[#26232F]">
                  Product Setup
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Required information
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-[#81778F]">
                Completion progress
              </span>

              <span className="text-xs font-bold text-[#7555AF]">
                {completedFields}/{requiredFields.length}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Required fields completed"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE9F6]"
            >
              <div
                className="h-full rounded-full bg-[#8B69C3] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 space-y-4">
              {requiredFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-600">{field.label}</span>

                  {field.complete ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <Check size={14} />
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Helpful information */}
          <section className="rounded-[22px] border border-[#EAE5F2] bg-white p-5 shadow-[0_8px_32px_rgba(63,45,95,0.045)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Info size={19} />
              </span>

              <div>
                <h3 className="text-sm font-bold text-[#26232F]">Next Steps</h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  After creating the product, you can add pricing plans,
                  features, specifications, images, FAQs, questions, and
                  alternatives from the product management workspace.
                </p>
              </div>
            </div>
          </section>

          {/* Tip */}
          <section className="rounded-[22px] border border-[#EAE5F2] bg-[#F7F4FC] p-5">
            <div className="flex items-start gap-3">
              <CircleHelp size={19} className="mt-0.5 shrink-0 text-gray-500" />

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Quick Tip
                </h3>

                <p className="mt-1 text-xs leading-6 text-gray-500">
                  Use a descriptive product name and a unique, URL-friendly slug
                  to help organize your catalog.
                </p>
              </div>
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
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#EFEAF5] bg-[#FCFBFE] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EDFF] text-[#8059BD]">
        {icon}
      </span>

      <div>
        <h2 className="text-[16px] font-bold text-[#26232F]">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-1 text-[#DC0000]">*</span>;
}
