
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  LoaderCircle,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

type PricingPlan = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  billing: string | null;
};

type Product = {
  id: number;
  name: string;
  pricingPlans: PricingPlan[];
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(36,28,51,0.025)]";

function displayPrice(price: number | null) {
  if (price === null) return "Not set";

  // Currency is not specified by this API,
  // so display the numeric value without
  // assuming a currency symbol.
  return price.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default function PricingPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] =
    useState<Product | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<number | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function loadProductPricing() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/vendor/products/${productId}/pricing`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load pricing plans."
          );
          return;
        }

        setProduct(data.product);
      } catch (error) {
        console.error(
          "Failed to load pricing plans:",
          error
        );
        toast.error(
          "Failed to load pricing plans."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProductPricing();
  }, [productId]);

  async function handleDelete(planId: number) {
    try {
      setDeletingId(planId);

      const response = await fetch(
        `/api/vendor/products/${productId}/pricing/${planId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to delete pricing plan."
        );
        return;
      }

      setProduct((currentProduct) => {
        if (!currentProduct) {
          return currentProduct;
        }

        return {
          ...currentProduct,
          pricingPlans:
            currentProduct.pricingPlans.filter(
              (plan) => plan.id !== planId
            ),
        };
      });

      toast.success(
        "Pricing plan deleted successfully."
      );

      setConfirmDeleteId(null);
    } catch (error) {
      console.error(
        "Delete pricing plan error:",
        error
      );

      toast.error(
        "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="space-y-3">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[22px] bg-white"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-white" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${cardClass} p-8`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
          <CircleDollarSign size={23} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-950">
          Product not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The requested product could not be loaded.
        </p>

        <Link
          href="/vendor/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>
    );
  }

  const totalPlans = product.pricingPlans.length;

  const plansWithPrice =
    product.pricingPlans.filter(
      (plan) => plan.price !== null
    ).length;

  const plansWithBilling =
    product.pricingPlans.filter(
      (plan) => Boolean(plan.billing)
    ).length;

  const selectedPlan =
    confirmDeleteId !== null
      ? product.pricingPlans.find(
          (plan) => plan.id === confirmDeleteId
        )
      : null;

  const stats = [
    {
      label: "Pricing Plans",
      value: totalPlans,
      description:
        "Plans configured for this product",
      icon: CreditCard,
    },
    {
      label: "With Price",
      value: plansWithPrice,
      description:
        "Plans with a configured price",
      icon: CircleDollarSign,
    },
    {
      label: "Billing Details",
      value: plansWithBilling,
      description:
        "Plans with billing information",
      icon: Tag,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        <Link
          href="/vendor/products"
         className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>

        <ChevronRight size={13} />

        <Link
          href={`/vendor/products/${product.id}/edit`}
         className="cursor-pointer hover:text-gray-900"
        >
          Edit Product
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Pricing
        </span>
      </div>

      {/* Page Heading — Super Admin styling */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8666B5] shadow-sm">
            <CreditCard size={22} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Pricing
              </h1>
              <span className="rounded-lg border border-[#EAE7EF] bg-[#FAF9FC] px-2.5 py-1 text-xs font-medium text-[#77717F]">
                #{product.id}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Manage pricing plans for {product.name}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/vendor/products/${product.id}/edit`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <Link href={`/vendor/products/${product.id}/pricing/new`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]">
            <Plus size={16} /> Add Pricing Plan
          </Link>
        </div>
      </section>

      {/* Summary Cards — same proportions as Super Admin */}
      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const themes = [
            { card: "bg-gradient-to-br from-[#FFF4F7] to-[#F5F0FA]", icon: "bg-[#EDE1FA] text-[#8966B7]" },
            { card: "bg-gradient-to-br from-[#F1FAF6] to-[#E6F7ED]", icon: "bg-[#D7F2E4] text-[#328F72]" },
            { card: "bg-gradient-to-br from-[#FFFAF2] to-[#FFF1E1]", icon: "bg-[#FFE6C4] text-[#D18B32]" },
          ];
          const theme = themes[index];

          return (
            <div
              key={stat.label}
              className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/80 px-5 py-4 shadow-[0_8px_24px_rgba(40,30,60,0.035)] ${theme.card}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.055em] text-[#77808E]">
                  {stat.label}
                </p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.icon}`}>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
              </div>
              <div>
                <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#1F2430]">
                  {stat.value.toLocaleString("en-IN")}
                </p>
                <p className="mt-2 text-[12px] leading-4 text-[#77808E]">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Pricing Plans */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CreditCard size={21} />
            </span>

            <div>
              <h2 className="text-base font-bold text-gray-950">
                Pricing Plans
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                View and manage your product
                pricing options.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#F4F0FA] px-3 py-1.5 text-xs font-semibold text-[#79638F]">
            {totalPlans} Total
          </span>
        </div>

        {product.pricingPlans.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#FAFAFB]">
                  <tr className="border-b border-gray-100">
                    {[
                      "Plan",
                      "Price",
                      "Billing",
                      "Description",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 ${
                          heading === "Actions"
                            ? "text-right"
                            : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {product.pricingPlans.map(
                    (plan) => (
                      <tr
                        key={plan.id}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#FAFAFB]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                              <CreditCard size={19} />
                            </span>

                            <span>
                              <span className="block text-sm font-semibold text-gray-900">
                                {plan.name}
                              </span>

                              <span className="mt-1 block text-xs text-gray-400">
                                Plan #{plan.id}
                              </span>
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                            {displayPrice(
                              plan.price
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {plan.billing ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
                              <CheckCircle2
                                size={14}
                              />
                              {plan.billing}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Not specified
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-[360px] items-start gap-2">
                            <FileText
                              size={15}
                              className="mt-0.5 shrink-0 text-gray-400"
                            />

                            <p className="line-clamp-2 text-sm leading-6 text-gray-500">
                              {plan.description ||
                                "No description provided."}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/vendor/products/${product.id}/pricing/${plan.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-100 hover:bg-red-50 hover:text-[#8065B0]"
                            >
                              Edit
                              <ArrowUpRight
                                size={15}
                              />
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteId(
                                  plan.id
                                )
                              }
                              disabled={
                                deletingId ===
                                plan.id
                              }
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE4E7] disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Delete ${plan.name}`} title="Delete pricing plan"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {product.pricingPlans.map(
                (plan) => (
                  <article
                    key={plan.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                        <CreditCard size={19} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                          {plan.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Plan #{plan.id}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                        {displayPrice(
                          plan.price
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F8F9FA] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Billing
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-gray-700">
                          {plan.billing ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8F9FA] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Price
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-700">
                          {displayPrice(
                            plan.price
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-6 text-gray-500">
                      {plan.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                      <Link
                        href={`/vendor/products/${product.id}/pricing/${plan.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25232C] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#403948]"
                      >
                        Edit Plan
                        <ArrowUpRight
                          size={15}
                        />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId(
                            plan.id
                          )
                        }
                        disabled={
                          deletingId ===
                          plan.id
                        }
                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE4E7] disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Delete ${plan.name}`} title="Delete pricing plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <CreditCard size={28} />
            </span>

            <h3 className="mt-5 text-base font-bold text-gray-900">
              No pricing plans yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add your first pricing plan to
              configure the available purchase
              options for this product.
            </p>

            <Link
              href={`/vendor/products/${product.id}/pricing/new`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
            >
              <Plus size={17} />
              Add Pricing Plan
            </Link>
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plan-title"
            className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </span>

              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteId(null)
                }
                disabled={
                  deletingId !== null
                }
                aria-label="Close confirmation dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="delete-plan-title"
              className="mt-5 text-lg font-bold text-gray-950"
            >
              Delete pricing plan?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              You are about to delete{" "}
              <span className="font-semibold text-gray-900">
                {selectedPlan.name}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteId(null)
                }
                disabled={
                  deletingId !== null
                }
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    selectedPlan.id
                  )
                }
                disabled={
                  deletingId !== null
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ===
                selectedPlan.id ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>
          Manage pricing. Grow your business.
        </p>
      </footer>
    </div>
  );
}
