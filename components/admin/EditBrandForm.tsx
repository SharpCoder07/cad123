"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Info,
  Loader2,
  Save,
  Tags,
} from "lucide-react";

type EditBrandFormProps = { canViewBrands: boolean };

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292630] outline-none transition placeholder:text-[#A09BA8] focus:border-[#AA98CA] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";
const labelClass = "text-[13px] font-medium text-[#44414C]";

function StatusBadge({
  ready,
  readyText = "Complete",
  emptyText = "Required",
}: {
  ready: boolean;
  readyText?: string;
  emptyText?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium ${ready ? "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]" : "border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]"}`}
    >
      {ready ? readyText : emptyText}
    </span>
  );
}

export default function EditBrandForm({ canViewBrands }: EditBrandFormProps) {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const backHref = canViewBrands ? "/admin/brands" : "/";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    async function loadBrand() {
      try {
        const response = await fetch(`/api/admin/brands/${id}`);
        const data = await response.json();
        if (!response.ok) {
          if (active) toast.error(data.message || "Failed to load brand.");
          return;
        }
        if (!active) return;
        const brand = data.brand;
        setName(brand.name || "");
        setSlug(brand.slug || "");
        setDescription(brand.description || "");
        setWebsite(brand.website || "");
        setLogo(brand.logo || "");
      } catch (error) {
        console.error("Failed to load brand:", error);
        if (active) toast.error("Failed to load brand.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadBrand();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      toast.error("Brand name is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Brand slug is required.");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/brands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, website, logo }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to update brand.");
        return;
      }
      toast.success("Brand updated successfully.");
      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Update brand error:", error);
      toast.error("Something went wrong while saving the brand.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-[13px] bg-[#F0EBFA]" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-[#EAE7EF]" />
            <div className="h-4 w-64 rounded bg-[#F0EDF3]" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div className="h-64 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-72 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-52 rounded-[20px] border border-[#EAE7EF] bg-white" />
          </div>
          <div className="space-y-5">
            <div className="h-56 rounded-[20px] border border-[#EAE7EF] bg-white" />
            <div className="h-36 rounded-[20px] border border-[#EAE7EF] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[#9993A2]">
            <Link
              href={backHref}
              className="cursor-pointer hover:text-gray-900"
            >
              Brands
            </Link>
            <ChevronRight size={13} />
            <span className="font-medium text-[#625C6A]">Edit Brand</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
               <Tags size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Brand
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Update the brand identity, content and media information.
              </p>
            </div>
          </div>
        </div>
        <Link
          href={backHref}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Brands
        </Link>
      </div>

      <form
        onSubmit={handleUpdate}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
        noValidate
      >
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(31,26,45,0.025)]">
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#292630]">
                Brand Information
              </h2>
              <p className="mt-1 text-[12px] text-[#8B8593]">
                Manage the core identity and URL used for this brand.
              </p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="brand-name" className={labelClass}>
                  Brand Name <span className="text-[#C65C64]">*</span>
                </label>
                <input
                  id="brand-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Autodesk"
                  disabled={saving}
                  className={fieldClass}
                />
                <p className="mt-1.5 text-[11px] text-[#9993A2]">
                  Use the official name of the software company or brand.
                </p>
              </div>
              <div>
                <label htmlFor="brand-slug" className={labelClass}>
                  Slug <span className="text-[#C65C64]">*</span>
                </label>
                <div className="mt-2 flex overflow-hidden rounded-xl border border-[#E5E2EA] bg-white transition focus-within:border-[#AA98CA] focus-within:ring-4 focus-within:ring-[#F0EBFA]">
                  <span className="flex items-center border-r border-[#E5E2EA] bg-[#F8F7FA] px-3 text-[12px] text-[#8B8593]">
                    /brands/
                  </span>
                  <input
                    id="brand-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="autodesk"
                    disabled={saving}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[13px] text-[#292630] outline-none placeholder:text-[#A09BA8] disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#9993A2]">
                  Use a lowercase, URL-friendly value such as autodesk.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(31,26,45,0.025)]">
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#292630]">
                Brand Content
              </h2>
              <p className="mt-1 text-[12px] text-[#8B8593]">
                Update the description and official website.
              </p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="brand-description" className={labelClass}>
                    Description
                  </label>
                  <span className="text-[11px] text-[#9993A2]">
                    {description.length} characters
                  </span>
                </div>
                <textarea
                  id="brand-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Add a short description about the brand..."
                  disabled={saving}
                  className={`${fieldClass} resize-y leading-6`}
                />
              </div>
              <div>
                <label htmlFor="brand-website" className={labelClass}>
                  Official Website
                </label>
                <div className="relative">
                  <Globe
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-[27px] text-[#A09BA8]"
                  />
                  <input
                    id="brand-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.example.com"
                    disabled={saving}
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(31,26,45,0.025)]">
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#292630]">
                Brand Media
              </h2>
              <p className="mt-1 text-[12px] text-[#8B8593]">
                Update the logo displayed across the CADGram catalog.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <label htmlFor="brand-logo" className={labelClass}>
                Logo URL
              </label>
              <div className="relative">
                <ImageIcon
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-[27px] text-[#A09BA8]"
                />
                <input
                  id="brand-logo"
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={saving}
                  className={`${fieldClass} pl-10`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#9993A2]">
                Use a publicly accessible image URL for the logo.
              </p>
              {logo.trim() && (
                <div className="mt-4 rounded-xl border border-[#EAE7EF] bg-[#FAF9FC] p-4">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#9993A2]">
                    Logo Preview
                  </p>
                  <div className="flex h-24 items-center justify-center rounded-xl border border-[#EAE7EF] bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt={name || "Brand logo preview"}
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 shadow-[0_5px_20px_rgba(31,26,45,0.025)] sm:flex-row sm:items-center sm:justify-end">
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
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-[0_5px_20px_rgba(31,26,45,0.025)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-[#292630]">
                  Brand Details
                </h3>
                <p className="mt-0.5 text-[12px] text-[#8B8593]">
                  Current information
                </p>
              </div>
            </div>
            <div className="space-y-3.5">
              {[
                {
                  label: "Brand name",
                  ready: Boolean(name.trim()),
                  required: true,
                },
                { label: "Slug", ready: Boolean(slug.trim()), required: true },
                {
                  label: "Website",
                  ready: Boolean(website.trim()),
                  required: false,
                },
                { label: "Logo", ready: Boolean(logo.trim()), required: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[12px] text-[#77717F]">
                    {item.label}
                  </span>
                  <StatusBadge
                    ready={item.ready}
                    readyText={item.required ? "Complete" : "Added"}
                    emptyText={item.required ? "Required" : "Optional"}
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-[20px] border border-[#E4DDF1] bg-[#F7F3FC] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE5F8] text-[#8065B0]">
                <Info size={17} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-[#51436B]">
                  Brand Details
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[#817391]">
                  Changes made here update the existing brand information used
                  throughout the CADGram catalog.
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
            <div className="flex items-center gap-2 text-[#8065B0]">
              <Tags size={17} />
              <h3 className="text-[13px] font-semibold text-[#292630]">
                Brand Preview
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#EAE7EF] bg-[#FAF9FC] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[14px] font-semibold text-[#8065B0]">
                {name.trim().charAt(0).toUpperCase() || "B"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#292630]">
                  {name.trim() || "Brand name"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#9993A2]">
                  {slug.trim() || "brand-slug"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
