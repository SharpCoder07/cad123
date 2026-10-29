"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  Search,
  SlidersHorizontal,
  AlertCircle,
  X,
  Save,
} from "lucide-react";

type Specification = { id: number; name: string };
const card =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";
const secondaryButton =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]";
const primaryButton =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50";

export default function NewProductSpecificationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const backUrl = `/admin/products/${id}/specifications`;
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [specificationId, setSpecificationId] = useState("");
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setLoadError(false);
        const response = await fetch("/api/admin/specifications");
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(data.message || "Failed to load specifications.");
          }
          return;
        }
        if (active)
          setSpecifications(
            Array.isArray(data.specifications) ? data.specifications : [],
          );
      } catch (error) {
        console.error("Load specifications error:", error);
        if (active) {
          setLoadError(true);
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return specifications.filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        String(item.id).includes(query),
    );
  }, [search, specifications]);
  const selected = specifications.find(
    (item) => String(item.id) === specificationId,
  );
  const completed = Number(Boolean(selected)) + Number(Boolean(value.trim()));
  const canSubmit =
    !loading &&
    !loadError &&
    !saving &&
    Boolean(selected) &&
    Boolean(value.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError) return;
    if (!selected) {
      toast.error("Please select a specification.");
      return;
    }
    if (!value.trim()) {
      toast.error("Specification value is required.");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/products/${id}/specifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specificationId: selected.id,
          value: value.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add product specification.");
        return;
      }
      toast.success("Product specification added successfully.");
      router.push(backUrl);
      router.refresh();
    } catch (error) {
      console.error("Add product specification error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#94909D]"
          >
            <Link href={backUrl} className="cursor-pointer hover:text-gray-900">
              Specifications
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#37323F]">Add Specification</span>
          </nav>
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <SlidersHorizontal size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Product Specification
              </h1>
              <p className="mt-1 text-[13px] leading-6 text-[#77808E]">
                Choose a reusable specification and define its value for this
                product.
              </p>
            </div>
          </div>
        </div>
        <Link href={backUrl} className={secondaryButton}>
          <ArrowLeft size={16} /> Back to Specifications
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        <div className="min-w-0 space-y-5">
          <section className={card}>
            <SectionHeading
              icon={<SlidersHorizontal size={19} />}
              title="Select Specification"
              description="Choose one specification from your reusable library."
            />
            <div className="p-5 sm:p-6">
              {loading ? (
                <div className="space-y-3" aria-label="Loading specifications">
                  <div className="h-11 animate-pulse rounded-xl bg-[#F5F2F9]" />
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-20 animate-pulse rounded-2xl bg-[#F7F5FA]"
                    />
                  ))}
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-[#F6D9DC] bg-[#FFF4F4] p-5">
                  <AlertCircle size={23} className="text-[#D95A69]" />
                  <h3 className="mt-3 text-sm font-semibold text-[#9D3543]">
                    Unable to load specifications
                  </h3>
                  <p className="mt-1 text-sm text-[#A46A73]">
                    Please try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((n) => n + 1)}
                    className={`mt-4 ${secondaryButton}`}
                  >
                    Retry
                  </button>
                </div>
              ) : specifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E6DEEF] bg-[#FAF8FD] px-6 py-12 text-center">
                  <SlidersHorizontal
                    size={28}
                    className="mx-auto text-[#9D83C8]"
                  />
                  <h3 className="mt-4 text-sm font-semibold text-[#272330]">
                    No specifications available
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#77808E]">
                    Create a reusable specification before assigning it to a
                    product.
                  </p>
                  <Link
                    href="/admin/specifications"
                    className={`mt-5 ${primaryButton}`}
                  >
                    Go to Specification Library
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="specification-search"
                      className="text-[13px] font-semibold text-[#37323F]"
                    >
                      Search Specifications
                    </label>
                    <span className="rounded-full bg-[#F3EFF9] px-3 py-1 text-[11px] font-medium text-[#8065B0]">
                      {filtered.length} of {specifications.length}{" "}
                      specifications
                    </span>
                  </div>
                  <div className="relative mt-3">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A59DB2]"
                    />
                    <input
                      id="specification-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      disabled={saving}
                      placeholder="Search by name or ID..."
                      className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-11 pr-10 text-[13px] text-[#302B38] outline-none transition placeholder:text-[#A59DB2] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
                    />
                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9B93A5] hover:text-[#574A66]"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between gap-3">
                    <p className="text-xs text-[#8B8494]">
                      Select one specification to continue
                    </p>
                    {selected && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setSpecificationId("")}
                        className="cursor-pointer text-xs font-medium text-[#8065B0] hover:underline disabled:opacity-50"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                  <div
                    className="mt-4 max-h-[390px] space-y-2.5 overflow-y-auto pr-1"
                    role="group"
                    aria-label="Available specifications"
                  >
                    {filtered.length ? (
                      filtered.map((item) => {
                        const chosen = specificationId === String(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={chosen}
                            disabled={saving}
                            onClick={() => setSpecificationId(String(item.id))}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${chosen ? "border-[#A48ACD] bg-[#F7F2FF] ring-1 ring-[#C9B7E6]" : "border-[#EAE7EF] bg-white hover:border-[#CBBCE2] hover:bg-[#FCFAFF]"}`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${chosen ? "border-[#886BB9] bg-[#886BB9] text-white" : "border-[#CEC8D7] bg-white"}`}
                            >
                              {chosen && <Check size={12} strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-[13px] font-semibold text-[#2C2834]">
                                {item.name}
                              </span>
                              <span className="mt-1 block text-[11px] text-[#928A9C]">
                                Specification #{item.id}
                              </span>
                            </span>
                            {chosen && (
                              <span className="rounded-lg bg-[#EAE0F9] px-2.5 py-1 text-[11px] font-medium text-[#7655A9]">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#E7E0EF] bg-[#FAF8FD] px-5 py-10 text-center">
                        <Search size={23} className="mx-auto text-[#AA9ABF]" />
                        <h3 className="mt-3 text-sm font-semibold text-[#393142]">
                          No matching specifications
                        </h3>
                        <p className="mt-1 text-xs text-[#918A9A]">
                          Try a different keyword.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={card}>
            <SectionHeading
              icon={<FileText size={19} />}
              title="Specification Value"
              description="Provide the value that applies to this product."
            />
            <div className="p-5 sm:p-6">
              <label
                htmlFor="specification-value"
                className="text-[13px] font-semibold text-[#37323F]"
              >
                Value <span className="text-[#DC5361]">*</span>
              </label>
              <input
                id="specification-value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={saving}
                required
                placeholder="e.g. Windows 11"
                className="mt-2 h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] px-4 text-[13px] text-[#302B38] outline-none transition placeholder:text-[#A59DB2] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-2 text-xs leading-5 text-[#928A9C]">
                Enter the actual specification value for this product. This
                field is required.
              </p>
            </div>
          </section>
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link href={backUrl} className={secondaryButton}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className={primaryButton}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={17} /> Save Specification
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className={`${card} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#8065B0]" />
              <h2 className="text-sm font-semibold text-[#2E2936]">
                Form Completion
              </h2>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-[#827A8C]">
              <span>Required fields</span>
              <span className="text-sm font-semibold text-[#302B38]">
                {completed}/2
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1EDF6]">
              <div
                className="h-full rounded-full bg-[#9C80CA] transition-all duration-300"
                style={{ width: `${completed * 50}%` }}
              />
            </div>
            <div className="mt-5 space-y-3">
              <CompletionRow
                label="Specification selected"
                completed={Boolean(selected)}
              />
              <CompletionRow
                label="Value provided"
                completed={Boolean(value.trim())}
              />
            </div>
          </section>
          <section className={card}>
            <div className="border-b border-[#F0EDF3] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#2E2936]">
                Specification Preview
              </h2>
              <p className="mt-1 text-xs text-[#928A9C]">
                Review the details before saving
              </p>
            </div>
            <div className="p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={20} />
              </span>
              <h3 className="mt-4 break-words text-sm font-semibold text-[#302B38]">
                {selected?.name || "No specification selected"}
              </h3>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-[#9A90A5]">
                Value
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#575160]">
                {value.trim() || "No value entered"}
              </p>
              {completed === 2 && (
                <div className="mt-4 border-t border-[#F0EDF3] pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-medium text-[#278455]">
                    <CheckCircle2 size={14} /> Ready to Save
                  </span>
                </div>
              )}
            </div>
          </section>
          <section className="rounded-[20px] border border-[#E9E1F5] bg-[#F7F3FD] p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-[#8065B0]" />
              <h2 className="text-sm font-semibold text-[#604D7B]">
                Helpful Tip
              </h2>
            </div>
            <p className="mt-2 text-xs leading-6 text-[#81718E]">
              Specifications describe structured product details such as
              operating systems, supported formats, compatibility, or technical
              requirements.
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
    <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>
      <div>
        <h2 className="text-[14px] font-semibold text-[#2C2834]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#8A8391]">{description}</p>
      </div>
    </div>
  );
}
function CompletionRow({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${completed ? "bg-[#E4F4EB] text-[#278455]" : "bg-[#F0EDF3] text-[#A39BAA]"}`}
      >
        {completed ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-[#B7B0C0]" />
        )}
      </span>
      <span
        className={`text-xs ${completed ? "text-[#514B58]" : "text-[#9A92A1]"}`}
      >
        {label}
      </span>
    </div>
  );
}
