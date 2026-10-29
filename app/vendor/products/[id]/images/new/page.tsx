"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  ChevronRight,
  FileImage,
  ImageIcon,
  Images,
  Info,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";

const IMAGE_TYPES = [
  {
    value: "gallery",
    label: "Gallery",
    description: "Displayed inside the product image gallery.",
    icon: Images,
  },
  {
    value: "hero",
    label: "Hero",
    description: "Used as a primary product visual.",
    icon: ImageIcon,
  },
  {
    value: "thumbnail",
    label: "Thumbnail",
    description: "Used as a compact product preview.",
    icon: FileImage,
  },
  {
    value: "logo",
    label: "Logo",
    description: "Used for product or software branding.",
    icon: ShieldCheck,
  },
];

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(35,24,55,0.025)]";

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#25232C] outline-none transition placeholder:text-[#A39EAB] focus:border-[#A88DD7] focus:ring-4 focus:ring-[#F2ECFC] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

export default function NewVendorProductImagePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [type, setType] = useState("gallery");
  const [sortOrder, setSortOrder] = useState("0");

  const [saving, setSaving] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const selectedType = useMemo(
    () => IMAGE_TYPES.find((item) => item.value === type),
    [type],
  );

  const imageUrl = url.trim();

  const isValidUrl = useMemo(() => {
    if (!imageUrl) return false;

    try {
      const parsedUrl = new URL(imageUrl);

      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }, [imageUrl]);

  const parsedSortOrder = Number(sortOrder);

  const isValidSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(parsedSortOrder) &&
    parsedSortOrder >= 0;

  const canSubmit =
    !saving && Boolean(imageUrl) && isValidUrl && isValidSortOrder;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageUrl) {
      toast.error("Image URL is required.");
      return;
    }

    try {
      const parsedUrl = new URL(imageUrl);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Invalid image URL protocol.");
      }
    } catch {
      toast.error("Please enter a valid image URL.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      toast.error("Sort order must be a non-negative integer.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/vendor/products/${productId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: imageUrl,
          altText: altText.trim(),
          type,
          sortOrder: parsedSortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add image.");
        return;
      }

      toast.success("Image added successfully.");

      router.push(`/vendor/products/${productId}/images`);
      router.refresh();
    } catch (error) {
      console.error("Add vendor product image error:", error);

      toast.error("Something went wrong while adding the image.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        <Link
          href={`/vendor/products/${productId}/images`}
          className="cursor-pointer hover:text-gray-900"
        >
          Images
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">Add Image</span>
      </div>

      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <ImageIcon size={22} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Add Product Image
            </h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Add an image URL and configure how it should appear on your
              product.
            </p>
          </div>
        </div>

        <Link
          href={`/vendor/products/${productId}/images`}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Images
        </Link>
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Form */}
        <form
          id="add-image-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <ImageIcon size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#25232C]">
                Image Details
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Provide the image source and display information.
              </p>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-6">
            {/* Image URL */}
            <div>
              <label
                htmlFor="image-url"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Image URL
                <span className="ml-1 text-[#8065B0]">*</span>
              </label>

              <div className="relative">
                <Link2
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="image-url"
                  type="url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setPreviewFailed(false);
                  }}
                  placeholder="https://example.com/product-image.jpg"
                  disabled={saving}
                  className={`${inputClass} pl-11`}
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Enter a publicly accessible image URL. HTTPS is recommended.
              </p>

              {imageUrl && !isValidUrl && (
                <p className="mt-2 text-xs font-medium text-[#8065B0]">
                  Enter a valid HTTP or HTTPS URL.
                </p>
              )}
            </div>

            {/* Alt Text */}
            <div>
              <label
                htmlFor="image-alt-text"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Alt Text
              </label>

              <input
                id="image-alt-text"
                type="text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="e.g. AutoCAD product interface"
                disabled={saving}
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Describe the image for accessibility and search engines.
              </p>
            </div>

            {/* Image Type */}
            <div>
              <p className="mb-3 text-[13px] font-semibold text-gray-700">
                Image Type
              </p>

              <div
                role="radiogroup"
                aria-label="Image type"
                className="grid gap-3 sm:grid-cols-2"
              >
                {IMAGE_TYPES.map((imageType) => {
                  const Icon = imageType.icon;
                  const selected = type === imageType.value;

                  return (
                    <label
                      key={imageType.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        selected
                          ? "border-[#A88DD7] bg-[#F8F4FF] ring-1 ring-[#E8DDF8]"
                          : "border-[#EAE7EF] bg-white hover:border-gray-300 hover:bg-gray-50"
                      } ${saving ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="imageType"
                        value={imageType.value}
                        checked={selected}
                        onChange={() => setType(imageType.value)}
                        disabled={saving}
                        className="sr-only"
                      />

                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-[#E8DDF8] text-[#8065B0]"
                            : "bg-[#F0EBFA] text-[#8065B0]"
                        }`}
                      >
                        <Icon size={19} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900">
                          {imageType.label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          {imageType.description}
                        </span>
                      </span>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#A88DD7] bg-[#8065B0] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected && <CheckCircle2 size={13} />}
                      </span>
                    </label>
                  );
                })}
              </div>

              {selectedType && (
                <p className="mt-3 text-xs text-gray-400">
                  Selected: {selectedType.description}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sort-order"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Sort Order
              </label>

              <input
                id="sort-order"
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                disabled={saving}
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Lower numbers appear first in the product gallery.
              </p>

              {!isValidSortOrder && (
                <p className="mt-2 text-xs font-medium text-[#8065B0]">
                  Sort order must be a non-negative integer.
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FBFAFD] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/images`}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Image
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          {/* Live Preview */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-gray-600" />

                <h2 className="text-sm font-bold text-gray-900">
                  Live Preview
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                {selectedType?.label || type}
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F4FB]">
              {isValidUrl && !previewFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={altText.trim() || "Product image preview"}
                  onError={() => setPreviewFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-gray-400">
                  <ImageIcon size={40} />

                  <p className="text-xs">
                    {previewFailed
                      ? "Unable to preview this image"
                      : "Image preview will appear here"}
                  </p>
                </div>
              )}

              <span className="absolute left-3 top-3 rounded-lg bg-[#25232C]/90 px-2.5 py-1.5 text-[11px] font-semibold capitalize text-white backdrop-blur-sm">
                {type}
              </span>

              <span className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 backdrop-blur-sm">
                #{sortOrder || "0"}
              </span>
            </div>

            <div className="p-5">
              <p className="truncate text-sm font-bold text-gray-900">
                {altText.trim() || "Product image"}
              </p>

              <p className="mt-1 text-xs capitalize text-gray-500">
                {type} image
              </p>
            </div>
          </section>

          {/* Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={19} />
              </span>

              <h3 className="text-sm font-bold text-gray-900">Image Summary</h3>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Image Type
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {selectedType?.label || type}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Sort Order
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {sortOrder || "Not set"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Image URL
                </p>

                <p className="mt-2 break-all text-xs leading-5 text-gray-600">
                  {imageUrl || "Not provided"}
                </p>
              </div>
            </div>
          </section>

          {/* Help */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-gray-500"
              />

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Image Guidelines
                </h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  Use clear, relevant product visuals and descriptive alt text.
                  Ensure the image URL is publicly accessible.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage product media. Grow your business.</p>
      </footer>
    </div>
  );
}
