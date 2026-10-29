"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Info,
  Loader2,
  Save,
  SlidersHorizontal,
} from "lucide-react";

type NewSpecificationFormProps = {
  canViewSpecifications: boolean;
};

export default function NewSpecificationForm({
  canViewSpecifications,
}: NewSpecificationFormProps) {
  const router = useRouter();
  const backHref = canViewSpecifications ? "/admin/specifications" : "/";
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Specification name is required.");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch("/api/admin/specifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create specification.");
        return;
      }
      toast.success("Specification created successfully.");
      setTimeout(() => {
        router.push(canViewSpecifications ? "/admin/specifications" : "/");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Create specification error:", error);
      toast.error("Something went wrong while creating the specification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-1.5 text-[12px] text-[#92909B]"
          >
            <Link
              href={backHref}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Specifications
            </Link>
            <ChevronRight size={13} />
            <span className="font-medium text-[#514B59]">
              Add Specification
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA]  text-[#8059BD] shadow-sm">
              <SlidersHorizontal size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Specification
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a reusable specification for product information.
              </p>
            </div>
          </div>
        </div>
        <Link
          href={backHref}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={15} /> Back to Specifications
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[20px] border border-[#E9E5EE] bg-white shadow-[0_4px_22px_rgba(31,36,48,0.025)]">
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <SlidersHorizontal size={17} />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#26232D]">
                    Specification Information
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#898390]">
                    Define a reusable specification field for your products.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <label
                htmlFor="name"
                className="block text-[13px] font-medium text-[#3B3542]"
              >
                Specification Name <span className="text-[#D75A66]">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Operating System"
                disabled={saving}
                required
                className="mt-2 h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-3.5 text-[13px] text-[#26232D] outline-none transition placeholder:text-[#A6A1AC] focus:border-[#AA95CD] focus:ring-4 focus:ring-[#F2ECFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FB]"
              />
              <p className="mt-2 text-[12px] leading-5 text-[#8A8490]">
                Use a clear name such as Operating System, Storage, Processor,
                or License Type.
              </p>
            </div>
          </section>
          <div className="flex flex-col-reverse gap-3 rounded-[18px] border border-[#E9E5EE] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Specification"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-[#E9E5EE] bg-white p-5 shadow-[0_4px_22px_rgba(31,36,48,0.025)]">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ClipboardList size={17} />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-[#26232D]">
                  Specification Setup
                </h3>
                <p className="text-[12px] text-[#898390]">
                  Required information
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-[#625C68]">
                Specification name
              </span>
              {name.trim() ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1 text-[11px] font-medium text-[#278455]">
                  <CheckCircle2 size={12} /> Complete
                </span>
              ) : (
                <span className="rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-2.5 py-1 text-[11px] font-medium text-[#77717F]">
                  Required
                </span>
              )}
            </div>
          </section>
          <section className="rounded-[20px] border border-[#E6DDF3] bg-[#F7F3FC] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8DFF3] bg-white text-[#8065B0]">
                <Info size={17} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-[#55446D]">
                  Reusable Specification
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[#7B6B90]">
                  Specifications are managed centrally and can be assigned to
                  products from the product management workspace.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
