
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";

type ProductSpecification = {
  id: number;
  value: string;
  specificationId: number;
  productId: number;
  specification: {
    id: number;
    name: string;
  };
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(35,25,60,0.025)]";

const inputClass =
  "w-full min-h-11 rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#272532] outline-none transition placeholder:text-[#9A94A3] focus:border-[#A38BCC] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

export default function EditVendorProductSpecificationPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const specificationId = params.specificationId as string;

  const [specificationName, setSpecificationName] = useState("");
  const [value, setValue] = useState("");
  const [originalValue, setOriginalValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!productId || !specificationId) return;

    async function loadProductSpecification() {
      try {
        setLoading(true);
        setLoadFailed(false);

        const response = await fetch(
          `/api/vendor/products/${productId}/specifications/${specificationId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load product specification."
          );

          setLoadFailed(true);
          return;
        }

        const item: ProductSpecification =
          data.productSpecification;

        setSpecificationName(item.specification.name);
        setValue(item.value);
        setOriginalValue(item.value);
      } catch (error) {
        console.error(
          "Load vendor product specification error:",
          error
        );

        toast.error("Failed to load product specification.");
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    void loadProductSpecification();
  }, [productId, specificationId]);

  const hasChanges =
    value.trim() !== originalValue.trim();

  const canSubmit =
    !loading &&
    !saving &&
    Boolean(value.trim()) &&
    hasChanges;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      toast.error("Specification value is required.");
      return;
    }

    if (!hasChanges) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/specifications/${specificationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: trimmedValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to update product specification."
        );
        return;
      }

      toast.success(
        "Product specification updated successfully."
      );

      router.push(
        `/vendor/products/${productId}/specifications`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Update vendor product specification error:",
        error
      );

      toast.error(
        "Something went wrong while updating the specification."
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
          <div className="h-[430px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-72 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
          <SlidersHorizontal size={22} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Specification unavailable
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          This product specification could not be loaded.
        </p>

        <Link
          href={`/vendor/products/${productId}/specifications`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Specifications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">

        <Link
          href={`/vendor/products/${productId}/specifications`}
          className="cursor-pointer hover:text-gray-900"
        >
          Specifications
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Edit Specification
        </span>
      </div>

      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <SlidersHorizontal size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Edit Specification</h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-2.5 py-1 text-[11px] font-medium text-[#77717F]">#{specificationId}</span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">Update the product-specific value without changing the reusable specification definition.</p>
          </div>
        </div>

        <Link
          href={`/vendor/products/${productId}/specifications`}
          className="inline-flex min-h-10 self-start items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Specifications
        </Link>
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Form */}
        <form
          id="edit-specification-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="flex items-center gap-3 border-b border-[#EEEAF2] px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <SlidersHorizontal size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#24232D]">
                Specification Details
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Review the specification and update its assigned value.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Read-only Specification */}
            <div>
              <label
                htmlFor="specification"
                className="mb-2 block text-[13px] font-medium text-[#44414C]"
              >
                Specification
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="specification"
                  type="text"
                  value={specificationName}
                  readOnly
                  aria-readonly="true"
                  className={`${inputClass} cursor-not-allowed bg-gray-100 pl-11 font-medium text-gray-500`}
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Specification definitions are managed by the platform
                administrator and cannot be changed here.
              </p>
            </div>

            {/* Editable Value */}
            <div>
              <label
                htmlFor="specification-value"
                className="mb-2 block text-[13px] font-medium text-[#44414C]"
              >
                Specification Value
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
              </label>

              <input
                id="specification-value"
                type="text"
                value={value}
                onChange={(event) =>
                  setValue(event.target.value)
                }
                placeholder="e.g. Windows 11"
                disabled={saving}
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Enter the value that applies specifically to this product.
              </p>
            </div>

            {/* Live Preview */}
            <div className="rounded-2xl border border-[#E4D9F5] bg-[#F8F5FD] p-5">
              <div className="flex items-center gap-2">
                <FileText size={17} className="text-[#8065B0]" />

                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8065B0]">
                  Live Preview
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-[13px] font-medium text-[#44414C]">
                  {specificationName}
                </span>

                <span className="break-words text-sm font-bold text-gray-950">
                  {value.trim() || "Value not entered"}
                </span>
              </div>
            </div>

            {/* Unsaved Changes Indicator */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#EEEAF2] bg-[#F8F7FA] p-4">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  hasChanges
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <CheckCircle2 size={17} />
              </span>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {hasChanges
                    ? "Unsaved Changes"
                    : "No Changes Yet"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {hasChanges
                    ? "You have modified the specification value. Save your changes to apply the update."
                    : "The specification value has not changed from its original value."}
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EEEAF2] bg-[#FCFBFD] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/specifications`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-[13px] font-medium text-[#44414C] transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
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
                  Update Specification
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={21} />
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  hasChanges
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {hasChanges ? "Unsaved" : "Unchanged"}
              </span>
            </div>

            <h2 className="mt-5 text-[15px] font-semibold text-[#24232D]">
              Specification Summary
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Review the current specification and its updated
              value before saving.
            </p>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Specification
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {specificationName}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Original Value
                </p>

                <p className="mt-2 break-words text-sm font-medium text-gray-600">
                  {originalValue || "Not configured"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Updated Value
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                  {value.trim() || "Not configured"}
                </p>
              </div>
            </div>

          </section>

          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={19} />
              </span>

              <h3 className="text-[15px] font-semibold text-[#24232D]">
                Helpful Information
              </h3>
            </div>

            <p className="mt-4 text-xs leading-6 text-gray-500">
              Updating this value changes only the specification
              assigned to your product.
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-[#EEEAF2] pt-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                The reusable specification name and definition
                remain unchanged.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage specifications. Grow your business.</p>
      </footer>
    </div>
  );
}
