
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileImage,
  Globe2,
  Info,
  ListChecks,
  LoaderCircle,
  Package,
  PencilLine,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "react-toastify";

type Option = {
  id: number;
  name: string;
};

type ProductStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "PUBLISHED";

type Product = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  website: string | null;
  pricing: string | null;
  freeTrial: boolean;
  brandId: number;
  categoryId: number;
  status: ProductStatus;
};

type ManagementLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFD] px-4 py-3 text-sm text-[#1F2430] outline-none transition placeholder:text-[#9293A0] focus:border-[#A58BD0] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100";

const textareaClass = `${inputClass} resize-y leading-6`;

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

function formatStatus(status: ProductStatus) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

const statusConfig: Record<
  ProductStatus,
  {
    label: string;
    description: string;
    badge: string;
    dot: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    description:
      "Continue completing your product before submitting it for review.",
    badge: "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
    dot: "bg-gray-400",
  },
  SUBMITTED: {
    label: "Submitted for Review",
    description:
      "Your product is waiting for Super Admin review.",
    badge: "border border-[#DDE6FA] bg-[#F0F5FF] text-[#5476B4]",
    dot: "bg-blue-500",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    description:
      "Super Admin has requested updates before this product can be approved.",
    badge: "border border-[#F2E3CA] bg-[#FFF8EB] text-[#A47735]",
    dot: "bg-amber-500",
  },
  PUBLISHED: {
    label: "Published",
    description:
      "Your product has been approved and is available in the public CADGram catalog.",
    badge: "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",
    dot: "bg-emerald-500",
  },
};

function StatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${config.badge}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />
      {formatStatus(status)}
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        <Icon size={21} strokeWidth={1.8} />
      </span>

      <div>
        <h2 className="text-[15px] font-semibold text-[#1F2430]">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#77808E]">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[13px] font-semibold text-[#374151]"
    >
      {children}
      {required && (
        <span className="ml-1 text-[#8065B0]">
          *
        </span>
      )}
    </label>
  );
}

