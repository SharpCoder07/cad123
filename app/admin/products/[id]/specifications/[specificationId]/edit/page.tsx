
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  Save,
  SlidersHorizontal,
} from "lucide-react";

type ProductSpecification = {
  value: string;
  specification: {
    id: number;
    name: string;
  };
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function EditProductSpecificationPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const specificationId = params.specificationId as string;

  const backUrl = `/admin/products/${productId}/specifications`;

  const [specificationName, setSpecificationName] = useState("");
  const [value, setValue] = useState("");
  const [originalValue, setOriginalValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId || !specificationId) return;

    let active = true;

    async function loadProductSpecification() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch(
          `/api/admin/products/${productId}/specifications/${specificationId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(
              data.message ||
                "Failed to load product specification."
            );
          }
          return;
        }

        const item: ProductSpecification =
          data.productSpecification;

        if (!item || !item.specification) {
          if (active) {
            setLoadError(true);
            toast.error("Invalid specification data.");
          }
          return;
        }

        if (active) {
          setSpecificationName(item.specification.name);
          setValue(item.value ?? "");
          setOriginalValue(item.value ?? "");
        }
      } catch (error) {
        console.error(
          "Load product specification error:",
          error
        );

        if (active) {
          setLoadError(true);
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProductSpecification();

    return () => {
      active = false;
    };
  }, [productId, specificationId]);

  const hasValue = value.trim().length > 0;
  const hasChanges = value !== originalValue;
  const canSave = hasValue && hasChanges && !saving && !loadError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || loadError) return;

    if (!value.trim()) {
      toast.error("Specification value is required.");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/specifications/${specificationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: value.trim(),
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

      router.push(backUrl);
      router.refresh();
    } catch (error) {
      console.error(
        "Update product specification error:",
        error
      );
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-5">
            <div className="h-52 animate-pulse rounded-[24px] bg-white" />
            <div className="h-52 animate-pulse rounded-[24px] bg-white" />
          </div>

          <div className="h-64 animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={25} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#1F2430]">
            Unable to Load Specification
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#77808E]">
            We could not retrieve the product specification.
            Please return to the specifications page and try again.
          </p>

          <Link
            href={backUrl}
            className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-sm font-semibold text-white transition hover:bg-[#403948]"
          >
            <ArrowLeft size={17} />
            Back to Specifications
          </Link>
        </div>
      </div>
    );
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
              href={backUrl}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Specifications
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">
              Edit Specification
            </span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <SlidersHorizontal size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Product Specification
              </h1>

              <p className="mt-1 text-sm leading-6 text-[#77808E]">
                Update the value for this product specification.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={backUrl}
          className="inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to Specifications
        </Link>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        <div className="min-w-0 space-y-6">
          {/* Specification details */}
          <section className={cardClass}>
            <SectionHeading
              icon={<SlidersHorizontal size={19} />}
              title="Specification Details"
              description="Review the specification linked to this product."
            />

            <div className="p-5 sm:p-6">
              <label
                htmlFor="specification"
                className="block text-sm font-semibold text-gray-700"
              >
                Specification
              </label>

              <div className="relative mt-2">
                <input
                  id="specification"
                  type="text"
                  value={specificationName}
                  disabled
                  className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E5E2EA] bg-[#F8F6FA] px-4 pr-11 text-sm font-medium text-gray-600 outline-none"
                />

                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                The specification name cannot be changed here.
                You can only update its value for this product.
              </p>
            </div>
          </section>

          {/* Specification value */}
          <section className={cardClass}>
            <SectionHeading
              icon={<FileText size={19} />}
              title="Specification Value"
              description="Modify the value associated with this product."
            />

            <div className="p-5 sm:p-6">
              <label
                htmlFor="value"
                className="block text-sm font-semibold text-gray-700"
              >
                Value <span className="text-red-500">*</span>
              </label>

              <input
                id="value"
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="e.g. Windows 11"
                disabled={saving}
                required
                className="mt-2 h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FCFAFE] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Enter the updated value for this specification.
                This field cannot be empty.
              </p>

              {hasChanges && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-[#FFF7EB] px-4 py-3 text-xs font-medium text-[#A9772B]">
                  <Info size={16} className="shrink-0" />
                  You have unsaved changes.
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={backUrl}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving Changes...
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

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Status */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-gray-600"
              />

              <h2 className="text-sm font-bold text-gray-900">
                Update Status
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <StatusRow
                label="Specification loaded"
                completed={Boolean(specificationName)}
              />

              <StatusRow
                label="Value provided"
                completed={hasValue}
              />

              <StatusRow
                label="Changes made"
                completed={hasChanges}
              />
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              {hasChanges ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F5E3C6] bg-[#FFF7EB] px-2.5 py-1.5 text-xs font-semibold text-[#A9772B]">
                  <Info size={14} />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1.5 text-xs font-semibold text-[#77717F]">
                  <CheckCircle2 size={14} />
                  No Changes
                </span>
              )}
            </div>
          </section>

          {/* Preview */}
          <section className={cardClass}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">
                Specification Preview
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Preview the updated information
              </p>
            </div>

            <div className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={20} />
              </div>

              <h3 className="mt-4 break-words text-base font-bold text-[#1F2430]">
                {specificationName || "Specification"}
              </h3>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Value
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-gray-700">
                {value.trim() || "No value provided"}
              </p>

              {hasValue && hasChanges && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-semibold text-[#278455]">
                    <CheckCircle2 size={14} />
                    Ready to Save
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Tip */}
          <section className="rounded-[22px] border border-[#E5E2EA] bg-gray-50 p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-gray-600" />

              <h2 className="text-sm font-bold text-gray-800">
                Helpful Tip
              </h2>
            </div>

            <p className="mt-2 text-xs leading-6 text-[#77808E]">
              Updating this value only changes the specification
              assigned to this product. Other products using
              the same specification are unaffected.
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
        <h2 className="text-base font-bold text-[#1F2430]">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#77808E]">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          completed
            ? "bg-emerald-50 text-emerald-600"
            : "bg-[#F0EBFA] text-[#9C88BC]"
        }`}
      >
        {completed ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>

      <span
        className={`text-xs ${
          completed ? "text-gray-700" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
