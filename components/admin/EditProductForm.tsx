"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileImage,
  FileText,
  Globe2,
  Layers3,
  ListChecks,
  Loader2,
  Package,
  PencilLine,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";

type Brand = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

type Vendor = {
  id: number;
  name: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
};

type ProductStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED";

type ManagementLink = {
  label: string;
  href: string;
  icon: typeof Package;
};

const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-[#E5E2EA] bg-[#FAFAFC] px-3.5 text-[13px] text-[#1F2430] outline-none transition placeholder:text-[#9B97A5] focus:border-[#B8A5D7] focus:bg-white focus:ring-4 focus:ring-[#F0EAF8] disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "mt-2 w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FAFAFC] px-3.5 py-3 text-[13px] leading-6 text-[#1F2430] outline-none transition placeholder:text-[#9B97A5] focus:border-[#B8A5D7] focus:bg-white focus:ring-4 focus:ring-[#F0EAF8] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-[13px] font-medium text-[#44414C]";

type EditProductFormProps = {
  canApprove: boolean;
};

export default function EditProductForm({ canApprove }: EditProductFormProps) {
  const params = useParams();
  const id = params.id as string;
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
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");

  const [originalStatus, setOriginalStatus] = useState<ProductStatus>("DRAFT");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const managementLinks: ManagementLink[] = [
    {
      label: "Pricing",
      href: `/admin/products/${id}/pricing`,
      icon: Tag,
    },
    {
      label: "Features",
      href: `/admin/products/${id}/features`,
      icon: Sparkles,
    },
    {
      label: "Specifications",
      href: `/admin/products/${id}/specifications`,
      icon: SlidersHorizontal,
    },
    {
      label: "Images",
      href: `/admin/products/${id}/images`,
      icon: FileImage,
    },
    {
      label: "FAQs",
      href: `/admin/products/${id}/faqs`,
      icon: CircleHelp,
    },
    {
      label: "Questions",
      href: `/admin/products/${id}/questions`,
      icon: ListChecks,
    },
    {
      label: "Alternatives",
      href: `/admin/products/${id}/alternatives`,
      icon: Layers3,
    },
  ];

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadData() {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          fetch(`/api/admin/products/${id}`).then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to load product.");
            }

            return data.product;
          }),

          fetch("/api/admin/product-options").then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Failed to load product options.",
              );
            }

            return data;
          }),

          fetch("/api/admin/vendors").then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to load vendors.");
            }

            return data.vendors || [];
          }),
        ]);

        if (!active) return;

        const [productResult, optionsResult, vendorsResult] = results;

        if (productResult.status === "fulfilled") {
          const product = productResult.value;

          setName(product.name || "");
          setSlug(product.slug || "");
          setShortDescription(product.shortDescription || "");
          setDescription(product.description || "");
          setWebsite(product.website || "");
          setPricing(product.pricing || "");
          setFreeTrial(product.freeTrial || false);
          setIsFeatured(product.isFeatured === true);
          setBrandId(product.brandId != null ? String(product.brandId) : "");
          setCategoryId(
            product.categoryId != null ? String(product.categoryId) : "",
          );
          setVendorId(product.vendorId != null ? String(product.vendorId) : "");
          const loadedStatus: ProductStatus = product.status || "DRAFT";

          setStatus(loadedStatus);
          setOriginalStatus(loadedStatus);
        } else {
          console.error("Failed to load product:", productResult.reason);
          toast.error(
            productResult.reason?.message || "Failed to load product.",
          );
        }

        if (optionsResult.status === "fulfilled") {
          setBrands(optionsResult.value.brands || []);
          setCategories(optionsResult.value.categories || []);
        } else {
          console.error(
            "Failed to load product options:",
            optionsResult.reason,
          );
          toast.error("Failed to load product options.");
        }

        if (vendorsResult.status === "fulfilled") {
          setVendors(vendorsResult.value);
        } else {
          console.error("Failed to load vendors:", vendorsResult.reason);
          toast.error("Failed to load vendors.");
        }
      } catch (error) {
        console.error("Failed to load edit page:", error);
        if (active) toast.error("Failed to load product information.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (
      !canApprove &&
      originalStatus !== "PUBLISHED" &&
      status === "PUBLISHED"
    ) {
      toast.error("You do not have permission to approve or publish products.");
      return;
    }

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

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
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
          vendorId: vendorId ? Number(vendorId) : null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update product.");
        return;
      }

      toast.success("Product updated successfully.");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Update product error:", error);

      toast.error("Something went wrong while updating the product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-80 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-[24px] bg-white" />
          <div className="h-[650px] animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 pb-8">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 pt-6 pb-2 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#77808E]"
          >
            <Link
              href="/admin/products"
              className="cursor-pointer hover:text-gray-900"
            >
              Products
            </Link>

            <ChevronRight size={14} />

            <span className="text-gray-900">Edit Product</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#76599B] shadow-sm">
              <Package size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                  Edit Product
                </h1>

                <span className="rounded-lg bg-[#EBDEFA] px-2.5 py-1 text-xs font-semibold text-gray-500">
                  #{id}
                </span>
              </div>

              <p className="mt-0.5 truncate text-[14px] leading-5 text-[#77808E]">
                {name || "Update product information and related content"}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </section>

      <form
        onSubmit={handleUpdate}
        className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]"
      >
        {/* Product navigation */}
        <aside className="rounded-[21px] border border-[#E5E2EA] bg-white p-3 shadow-[0_5px_25px_rgba(15,23,42,0.025)] lg:sticky lg:top-6">
          <div className="border-b border-gray-100 px-3 py-4">
            <div className="flex items-center gap-2">
              <Settings2 size={17} className="text-gray-600" />

              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                Product Management
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              Manage your product from one workspace.
            </p>
          </div>

          <nav className="mt-3 space-y-1">
            <a
              href="#core-information"
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#25232C] px-3 py-2.5 text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <Package size={17} />
              </span>

              <span className="flex-1">
                <span className="block text-sm font-semibold">Overview</span>

                <span className="mt-0.5 block text-[11px] text-gray-300">
                  Core information
                </span>
              </span>

              <ChevronRight size={16} className="text-gray-400" />
            </a>

            {managementLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[#66707F] transition hover:bg-[#F8F6FA] hover:text-[#25232C]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-gray-200">
                    <Icon size={17} />
                  </span>

                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>

                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Editor */}
        <div className="min-w-0 space-y-6">
          {/* Basic information */}
          <section
            id="core-information"
            className="scroll-mt-6 overflow-hidden rounded-[21px] border border-[#E5E2EA] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]"
          >
            <SectionHeading
              icon={<Package size={19} />}
              title="Basic Information"
              description="Set the core identity and classification of the product."
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
                  placeholder="Enter product name"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="product-brand" className={labelClass}>
                  Brand <Required />
                </label>

                <select
                  id="product-brand"
                  value={brandId}
                  onChange={(event) => setBrandId(event.target.value)}
                  disabled={saving}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select Brand</option>

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
                  disabled={saving}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="product-slug" className={labelClass}>
                  Product Slug
                </label>

                <div className="mt-2 flex h-10 overflow-hidden rounded-xl border border-[#E5E2EA] bg-[#FAFAFC] transition focus-within:border-[#B8A5D7] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#F0EAF8]">
                  <span className="flex items-center border-r border-gray-200 bg-gray-100/70 px-3 text-xs text-gray-500">
                    /products/
                  </span>

                  <input
                    id="product-slug"
                    type="text"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="product-slug"
                    disabled={saving}
                    className="min-w-0 flex-1 bg-transparent px-3.5 text-[13px] text-[#1F2430] outline-none placeholder:text-gray-400"
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-400">
                  URL-friendly identifier for this product.
                </p>
              </div>
            </div>
          </section>

          {/* Product content */}
          <section className="overflow-hidden rounded-[21px] border border-[#E5E2EA] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]">
            <SectionHeading
              icon={<FileText size={19} />}
              title="Product Content"
              description="Manage the descriptions displayed on the product page."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="short-description" className={labelClass}>
                    Short Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {shortDescription.length} characters
                  </span>
                </div>

                <textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  rows={4}
                  placeholder="Enter a short description"
                  disabled={saving}
                  className={textareaClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="description" className={labelClass}>
                    Full Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {description.length} characters
                  </span>
                </div>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={8}
                  placeholder="Enter the complete product description"
                  disabled={saving}
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* Ownership and publishing */}
          <section className="overflow-hidden rounded-[21px] border border-[#E5E2EA] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]">
            <SectionHeading
              icon={<ShieldCheck size={19} />}
              title="Ownership & Publishing"
              description="Control product ownership and publishing workflow."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="product-vendor" className={labelClass}>
                    Product Owner
                  </label>

                  <select
                    id="product-vendor"
                    value={vendorId}
                    onChange={(event) => setVendorId(event.target.value)}
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">CADGram / Unassigned</option>

                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                        {vendor.status !== "ACTIVE"
                          ? ` (${formatVendorStatus(vendor.status)})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Unassigned products are managed directly by CADGram.
                  </p>
                </div>

                <div>
                  <label htmlFor="product-status" className={labelClass}>
                    Publishing Status
                  </label>

                  <select
                    id="product-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ProductStatus)
                    }
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted for Review</option>
                    <option value="CHANGES_REQUESTED">Changes Requested</option>
                    {(canApprove || originalStatus === "PUBLISHED") && (
                      <option value="PUBLISHED">Published</option>
                    )}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Only published products should be visible on the public
                    CADGram website.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <OwnershipPreview vendorId={vendorId} vendors={vendors} />

                <StatusPreview status={status} />
              </div>
            </div>
            <label
              className={`mx-5 mb-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
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

                  <p className="mt-1 text-[12px] leading-5 text-[#77808E]">
                    Highlight this product in the Featured Products section on
                    the CADGram homepage.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
                disabled={saving}
                aria-label="Featured Product"
                className="h-5 w-5 shrink-0 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
              />
            </label>
          </section>

          {/* Commercial information */}
          <section className="overflow-hidden rounded-[21px] border border-[#E5E2EA] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]">
            <SectionHeading
              icon={<Globe2 size={19} />}
              title="Commercial Information"
              description="Configure website, pricing, and trial availability."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
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
                      disabled={saving}
                      className={`${inputClass} pr-10`}
                    />

                    <ExternalLink
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                    placeholder="e.g. Starting at ₹..."
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                  freeTrial
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-[#E7E8EC] bg-[#FAFAFB] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      freeTrial
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-white text-gray-400"
                    }`}
                  >
                    <Check size={17} />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Free Trial Available
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Mark this product as offering a free trial.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={freeTrial}
                  onChange={(event) => setFreeTrial(event.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 cursor-pointer accent-[#76599B]"
                />
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[21px] border border-[#E5E2EA] bg-white p-4 shadow-[0_5px_25px_rgba(15,23,42,0.025)] sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/admin/products"
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
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
    <div className="flex items-center gap-3 border-b border-[#EFEDF3] px-5 py-4 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EAFB] text-[#76599B]">
        {icon}
      </span>

      <div>
        <h2 className="text-[16px] font-semibold text-[#1F2430]">{title}</h2>

        <p className="mt-1 text-[12px] leading-5 text-[#77808E]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-1 text-[#DC0000]">*</span>;
}

function OwnershipPreview({
  vendorId,
  vendors,
}: {
  vendorId: string;
  vendors: Vendor[];
}) {
  const vendor = vendors.find((item) => item.id.toString() === vendorId);

  return (
    <div className="rounded-xl border border-[#E5E2EA] bg-[#FAFAFC] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
        Current Owner
      </p>

      <p className="mt-2 text-sm font-semibold text-gray-900">
        {vendor ? vendor.name : "CADGram / Unassigned"}
      </p>

      <p className="mt-1 text-[12px] leading-5 text-[#77808E]">
        {vendor
          ? "This product belongs to the selected vendor."
          : "This product is managed directly by CADGram."}
      </p>
    </div>
  );
}

function StatusPreview({ status }: { status: ProductStatus }) {
  const config: Record<
    ProductStatus,
    {
      label: string;
      description: string;
      className: string;
    }
  > = {
    DRAFT: {
      label: "Draft",
      description: "Not ready for review or public display.",
      className: "border-gray-200 bg-gray-100 text-gray-700",
    },
    SUBMITTED: {
      label: "Submitted",
      description: "Waiting for Super Admin review.",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    CHANGES_REQUESTED: {
      label: "Changes Requested",
      description: "Vendor needs to update this product.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    PUBLISHED: {
      label: "Published",
      description: "Approved for the public CADGram catalog.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };

  const item = config[status];

  return (
    <div className="rounded-xl border border-[#E5E2EA] bg-[#FAFAFC] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
        Publishing Workflow
      </p>

      <span
        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
      >
        {item.label}
      </span>

      <p className="mt-2 text-xs leading-5 text-gray-500">{item.description}</p>
    </div>
  );
}

function formatVendorStatus(status: Vendor["status"]) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