export default function VendorEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [
    shortDescription,
    setShortDescription,
  ] = useState("");
  const [description, setDescription] =
    useState("");
  const [website, setWebsite] = useState("");
  const [pricing, setPricing] = useState("");
  const [freeTrial, setFreeTrial] =
    useState(false);

  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] =
    useState("");

  const [status, setStatus] =
    useState<ProductStatus>("DRAFT");

  const [brands, setBrands] = useState<
    Option[]
  >([]);
  const [categories, setCategories] =
    useState<Option[]>([]);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const managementLinks: ManagementLink[] = [
    {
      label: "Pricing",
      description: "Plans and prices",
      href: `/vendor/products/${id}/pricing`,
      icon: Tag,
    },
    {
      label: "Features",
      description: "Product capabilities",
      href: `/vendor/products/${id}/features`,
      icon: Sparkles,
    },
    {
      label: "Specifications",
      description: "Technical details",
      href: `/vendor/products/${id}/specifications`,
      icon: SlidersHorizontal,
    },
    {
      label: "Images",
      description: "Product media",
      href: `/vendor/products/${id}/images`,
      icon: FileImage,
    },
    {
      label: "FAQs",
      description: "Common questions",
      href: `/vendor/products/${id}/faqs`,
      icon: CircleHelp,
    },
    {
      label: "Questions",
      description: "Customer questions",
      href: `/vendor/products/${id}/questions`,
      icon: ListChecks,
    },
  ];

  useEffect(() => {
    if (!id) return;

    async function loadPage() {
      try {
        setLoading(true);

        const [
          productResponse,
          optionsResponse,
        ] = await Promise.all([
          fetch(
            `/api/vendor/products/${id}`,
            { cache: "no-store" }
          ),
          fetch(
            "/api/vendor/product-options",
            { cache: "no-store" }
          ),
        ]);

        const productData =
          await productResponse.json();
        const optionsData =
          await optionsResponse.json();

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            toast.error(
              "Product not found or you do not have access to it."
            );
            router.replace(
              "/vendor/products"
            );
            return;
          }

          throw new Error(
            productData.message ||
              "Failed to load product."
          );
        }

        if (!optionsResponse.ok) {
          throw new Error(
            optionsData.message ||
              "Failed to load product options."
          );
        }

        const product: Product =
          productData.product;

        setName(product.name || "");
        setSlug(product.slug || "");
        setShortDescription(
          product.shortDescription || ""
        );
        setDescription(
          product.description || ""
        );
        setWebsite(product.website || "");
        setPricing(product.pricing || "");
        setFreeTrial(
          product.freeTrial || false
        );

        setBrandId(
          String(product.brandId)
        );
        setCategoryId(
          String(product.categoryId)
        );
        setStatus(
          product.status || "DRAFT"
        );

        setBrands(
          optionsData.brands || []
        );
        setCategories(
          optionsData.categories || []
        );
      } catch (error) {
        console.error(
          "Failed to load vendor product:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [id, router]);

  async function handleUpdate() {
    if (!name.trim()) {
      toast.error(
        "Product name is required."
      );
      return;
    }

    if (!slug.trim()) {
      toast.error(
        "Product slug is required."
      );
      return;
    }

    if (!brandId) {
      toast.error(
        "Please select a brand."
      );
      return;
    }

    if (!categoryId) {
      toast.error(
        "Please select a category."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            shortDescription:
              shortDescription.trim(),
            description:
              description.trim(),
            website: website.trim(),
            pricing: pricing.trim(),
            freeTrial,
            brandId: Number(brandId),
            categoryId:
              Number(categoryId),

            // No vendorId.
            // No status.
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            "Failed to update product."
        );
        return;
      }

      if (data.product?.status) {
        setStatus(
          data.product.status
        );
      }

      toast.success(
        "Product updated successfully."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Vendor product update error:",
        error
      );

      toast.error(
        "Something went wrong while updating the product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (
      status !== "DRAFT" &&
      status !== "CHANGES_REQUESTED"
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/vendor/products/${id}/submit`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            "Failed to submit product for review."
        );
        return;
      }

      setStatus("SUBMITTED");

      toast.success(
        "Product submitted for review successfully."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Submit product error:",
        error
      );

      toast.error(
        "Something went wrong while submitting the product."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-44 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200" />

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="h-[450px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-[650px] animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  const canSubmitForReview =
    status === "DRAFT" ||
    status === "CHANGES_REQUESTED";

  const currentStatus =
    statusConfig[status];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#9293A0]">
        
        <Link
          href="/vendor/products"
         className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Edit Product
        </span>
      </div>

      {/* Page heading — aligned with Super Admin edit pages */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <Package size={22} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Product
              </h1>
              <span className="rounded-lg border border-[#EAE7EF] bg-[#F8F7FA] px-2.5 py-1 text-[12px] font-medium text-[#77808E]">
                #{id}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Update product information and manage the publishing workflow.
            </p>
          </div>
        </div>

        <Link
          href="/vendor/products"
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] sm:self-auto"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </section>

      {/* Product summary */}
      <section className="flex flex-col justify-between gap-4 rounded-[22px] border border-[#EAE7EF] bg-white p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            <Package size={23} />
          </span>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-900">
              {name || "Unnamed Product"}
            </h2>

            <p className="mt-1 truncate text-xs text-[#77808E]">
              Product ID: {id}
              {slug ? ` · ${slug}` : ""}
            </p>
          </div>
        </div>

        <StatusBadge status={status} />
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Product navigation */}
        <aside className={`${cardClass} lg:sticky lg:top-[112px]`}>
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex items-center gap-2">
              <Settings2
                size={18}
                className="text-gray-600"
              />

              <h2 className="text-sm font-bold text-gray-900">
                Product Management
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#77808E]">
              Manage every part of your product
              from one workspace.
            </p>
          </div>

          <nav className="space-y-1 p-3">
            <a
              href="#core-information"
              className="flex items-center gap-3 rounded-xl border-l-[3px] border-[#8065B0] bg-[#F0EBFA] px-3 py-3 text-[#8065B0]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                <PencilLine size={17} />
              </span>

              <span className="flex-1 text-sm font-semibold">
                Overview
              </span>

              <ChevronRight size={16} />
            </a>

            {managementLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-gray-600 transition hover:bg-[#FAF9FC] hover:text-[#8065B0]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0] transition group-hover:bg-[#F0EBFA] group-hover:text-[#8065B0]">
                    <Icon size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>

                    <span className="mt-0.5 block text-[11px] text-[#9293A0]">
                      {item.description}
                    </span>
                  </span>

                  <ChevronRight
                    size={15}
                    className="shrink-0 text-gray-300"
                  />
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 space-y-6">
          {/* Basic information */}
          <section
            id="core-information"
            className={`${cardClass} scroll-mt-28`}
          >
            <SectionHeader
              icon={Package}
              title="Basic Information"
              description="Configure the core details shown for this product."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <FieldLabel
                  htmlFor="product-name"
                  required
                >
                  Product Name
                </FieldLabel>

                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter product name"
                  disabled={saving}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="product-brand"
                    required
                  >
                    Brand
                  </FieldLabel>

                  <select
                    id="product-brand"
                    value={brandId}
                    onChange={(event) =>
                      setBrandId(event.target.value)
                    }
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">
                      Select Brand
                    </option>

                    {brands.map((brand) => (
                      <option
                        key={brand.id}
                        value={brand.id}
                      >
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel
                    htmlFor="product-category"
                    required
                  >
                    Category
                  </FieldLabel>

                  <select
                    id="product-category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel
                  htmlFor="product-slug"
                  required
                >
                  Product Slug
                </FieldLabel>

                <input
                  id="product-slug"
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  placeholder="product-slug"
                  disabled={saving}
                  className={inputClass}
                />

                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#9293A0]">
                  <Globe2 size={13} />
                  URL-friendly product identifier.
                </p>
              </div>

              <div>
                <FieldLabel htmlFor="short-description">
                  Short Description
                </FieldLabel>

                <textarea
                  id="short-description"
                  rows={4}
                  value={shortDescription}
                  onChange={(event) =>
                    setShortDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter a short description"
                  disabled={saving}
                  className={textareaClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor="description">
                  Full Description
                </FieldLabel>

                <textarea
                  id="description"
                  rows={8}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter the complete product description"
                  disabled={saving}
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* Publishing workflow */}
          <section className={cardClass}>
            <SectionHeader
              icon={ShieldCheck}
              title="Publishing Workflow"
              description="Track the current approval status of your product."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-[#EAE7EF] bg-[#FAF9FC] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9293A0]">
                      Current Status
                    </p>

                    <div className="mt-3">
                      <StatusBadge status={status} />
                    </div>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600">
                    {status === "PUBLISHED" ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                  </span>
                </div>

                <p className="mt-4 text-xs leading-6 text-[#77808E]">
                  {currentStatus.description}
                </p>
              </div>

              {canSubmitForReview && (
                <div className="rounded-2xl border border-[#EAE7EF] bg-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Ready for review?
                      </h3>

                      <p className="mt-1 max-w-md text-xs leading-6 text-[#77808E]">
                        Save your latest changes first,
                        then submit this product to
                        CADGram for approval.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitForReview}
                      disabled={submitting || saving}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit for Review
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="flex items-start gap-2 text-xs leading-5 text-[#77808E]">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-[#9293A0]"
                />

                Vendors cannot directly change the
                publishing status. The Super Admin
                manages product approval.
              </p>
            </div>
          </section>

          {/* Commercial information */}
          <section className={cardClass}>
            <SectionHeader
              icon={Tag}
              title="Commercial Information"
              description="Configure pricing, website details and free trial availability."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="product-website">
                    Product Website
                  </FieldLabel>

                  <input
                    id="product-website"
                    type="url"
                    value={website}
                    onChange={(event) =>
                      setWebsite(
                        event.target.value
                      )
                    }
                    placeholder="https://example.com"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="product-pricing">
                    Pricing Summary
                  </FieldLabel>

                  <input
                    id="product-pricing"
                    type="text"
                    value={pricing}
                    onChange={(event) =>
                      setPricing(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Starting at ₹999/month"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] bg-[#FCFCFD] p-4 transition hover:bg-[#FAF9FC]">
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      freeTrial
                        ? "bg-[#F0EBFA] text-[#8065B0]"
                        : "bg-gray-100 text-[#77808E]"
                    }`}
                  >
                    <Check size={19} />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Free Trial Available
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-[#77808E]">
                      Mark this product as offering
                      a free trial.
                    </span>
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={freeTrial}
                  onChange={(event) =>
                    setFreeTrial(
                      event.target.checked
                    )
                  }
                  disabled={saving}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[#8065B0]"
                />
              </label>
            </div>
          </section>

          {/* Bottom actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 shadow-[0_5px_20px_rgba(31,26,45,0.025)] sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/vendor/products"
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving || submitting}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-[#9293A0] sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>
          Manage your catalog. Grow your business.
        </p>
      </footer>
    </div>
  );
}
