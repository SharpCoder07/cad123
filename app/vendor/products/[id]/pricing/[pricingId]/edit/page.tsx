
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Info,
  LoaderCircle,
  Save,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { toast } from "react-toastify";

type PricingPlan = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  billing: string | null;
};

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm text-[#25232C] outline-none transition placeholder:text-[#A19AAA] focus:border-[#A78BDA] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

const labelClass =
  "mb-2 block text-[13px] font-medium text-[#44414C]";

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

export default function VendorEditPricingPage() {
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
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!productId || !pricingId) return;

    async function loadPricingPlan() {
      try {
        setLoading(true);
        setLoadFailed(false);

        const response = await fetch(
          `/api/vendor/products/${productId}/pricing/${pricingId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load pricing plan."
          );
          setLoadFailed(true);
          return;
        }

        const plan: PricingPlan = data.pricingPlan;

        setName(plan.name || "");

        setPrice(
          plan.price !== null
            ? String(plan.price)
            : ""
        );

        setBilling(plan.billing || "");
        setDescription(plan.description || "");
      } catch (error) {
        console.error(
          "Failed to load vendor pricing plan:",
          error
        );

        toast.error("Failed to load pricing plan.");
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    void loadPricingPlan();
  }, [productId, pricingId]);

  async function handleUpdate() {
    if (!name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    if (price && Number(price) < 0) {
      toast.error(
        "Price cannot be a negative number."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/pricing/${pricingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            price,
            billing,
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to update pricing plan."
        );
        return;
      }

      toast.success(
        "Pricing plan updated successfully."
      );

      router.push(
        `/vendor/products/${productId}/pricing`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Update vendor pricing plan error:",
        error
      );

      toast.error(
        "Something went wrong while updating the pricing plan."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-12 w-80 max-w-full animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="h-[500px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-72 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#8065B0]">
          <CreditCard size={22} />
        </span>

        <h1 className="mt-5 text-xl font-semibold text-[#25232C]">
          Pricing plan unavailable
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          This pricing plan could not be loaded.
        </p>

        <Link
          href={`/vendor/products/${productId}/pricing`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
      
        <Link
          href={`/vendor/products/${productId}/pricing`}
          className="cursor-pointer hover:text-gray-900"
        >
          Pricing
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Edit Plan
        </span>
      </div>

      {/* Heading — matches the Super Admin Edit Feature layout */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <CreditCard size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Pricing Plan
              </h1>
              <span className="rounded-lg border border-[#E7E3ED] bg-[#F8F7FA] px-2.5 py-1 text-xs font-medium text-[#797285]">
                #{pricingId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Update the pricing and billing information for this plan.
            </p>
          </div>
        </div>
        <Link
          href={`/vendor/products/${productId}/pricing`}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Pricing
        </Link>
      </section>

      {/* Form Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Form */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-start gap-3 border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <CreditCard size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#25232C]">
                Plan Information
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Update the details displayed for this pricing plan.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Plan Name */}
            <div>
              <label
                htmlFor="plan-name"
                className={labelClass}
              >
                Plan Name
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
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
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-400">
                Give this pricing option a clear, recognizable name.
              </p>
            </div>

            {/* Price and Billing */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="plan-price"
                  className={labelClass}
                >
                  Price
                </label>

                <div className="relative">
                  <CircleDollarSign
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="plan-price"
                    type="number"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="499"
                    min="0"
                    step="0.01"
                    disabled={saving}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Leave empty if pricing is not publicly disclosed.
                </p>
              </div>

              <div>
                <label
                  htmlFor="billing"
                  className={labelClass}
                >
                  Billing Cycle
                </label>

                <select
                  id="billing"
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

                  <option value="Monthly">
                    Monthly
                  </option>

                  <option value="Yearly">
                    Yearly
                  </option>

                  <option value="One-time">
                    One-time
                  </option>
                </select>

                <p className="mt-2 text-xs text-gray-400">
                  Choose how frequently customers are billed.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className={labelClass}
              >
                Description
              </label>

              <div className="relative">
                <FileText
                  size={18}
                  className="pointer-events-none absolute left-4 top-4 text-gray-400"
                />

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={6}
                  placeholder="Describe what this pricing plan includes..."
                  disabled={saving}
                  className={`${inputClass} resize-y pl-11 leading-6`}
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Include important information about this plan.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#F0EDF3] bg-[#FCFBFE] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/pricing`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
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
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Tag size={21} />
              </span>

              <span className="rounded-full bg-[#F0EBFA] px-3 py-1.5 text-[11px] font-medium text-[#8065B0]">
                Editing
              </span>
            </div>

            <h2 className="mt-5 text-[15px] font-semibold text-[#25232C]">
              {name || "Pricing Plan"}
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Review the information before saving your changes.
              You can return to this page to update the plan later.
            </p>

            <div className="mt-5 space-y-3 rounded-2xl bg-[#F8F6FA] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2
                  size={16}
                  className="text-gray-500"
                />
                Plan name
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2
                  size={16}
                  className="text-gray-500"
                />
                Optional price
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2
                  size={16}
                  className="text-gray-500"
                />
                Billing cycle
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2
                  size={16}
                  className="text-gray-500"
                />
                Plan description
              </div>
            </div>

          </section>

          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={19} />
              </span>

              <h3 className="text-sm font-semibold text-[#25232C]">
                Helpful Information
              </h3>
            </div>

            <p className="mt-4 text-xs leading-6 text-gray-500">
              Updating the price, billing cycle, or description
              changes the information associated with this
              pricing plan.
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-[#F0EDF3] pt-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                Product publishing and approval remain
                controlled by the Super Admin.
              </p>
            </div>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>
          Manage pricing. Grow your business.
        </p>
      </footer>
    </div>
  );
}
