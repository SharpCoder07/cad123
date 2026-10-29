
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  Clock3,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Save,
} from "lucide-react";

type PricingPlan = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  billing: string | null;
};

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-semibold text-gray-700";

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function EditPricingPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const pricingId = params.pricingId as string;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billing, setBilling] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [original, setOriginal] = useState({ name: "", price: "", billing: "", description: "" });

  useEffect(() => {
    if (!productId || !pricingId) return;

    let active = true;

    async function loadPricingPlan() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch(
          `/api/admin/products/${productId}/pricing/${pricingId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(
              data.message || "Failed to load pricing plan."
            );
          }
          return;
        }

        const plan: PricingPlan = data.pricingPlan;

        if (!active) return;

        setName(plan.name || "");
        setPrice(
          plan.price !== null ? String(plan.price) : ""
        );
        setBilling(plan.billing || "");
        setDescription(plan.description || "");
        setOriginal({ name: plan.name || "", price: plan.price !== null ? String(plan.price) : "", billing: plan.billing || "", description: plan.description || "" });
      } catch (error) {
        console.error("Failed to load pricing plan:", error);

        if (active) {
          setLoadError(true);
          toast.error("Failed to load pricing plan.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPricingPlan();

    return () => {
      active = false;
    };
  }, [productId, pricingId]);

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || loading || loadError || !hasChanges) return;

    if (!name.trim()) {
      toast.error("Please enter a pricing plan name.");
      return;
    }

    if (
      price.trim() !== "" &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)
    ) {
      toast.error("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/pricing/${pricingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            price,
            billing,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to update pricing plan."
        );
        return;
      }

      toast.success("Pricing plan updated successfully.");

      router.push(
        `/admin/products/${productId}/pricing`
      );
      router.refresh();
    } catch (error) {
      console.error("Update pricing plan error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = name !== original.name || price !== original.price || billing !== original.billing || description !== original.description;

  const completedFields = [
    name.trim().length > 0,
    price.trim().length > 0 &&
      Number.isFinite(Number(price)) &&
      Number(price) >= 0,
    billing.length > 0,
    description.trim().length > 0,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-6">
            <div className="h-72 animate-pulse rounded-[24px] bg-white" />
            <div className="h-56 animate-pulse rounded-[24px] bg-white" />
          </div>

          <div className="h-64 animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`mx-auto max-w-3xl p-8 ${cardClass}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <CreditCard size={22} />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-950">
          Unable to load pricing plan
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The requested pricing plan could not be loaded.
          Please return to the pricing list and try again.
        </p>

        <Link
          href={`/admin/products/${productId}/pricing`}
          className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-5 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Page header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href={`/admin/products/${productId}/pricing`}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Pricing
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">
              Edit Pricing Plan
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <CreditCard size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Pricing Plan
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Update the pricing plan details for this product.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/admin/products/${productId}/pricing`}
          className="inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E7E8EC] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to Pricing
        </Link>
      </section>

      <form
        onSubmit={handleUpdate}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        {/* Main form */}
        <div className="min-w-0 space-y-6">
          {/* Basic information */}
          <section className={cardClass}>
            <SectionHeading
              icon={<CreditCard size={19} />}
              title="Plan Information"
              description="Edit the pricing plan name, price, and billing cycle."
            />

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="plan-name"
                  className={labelClass}
                >
                  Plan Name <Required />
                </label>

                <input
                  id="plan-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Professional"
                  disabled={saving}
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-gray-400">
                  Use a clear and recognizable name for
                  this pricing plan.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Price */}
                <div>
                  <label
                    htmlFor="plan-price"
                    className={labelClass}
                  >
                    Price
                  </label>

                  <div className="relative">
                    <input
                      id="plan-price"
                      type="number"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="e.g. 499"
                      disabled={saving}
                      className={`${inputClass} pr-10`}
                    />

                    <CircleDollarSign
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Leave blank if no price is configured.
                  </p>
                </div>

                {/* Billing cycle */}
                <div>
                  <label
                    htmlFor="plan-billing"
                    className={labelClass}
                  >
                    Billing Cycle
                  </label>

                  <select
                    id="plan-billing"
                    value={billing}
                    onChange={(event) =>
                      setBilling(event.target.value)
                    }
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">
                      Select billing cycle
                    </option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One-time">One-time</option>
                  </select>

                  <p className="mt-2 text-xs text-gray-400">
                    Select how frequently customers are billed.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className={cardClass}>
            <SectionHeading
              icon={<FileText size={19} />}
              title="Plan Description"
              description="Describe the features and benefits included in this plan."
            />

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="plan-description"
                  className={labelClass}
                >
                  Description
                </label>

                <span className="text-xs text-gray-400">
                  {description.length} characters
                </span>
              </div>

              <textarea
                id="plan-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={6}
                placeholder="Describe what this pricing plan includes..."
                disabled={saving}
                className="mt-2 w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-gray-400">
                Include the key details customers should know
                about this pricing plan.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 shadow-[0_5px_25px_rgba(15,23,42,0.025)] sm:flex-row sm:justify-end">
            <Link
              href={`/admin/products/${productId}/pricing`}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${hasChanges ? "bg-[#FFF4E7] text-[#B57930]" : "bg-[#EFF9F3] text-[#278455]"}`}>
                {hasChanges ? <Clock3 size={19} /> : <Check size={19} />}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#25232C]">{hasChanges ? "Unsaved Changes" : "All Changes Saved"}</h2>
                <p className="mt-1 text-xs text-[#77808E]">{hasChanges ? "Save to apply your updates." : "Your fields match the saved plan."}</p>
              </div>
            </div>
          </section>
          {/* Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <Check size={18} className="text-[#8065B0]" />

              <h2 className="text-sm font-bold text-gray-900">
                Plan Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Fields completed
              </span>

              <span className="text-sm font-bold text-gray-950">
                {completedFields}/4
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#9475C1] transition-all duration-300"
                style={{
                  width: `${(completedFields / 4) * 100}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-gray-400">
              This indicator reflects how many plan fields
              have been filled in.
            </p>
          </section>

          {/* Live preview */}
          <section className={cardClass}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">
                Plan Preview
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Preview of your current changes
              </p>
            </div>

            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <CreditCard size={19} />
              </div>

              <h3 className="mt-4 break-words text-lg font-bold text-gray-950">
                {name.trim() || "Plan Name"}
              </h3>

              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="break-all text-2xl font-bold tracking-tight text-gray-950">
                  {price !== "" ? price : "Not set"}
                </span>

                {billing && (
                  <span className="text-xs font-medium text-gray-500">
                    / {billing}
                  </span>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-500">
                {description.trim() ||
                  "Your plan description will appear here."}
              </p>
            </div>
          </section>

          {/* Tip */}
          <section className="rounded-[22px] border border-[#EAE7EF] bg-[#FAF8FD] p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-[#8065B0]" />

              <h2 className="text-sm font-bold text-gray-800">
                Helpful Tip
              </h2>
            </div>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Keep the plan name, pricing, and billing cycle
              accurate so visitors can compare plans easily.
            </p>
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
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-base font-bold text-gray-950">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-1 text-red-600">*</span>;
}
