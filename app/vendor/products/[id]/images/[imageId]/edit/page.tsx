
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileImage,
  ImageIcon,
  Images,
  Info,
  Link2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

type ProductImage = {
  id: number;
  url: string;
  altText: string | null;
  type: string;
  sortOrder: number;
};

type ImageFormValues = {
  url: string;
  altText: string;
  type: string;
  sortOrder: string;
};

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
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(15,23,42,0.025)]";

const inputClass =
  "w-full rounded-xl border border-[#E5E2EA] bg-[#FCFBFE] px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#9B83CA] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-gray-100";

export default function EditVendorProductImagePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const imageId = params.imageId as string;

  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [type, setType] = useState("gallery");
  const [sortOrder, setSortOrder] = useState("0");

  const [original, setOriginal] = useState<ImageFormValues>({
    url: "",
    altText: "",
    type: "gallery",
    sortOrder: "0",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!productId || !imageId) return;

    async function loadImage() {
      try {
        setLoading(true);
        setLoadFailed(false);

        const response = await fetch(
          `/api/vendor/products/${productId}/images/${imageId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message || "Failed to load image."
          );
          setLoadFailed(true);
          return;
        }

        const image: ProductImage = data.image;

        const imageUrl = image.url || "";
        const imageAltText = image.altText || "";
        const imageType = image.type || "gallery";
        const imageSortOrder = String(image.sortOrder);

        setUrl(imageUrl);
        setAltText(imageAltText);
        setType(imageType);
        setSortOrder(imageSortOrder);

        setOriginal({
          url: imageUrl,
          altText: imageAltText,
          type: imageType,
          sortOrder: imageSortOrder,
        });

        setPreviewFailed(false);
      } catch (error) {
        console.error(
          "Load vendor product image error:",
          error
        );

        toast.error(
          "Something went wrong while loading the image."
        );

        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    void loadImage();
  }, [productId, imageId]);

  const selectedType = useMemo(
    () => IMAGE_TYPES.find((item) => item.value === type),
    [type]
  );

  const imageUrl = url.trim();

  const isValidUrl = useMemo(() => {
    if (!imageUrl) return false;

    try {
      const parsedUrl = new URL(imageUrl);

      return (
        parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:"
      );
    } catch {
      return false;
    }
  }, [imageUrl]);

  const parsedSortOrder = Number(sortOrder);

  const isValidSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(parsedSortOrder) &&
    parsedSortOrder >= 0;

  const hasChanges =
    imageUrl !== original.url ||
    altText.trim() !== original.altText ||
    type !== original.type ||
    sortOrder !== original.sortOrder;

  const canSubmit =
    !loading &&
    !saving &&
    hasChanges &&
    isValidUrl &&
    isValidSortOrder;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!imageUrl) {
      toast.error("Image URL is required.");
      return;
    }

    try {
      const parsedUrl = new URL(imageUrl);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        throw new Error("Invalid image URL protocol.");
      }
    } catch {
      toast.error("Please enter a valid image URL.");
      return;
    }

    if (
      !Number.isInteger(parsedSortOrder) ||
      parsedSortOrder < 0
    ) {
      toast.error(
        "Sort order must be a non-negative integer."
      );
      return;
    }

    if (!hasChanges) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/images/${imageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: imageUrl,
            altText: altText.trim(),
            type,
            sortOrder: parsedSortOrder,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to update image."
        );
        return;
      }

      toast.success("Image updated successfully.");

      router.push(
        `/vendor/products/${productId}/images`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Update vendor product image error:",
        error
      );

      toast.error(
        "Something went wrong while updating the image."
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
          <div className="h-[560px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-80 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#8065B0]">
          <ImageIcon size={22} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Image unavailable
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          This product image could not be loaded.
        </p>

        <Link
          href={`/vendor/products/${productId}/images`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={17} />
          Back to Images
        </Link>
      </div>
    );
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

        <span className="text-gray-700">
          Edit Image
        </span>
      </div>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <ImageIcon size={22}  strokeWidth={1.8}/>
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Product Image
              </h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-3 py-1 text-xs font-medium text-[#77808E]">
                #{imageId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Update the image URL, type, accessibility text, and display order.
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
          id="edit-image-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <ImageIcon size={21} />
            </span>

            <div>
              <h2 className="text-base font-semibold text-[#1F2430]">
                Image Details
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Changes affect only this product image.
              </p>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-6">
            {/* URL */}
            <div>
              <label
                htmlFor="image-url"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Image URL
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
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
                  disabled={saving}
                  className={`${inputClass} pl-11`}
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Use a publicly accessible HTTP or HTTPS image URL.
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
                onChange={(event) =>
                  setAltText(event.target.value)
                }
                placeholder="e.g. AutoCAD product interface"
                disabled={saving}
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Add a short description for accessibility
                and search engines.
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
                  const selected =
                    type === imageType.value;

                  return (
                    <label
                      key={imageType.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        selected
                          ? "border-[#9B83CA] bg-[#F8F5FE]"
                          : "border-[#E8EAED] bg-white hover:border-gray-300 hover:bg-gray-50"
                      } ${saving ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="imageType"
                        value={imageType.value}
                        checked={selected}
                        onChange={() =>
                          setType(imageType.value)
                        }
                        disabled={saving}
                        className="sr-only"
                      />

                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-[#F0EBFA] text-[#8065B0]"
                            : "bg-[#F0EBFA] text-[#8065B0]"
                        }`}
                      >
                        <Icon size={19} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#1F2430]">
                          {imageType.label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          {imageType.description}
                        </span>
                      </span>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#8065B0] bg-[#8065B0] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 size={13} />
                        )}
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
                onChange={(event) =>
                  setSortOrder(event.target.value)
                }
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

            {/* Change Status */}
            <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#F8F7FA] p-4">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  hasChanges
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <CheckCircle2 size={18} />
              </span>

              <div>
                <p className="text-sm font-semibold text-[#1F2430]">
                  {hasChanges
                    ? "Unsaved Changes"
                    : "No Changes Yet"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {hasChanges
                    ? "You have modified this image. Save your changes to apply the update."
                    : "All fields currently match the saved image details."}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FCFBFE] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/images`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-medium text-[#44414C] transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
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
                  Save Changes
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
                <ImageIcon
                  size={18}
                  className="text-gray-600"
                />

                <h2 className="text-sm font-semibold text-[#1F2430]">
                  Live Preview
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                {selectedType?.label || type}
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F4F6]">
              {isValidUrl && !previewFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={
                    altText.trim() ||
                    "Product image preview"
                  }
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
              <p className="truncate text-sm font-semibold text-[#1F2430]">
                {altText.trim() || "Product image"}
              </p>

              <p className="mt-1 text-xs capitalize text-gray-500">
                {type} image
              </p>
            </div>
          </section>

          {/* Summary */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={20} />
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

            <h2 className="mt-5 text-base font-semibold text-[#1F2430]">
              Image Summary
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Review the current image settings before saving.
            </p>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Image Type
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {selectedType?.label || type}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Sort Order
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {sortOrder || "Not set"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Original URL
                </p>

                <p className="mt-2 break-all text-xs leading-5 text-gray-600">
                  {original.url || "Not provided"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Updated URL
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
                <h3 className="text-sm font-semibold text-[#1F2430]">
                  Image Guidelines
                </h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  Use clear, relevant product visuals and
                  descriptive alt text. Ensure your image URL
                  remains publicly accessible.
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
