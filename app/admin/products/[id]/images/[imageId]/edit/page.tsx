"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  ImageIcon,
  Images,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Upload,
  X,
} from "lucide-react";

type ProductImage = {
  id: number;
  url: string;
  altText: string | null;
  type: string;
  sortOrder: number;
};

type ImageType = "gallery" | "hero" | "thumbnail" | "logo";
type ImageMethod = "device" | "url";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const IMAGE_TYPES: {
  value: ImageType;
  label: string;
  description: string;
}[] = [
  {
    value: "gallery",
    label: "Gallery",
    description: "Additional product screenshots",
  },
  {
    value: "hero",
    label: "Hero",
    description: "Main product image",
  },
  {
    value: "thumbnail",
    label: "Thumbnail",
    description: "Compact product preview",
  },
  {
    value: "logo",
    label: "Logo",
    description: "Product or brand logo",
  },
];

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

function isValidImageUrl(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.startsWith("/uploads/products/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EditProductImagePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const imageId = params.imageId as string;

  const imagesUrl = `/admin/products/${productId}/images`;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalImage, setOriginalImage] = useState<ProductImage | null>(null);

  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [type, setType] = useState<ImageType>("gallery");
  const [sortOrder, setSortOrder] = useState("0");

  const [method, setMethod] = useState<ImageMethod>("device");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadImage() {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          `/api/admin/products/${productId}/images/${imageId}`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.image) {
          throw new Error(data.message || "Failed to load product image.");
        }

        if (!active) return;

        const image: ProductImage = data.image;

        setOriginalImage(image);
        setUrl(image.url);
        setAltText(image.altText || "");

        const validType = IMAGE_TYPES.some((item) => item.value === image.type);

        setType(validType ? (image.type as ImageType) : "gallery");

        setSortOrder(String(image.sortOrder));
      } catch (error) {
        console.error("Load product image error:", error);

        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Something went wrong.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadImage();

    return () => {
      active = false;
    };
  }, [productId, imageId]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const validSortOrder =
    sortOrder.trim() !== "" &&
    Number.isInteger(Number(sortOrder)) &&
    Number(sortOrder) >= 0;

  const validUrl = isValidImageUrl(url);

  const replacingWithFile = method === "device" && selectedFile !== null;

  const replacingWithUrl =
    method === "url" &&
    originalImage !== null &&
    url.trim() !== originalImage.url;

  const isReplacingImage = replacingWithFile || replacingWithUrl;

  const previewSource =
    replacingWithFile && localPreview
      ? localPreview
      : method === "url" && validUrl
        ? url.trim()
        : originalImage?.url || "";

  const hasValidImage = replacingWithFile
    ? true
    : method === "url"
      ? validUrl
      : Boolean(originalImage?.url);

  const completedFields =
    Number(hasValidImage) + Number(Boolean(type)) + Number(validSortOrder);

  const canSubmit =
    !loading &&
    !saving &&
    Boolean(originalImage) &&
    hasValidImage &&
    validSortOrder;

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG and WebP images are allowed.");
      return false;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5 MB.");
      return false;
    }

    return true;
  }

  function selectFile(file: File) {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    setPreviewError(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      selectFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (saving || method !== "device") return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      selectFile(file);
    }
  }

  function changeMethod(nextMethod: ImageMethod) {
    if (saving) return;

    setMethod(nextMethod);
    setPreviewError(false);
  }

  function removeSelectedFile() {
    if (saving) return;

    setSelectedFile(null);
    setPreviewError(false);
  }

  function resetImage() {
    if (saving || !originalImage) return;

    setSelectedFile(null);
    setUrl(originalImage.url);
    setPreviewError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || !originalImage) return;

    if (!hasValidImage) {
      toast.error("Please provide a valid image.");
      return;
    }

    if (!validSortOrder) {
      toast.error("Sort order must be a non-negative integer.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = originalImage.url;

      // Upload replacement image if one was selected.
      if (method === "device" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (
          !uploadResponse.ok ||
          !uploadData.success ||
          typeof uploadData.url !== "string"
        ) {
          toast.error(uploadData.message || "Failed to upload image.");
          return;
        }

        imageUrl = uploadData.url;
      } else if (method === "url") {
        imageUrl = url.trim();
      }

      // Update the existing product image record.
      const response = await fetch(
        `/api/admin/products/${productId}/images/${imageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: imageUrl,
            altText: altText.trim(),
            type,
            sortOrder: Number(sortOrder),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update product image.");
        return;
      }

      toast.success("Image updated successfully.");

      router.push(imagesUrl);
      router.refresh();
    } catch (error) {
      console.error("Update product image error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-6">
        <div className="h-8 w-64 rounded-xl bg-gray-200" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-6">
            <div className="h-80 rounded-[24px] bg-gray-100" />
            <div className="h-80 rounded-[24px] bg-gray-100" />
          </div>

          <div className="h-80 rounded-[24px] bg-gray-100" />
        </div>
      </div>
    );
  }

  if (loadError || !originalImage) {
    return (
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-[24px] border border-gray-200 bg-white p-10 text-center">
          <ImageIcon size={36} className="mx-auto text-gray-300" />

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            Unable to load image
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {loadError || "Product image not found."}
          </p>

          <Link
            href={imagesUrl}
            className="mt-6 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <ArrowLeft size={16} />
            Back to Images
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
              href={imagesUrl}
              className="cursor-pointer hover:text-gray-900"
            >
              Images
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Edit Image</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <ImageIcon size={21} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Product Image
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update image details or replace the existing image.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={imagesUrl}
          className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={17} />
          Back to Images
        </Link>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        <div className="min-w-0 space-y-6">
          {/* Existing Image */}
          <section className={cardClass}>
            <SectionHeading
              icon={<ImageIcon size={19} />}
              title="Current Image"
              description="This is the image currently saved for the product."
            />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage.url}
                  alt={originalImage.altText || "Current product image"}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Current saved image
                </p>

                <p className="mt-2 break-all text-xs leading-5 text-gray-500">
                  {originalImage.url}
                </p>

                <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={13} />
                  Saved
                </span>
              </div>
            </div>
          </section>

          {/* Replacement Image */}
          <section className={cardClass}>
            <SectionHeading
              icon={<RefreshCw size={19} />}
              title="Replace Image"
              description="Optional — keep the current image or choose a replacement."
            />

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F6F3FA] p-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changeMethod("device")}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium transition disabled:cursor-not-allowed ${
                    method === "device"
                      ? "bg-white text-[#7458A8] shadow-sm ring-1 ring-[#E9E1F2]"
                      : "text-[#777080] hover:text-[#7458A8]"
                  }`}
                >
                  <CloudUpload size={17} />
                  <span className="hidden sm:inline">Upload from Device</span>
                  <span className="sm:hidden">Upload</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changeMethod("url")}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium transition disabled:cursor-not-allowed ${
                    method === "url"
                      ? "bg-white text-[#7458A8] shadow-sm ring-1 ring-[#E9E1F2]"
                      : "text-[#777080] hover:text-[#7458A8]"
                  }`}
                >
                  <Link2 size={17} />
                  Image URL
                </button>
              </div>

              {method === "device" ? (
                <div className="mt-6 space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={saving}
                    className="hidden"
                    aria-label="Select replacement image"
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {localPreview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={localPreview}
                            alt="Replacement preview"
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {selectedFile.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 size={13} />
                          Ready to replace
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={saving}
                        aria-label="Remove replacement image"
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 disabled:cursor-not-allowed"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (!saving) setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      className={`rounded-[22px] border-2 border-dashed p-8 text-center transition sm:p-10 ${
                        dragging
                          ? "border-[#A48ACD] bg-[#F7F3FC]"
                          : "border-[#DED5E9] bg-[#FBF9FD]"
                      }`}
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm">
                        <CloudUpload size={29} />
                      </div>

                      <h3 className="mt-5 text-base font-bold text-gray-900">
                        Upload a replacement image
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Drag and drop an image or browse your device.
                      </p>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-5 inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed"
                      >
                        <Upload size={16} />
                        Browse Files
                      </button>

                      <p className="mt-5 text-xs text-gray-400">
                        JPG, PNG or WebP · Maximum 5 MB
                      </p>
                    </div>
                  )}

                  {selectedFile && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer text-sm font-semibold text-gray-700 underline underline-offset-4 hover:text-black disabled:cursor-not-allowed"
                    >
                      Choose a different image
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  <label
                    htmlFor="imageUrl"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Image URL
                  </label>

                  <div className="relative mt-2">
                    <Link2
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="imageUrl"
                      type="text"
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        setPreviewError(false);
                      }}
                      placeholder="https://example.com/image.jpg"
                      disabled={saving}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Enter an HTTP/HTTPS URL or keep the existing local image
                    path.
                  </p>

                  {isReplacingImage && (
                    <button
                      type="button"
                      onClick={resetImage}
                      disabled={saving}
                      className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={13} />
                      Restore original image
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Image Details */}
          <section className={cardClass}>
            <SectionHeading
              icon={<Images size={19} />}
              title="Image Details"
              description="Update accessibility and display settings."
            />

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="altText"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Alt Text{" "}
                  <span className="font-normal text-gray-400">(Optional)</span>
                </label>

                <input
                  id="altText"
                  type="text"
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="e.g. AutoCAD product interface"
                  disabled={saving}
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Image Type <span className="text-red-500">*</span>
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {IMAGE_TYPES.map((item) => {
                    const selected = type === item.value;

                    return (
                      <label
                        key={item.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                          selected
                            ? "border-[#A48ACD] bg-[#F8F5FC] ring-1 ring-[#A48ACD]"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        } ${saving ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="imageType"
                          value={item.value}
                          checked={selected}
                          onChange={() => setType(item.value)}
                          disabled={saving}
                          className="sr-only"
                        />

                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#8065B0] bg-[#8065B0] text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                        </span>

                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {item.label}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-gray-500">
                            {item.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Sort Order <span className="text-red-500">*</span>
                </label>

                <input
                  id="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  disabled={saving}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Lower numbers generally appear first.
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={imagesUrl}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
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
                  <Loader2 size={17} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Update Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#F0ECF3] px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Image Preview</h2>

              {isReplacingImage && (
                <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                  Replacement
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {previewSource && !previewError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={previewSource}
                    src={previewSource}
                    alt={altText || "Product image preview"}
                    onError={() => setPreviewError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-4 text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-300" />

                    <p className="mt-3 text-xs text-gray-400">
                      Preview unavailable
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-4 break-words text-sm font-semibold text-gray-900">
                {altText.trim() || "Product image"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>

                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                  Order #{sortOrder || "0"}
                </span>
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <CheckCircle2 size={18} />
              Form Completion
            </h2>

            <div className="mt-5 flex justify-between text-sm">
              <span className="text-gray-500">Required fields</span>

              <span className="font-bold text-gray-900">
                {completedFields}/3
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#8065B0] transition-all"
                style={{
                  width: `${(completedFields / 3) * 100}%`,
                }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <CompletionRow label="Valid image" completed={hasValidImage} />

              <CompletionRow
                label="Image type selected"
                completed={Boolean(type)}
              />

              <CompletionRow
                label="Valid sort order"
                completed={validSortOrder}
              />
            </div>
          </section>

          <section className="rounded-[22px] border border-gray-200 bg-[#F8F5FC] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Info size={17} />
              Image Replacement
            </h2>

            <p className="mt-3 text-xs leading-6 text-gray-500">
              You can update image details without replacing the image. If you
              upload a new file, it will be stored locally and the existing
              image record will be updated with the new URL.
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
    <div className="flex items-center gap-3 border-b border-[#F0ECF3] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-[15px] font-semibold text-[#25232C]">{title}</h2>

        <p className="mt-1 text-xs text-gray-500">{description}</p>
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
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          completed
            ? "bg-emerald-50 text-emerald-600"
            : "bg-[#F0EBFA] text-[#8065B0]"
        }`}
      >
        {completed ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>

      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
