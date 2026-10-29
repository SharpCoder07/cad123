"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Save,
  Plus,
} from "lucide-react";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-semibold text-gray-700";

export default function NewPricingPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const completedFields = [
    name.trim().length > 0,
    price.trim().length > 0 &&
      Number.isFinite(Number(price)) &&
      Number(price) >= 0,
    billingCycle.length > 0,
    description.trim().length > 0,
  ].filter(Boolean).length;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

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

      const response = await fetch(`/api/admin/products/${productId}/pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price,
          billingCycle,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create pricing plan.");
        return;
      }

      toast.success("Pricing plan created successfully.");

      router.push(`/admin/products/${productId}/pricing`);
      router.refresh();
    } catch (error) {
      console.error("Create pricing plan error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Header */}
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
              Add Pricing Plan
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0]">
              <CreditCard size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Pricing Plan
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Create a new pricing plan for this product.
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
        onSubmit={handleSave}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        {/* Main form */}
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]">
            <SectionHeading
              icon={<CreditCard size={19} />}
              title="Plan Information"
              description="Configure the basic details of your pricing plan."
            />

            <div className="space-y-6 p-5 sm:p-6">
              {/* Plan name */}
              <div>
                <label htmlFor="plan-name" className={labelClass}>
                  Plan Name <Required />
                </label>

                <input
                  id="plan-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Professional"
                  disabled={saving}
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-gray-400">
                  Choose a clear name that identifies this plan.
                </p>
              </div>

              {/* Price and billing */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="plan-price" className={labelClass}>
                    Price
                  </label>

                  <div className="relative">
                    <input
                      id="plan-price"
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="e.g. 499"
                      min="0"
                      step="0.01"
                      disabled={saving}
                      className={`${inputClass} pr-10`}
                    />

                    <CircleDollarSign
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Enter the plan price, if applicable.
                  </p>
                </div>

                <div>
                  <label htmlFor="billing-cycle" className={labelClass}>
                    Billing Cycle
                  </label>

                  <select
                    id="billing-cycle"
                    value={billingCycle}
                    onChange={(event) => setBillingCycle(event.target.value)}
                    disabled={saving}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Select billing cycle</option>

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
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]">
            <SectionHeading
              icon={<FileText size={19} />}
              title="Plan Description"
              description="Explain what customers receive with this plan."
            />

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="plan-description" className={labelClass}>
                  Description
                </label>

                <span className="text-xs text-gray-400">
                  {description.length} characters
                </span>
              </div>

              <textarea
                id="plan-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                placeholder="Describe what this pricing plan includes..."
                disabled={saving}
                className="mt-2 w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-gray-400">
                Include key benefits or important details about the plan.
              </p>
            </div>
          </section>

          {/* Bottom actions */}
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
                  <Loader2 size={17} className="animate-spin" />
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
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Completion */}
          <section className="rounded-[24px] border border-[#E8EAED] bg-white p-5 shadow-[0_5px_25px_rgba(15,23,42,0.025)]">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-900">
                Plan Completion
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Fields completed
              </span>

              <span className="text-sm font-bold text-[#1F2430]">
                {completedFields}/4
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#9474C0] transition-all duration-300"
                style={{
                  width: `${(completedFields / 4) * 100}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-gray-400">
              Complete the fields to provide detailed pricing information.
            </p>
          </section>

          {/* Preview */}
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Plan Preview</h2>

              <p className="mt-1 text-xs text-gray-400">
                Preview of the entered information
              </p>
            </div>

            <div className="p-5">
              <h3 className="mt-1 break-words text-sm font-bold text-[#1F2430]">
                {name.trim() || "Plan Name"}
              </h3>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="break-all text-sm font-bold tracking-tight text-[#1F2430]">
                  {price !== "" ? price : "Not set"}
                </span>

                {billingCycle && (
                  <span className="text-xs font-medium text-gray-500">
                    / {billingCycle}
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
          <section className="rounded-[20px] border border-[#E8E0F4] bg-[#F8F5FD] p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-800">Helpful Tip</h2>
            </div>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Use descriptive plan names and specify billing details so visitors
              can easily compare available plans.
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
        <h2 className="text-base font-bold text-[#1F2430]">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-1 text-red-600">*</span>;
}
