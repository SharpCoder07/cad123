"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

type NewFeatureFormProps = {
  canViewFeatures: boolean;
};

export default function NewFeatureForm({
  canViewFeatures,
}: NewFeatureFormProps) {
  const router = useRouter();
  const backHref = canViewFeatures ? "/admin/features" : "/";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Feature name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create feature.");
        return;
      }

      toast.success("Feature created successfully.");

      setTimeout(() => {
        router.push(canViewFeatures ? "/admin/features" : "/");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Create feature error:", error);
      toast.error("Something went wrong while creating the feature.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292632] outline-none transition placeholder:text-[#A4A0AE] focus:border-[#B9A6D9] focus:ring-4 focus:ring-[#F2ECFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#97919F]"
          >
            <Link
              href={backHref}
              className="cursor-pointer transition hover:text-[#51436A]"
            >
              Features
            </Link>

            <ChevronRight size={14} />

            <span className="font-medium text-[#514A5B]">Add Feature</span>
          </nav>

          {/* Heading with icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <Sparkles size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Feature
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a reusable feature that can be assigned to products.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={backHref}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Features
        </Link>
      </header>

      {/* Content Grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* Feature Information */}
          <section className="overflow-hidden rounded-[20px] border border-[#E8E4EE] bg-white shadow-[0_4px_20px_rgba(42,32,63,0.025)]">
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2ECFA] text-[#856BB5]">
                  <Sparkles size={19} strokeWidth={1.8} />
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold text-[#292632]">
                    Feature Information
                  </h2>

                  <p className="mt-0.5 text-[12px] leading-5 text-[#898391]">
                    Define the reusable feature and explain what it provides.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* Feature Name */}
              <div>
                <label
                  htmlFor="feature-name"
                  className="text-[13px] font-medium text-[#44414C]"
                >
                  Feature Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="feature-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Cloud Collaboration"
                  disabled={saving}
                  className={inputClass}
                />

                <p className="mt-1.5 text-[12px] leading-5 text-[#96909E]">
                  Use a concise name that can be reused across multiple
                  products.
                </p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="feature-description"
                    className="text-[13px] font-medium text-[#44414C]"
                  >
                    Description
                  </label>

                  <span className="text-[11px] text-[#96909E]">
                    {description.length} characters
                  </span>
                </div>

                <textarea
                  id="feature-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe this feature..."
                  rows={7}
                  disabled={saving}
                  className={`${inputClass} resize-y leading-6`}
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#E8E4EE] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSave}
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
                  Save Feature
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Setup Status */}
          <section className="rounded-[20px] border border-[#E8E4EE] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2ECFA] text-[#856BB5]">
                <FileText size={19} strokeWidth={1.8} />
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-[#292632]">
                  Feature Setup
                </h3>

                <p className="mt-0.5 text-[12px] text-[#898391]">
                  Required information
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#77717F]">Feature name</span>

                {name.trim() ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1 text-[11px] font-medium text-[#278455]">
                    <CheckCircle2 size={12} />
                    Complete
                  </span>
                ) : (
                  <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1 text-[11px] font-medium text-[#77717F]">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#77717F]">Description</span>

                {description.trim() ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1 text-[11px] font-medium text-[#278455]">
                    <CheckCircle2 size={12} />
                    Added
                  </span>
                ) : (
                  <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1 text-[11px] font-medium text-[#77717F]">
                    Optional
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Information Card */}
          <section className="rounded-[20px] border border-[#E9E0F5] bg-[#F7F3FC] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9E0F5] bg-white text-[#856BB5]">
                <Lightbulb size={19} strokeWidth={1.8} />
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-[#51436A]">
                  Reusable Feature
                </h3>

                <p className="mt-1 text-[12px] leading-5 text-[#81758F]">
                  Features are maintained centrally and can be assigned to
                  multiple products from their product management pages.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
