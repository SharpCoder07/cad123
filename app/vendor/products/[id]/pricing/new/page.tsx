
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm text-[#1F2430] outline-none transition placeholder:text-gray-400 focus:border-[#A68BD4] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass =
  "mb-2 block text-[13px] font-semibold text-[#44414C]";

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(38,31,55,0.025)]";

export default function VendorNewPricingPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    if (price && Number(price) < 0) {
      toast.error("Price cannot be a negative number.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/pricing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            price,
            billingCycle,
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to create pricing plan."
        );
        return;
      }

      toast.success(
        "Pricing plan created successfully."
      );

      router.push(
        `/vendor/products/${productId}/pricing`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Create vendor pricing plan error:",
        error
      );

      toast.error(
        "Something went wrong while creating the pricing plan."
      );
    } finally {
      setSaving(false);
    }
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
          Add Plan
        </span>
      </div>

      {/* Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <CreditCard size={22} strokeWidth={1.9} />
          </span>

          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Add Pricing Plan
            </h1>

            <p className="mt-1 text-[14px] leading-5 text-[#77808E]">
              Create a new pricing option for your product.
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
              <h2 className="text-[15px] font-semibold text-[#1F2430]">
                Plan Information
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Enter the pricing and billing details for this plan.
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
                  htmlFor="billing-cycle"
                  className={labelClass}
                >
                  Billing Cycle
                </label>

                <select
                  id="billing-cycle"
                  value={billingCycle}
                  onChange={(event) =>
                    setBillingCycle(event.target.value)
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
                htmlFor="plan-description"
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
                  id="plan-description"
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

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FBFAFD] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/pricing`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
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
                  Save Pricing Plan
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

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                New
              </span>
            </div>

            <h2 className="mt-5 text-[15px] font-semibold text-[#1F2430]">
              Pricing Plan
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Create a pricing option for your product catalog.
              You can update the plan later from the Pricing page.
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

              <h3 className="text-[14px] font-semibold text-[#1F2430]">
                Helpful Information
              </h3>
            </div>

            <p className="mt-4 text-xs leading-6 text-gray-500">
              A clear pricing plan helps customers understand
              the available purchasing options. If you do not
              want to display a price, leave the Price field empty.
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-4">
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

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>
          Configure pricing. Manage your catalog.
        </p>
      </footer>
    </div>
  );
}
