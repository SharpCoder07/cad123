"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  Pencil,
  Save,
  SlidersHorizontal,
} from "lucide-react";

type EditSpecificationFormProps = {
  canViewSpecifications: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292632] outline-none transition placeholder:text-[#A4A0AE] focus:border-[#B9A6D9] focus:ring-4 focus:ring-[#F2ECFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

export default function EditSpecificationForm({
  canViewSpecifications,
}: EditSpecificationFormProps) {
  const params = useParams();
  const router = useRouter();
  const backHref = canViewSpecifications ? "/admin/specifications" : "/";
  const specificationId = params.id as string;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSpecification() {
      try {
        const response = await fetch(`/api/admin/specifications/${specificationId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to load specification.");
          return;
        }

        setName(data.specification.name || "");
      } catch (error) {
        console.error("Load specification error:", error);
        toast.error("Something went wrong while loading the specification.");
      } finally {
        setLoading(false);
      }
    }

    if (specificationId) {
      loadSpecification();
    }
  }, [specificationId]);

  async function handleUpdate() {
    if (!name.trim()) {
      toast.error("Specification name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/specifications/${specificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update specification.");
        return;
      }

      toast.success("Specification updated successfully.");

      setTimeout(() => {
        router.push(canViewSpecifications ? "/admin/specifications" : "/");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Update specification error:", error);
      toast.error("Something went wrong while updating the specification.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="h-3 w-36 rounded bg-[#E9E5EF]" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#E9E5EF]" />
              <div className="space-y-2">
                <div className="h-6 w-44 rounded bg-[#E9E5EF]" />
                <div className="h-4 w-72 max-w-full rounded bg-[#E9E5EF]" />
              </div>
            </div>
          </div>
          <div className="h-10 w-40 rounded-xl bg-[#E9E5EF]" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div className="h-80 rounded-[20px] border border-[#E8E4EE] bg-white" />
            <div className="h-20 rounded-[20px] border border-[#E8E4EE] bg-white" />
          </div>
          <div className="space-y-5">
            <div className="h-52 rounded-[20px] border border-[#E8E4EE] bg-white" />
            <div className="h-48 rounded-[20px] border border-[#E8E4EE] bg-white" />
            <div className="h-28 rounded-[20px] border border-[#E8E4EE] bg-[#F7F3FC]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#97919F]"
          >
            <Link href={backHref} className="cursor-pointer transition hover:text-[#51436A]">
              Specifications
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#514A5B]">Edit Specification</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <SlidersHorizontal size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                  Edit Specification
                </h1>
                <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1 text-xs font-medium text-[#77717F]">
                  #{specificationId}
                </span>
              </div>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Update the reusable specification used across your product catalog.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={backHref}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Specifications
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <section
            id="specification-information"
            className="overflow-hidden rounded-[20px] border border-[#E8E4EE] bg-white shadow-[0_4px_20px_rgba(42,32,63,0.025)]"
          >
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2ECFA] text-[#856BB5]">
                  <SlidersHorizontal size={19} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#292632]">
                    Specification Information
                  </h2>
                  <p className="mt-0.5 text-[12px] leading-5 text-[#898391]">
                    Keep the specification name clear and reusable.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="specification-name" className="text-[13px] font-medium text-[#44414C]">
                  Specification Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="specification-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={saving}
                  placeholder="e.g. Operating System"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[12px] leading-5 text-[#96909E]">
                  Use a clear specification name that can be reused across products.
                </p>
              </div>

            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#E8E4EE] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleUpdate}
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

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-[#E8E4EE] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2ECFA] text-[#856BB5]">
                <FileText size={19} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#292632]">Specification Status</h3>
                <p className="mt-0.5 text-[12px] text-[#898391]">Current content</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#77717F]">Specification name</span>
                {name.trim() ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1 text-[11px] font-medium text-[#278455]">
                    <CheckCircle2 size={12} /> Set
                  </span>
                ) : (
                  <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1 text-[11px] font-medium text-[#77717F]">
                    Required
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#E8E4EE] bg-white p-5">
            <h3 className="text-[14px] font-semibold text-[#292632]">Specification Preview</h3>
            <p className="mt-0.5 text-[12px] text-[#898391]">
              Preview the current specification name.
            </p>
            <div className="mt-4 rounded-xl border border-[#E9E0F5] bg-[#FAF8FD] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9E0F5] bg-white text-[#856BB5]">
                  <SlidersHorizontal size={19} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-[13px] font-semibold text-[#292632]">
                    {name || "Specification Name"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#E9E0F5] bg-[#F7F3FC] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9E0F5] bg-white text-[#856BB5]">
                <Lightbulb size={19} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#51436A]">Reusable Specification</h3>
                <p className="mt-1 text-[12px] leading-5 text-[#81758F]">
                  This specification remains a shared catalog item and can be assigned
                  to products from their product management pages.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
