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
  Save,
  Upload,
  X,
} from "lucide-react";

type UploadMethod = "device" | "url";
type ImageType = "gallery" | "hero" | "thumbnail" | "logo";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

export default function NewProductImagePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;
  const imagesUrl = `/admin/products/${productId}/images`;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<UploadMethod>("device");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [type, setType] = useState<ImageType>("gallery");
  const [sortOrder, setSortOrder] = useState("0");

  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
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

  const validUrl = (() => {
    try {
      const parsed = new URL(url.trim());

      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  })();

  const hasImage = method === "device" ? Boolean(selectedFile) : validUrl;

  const previewSource =
    method === "device" ? localPreview : validUrl ? url.trim() : "";

  const completedFields =
    Number(hasImage) + Number(Boolean(type)) + Number(validSortOrder);

  const canSubmit = hasImage && validSortOrder && !saving;

  function validateFile(file: File): boolean {
    if (!ACCEPTED_TYPES.includes(file.type)) {
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

  function changeMethod(nextMethod: UploadMethod) {
    if (saving) return;

    setMethod(nextMethod);
    setPreviewError(false);
  }

  function removeSelectedFile() {
    if (saving) return;

    setSelectedFile(null);
    setLocalPreview("");
    setPreviewError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (method === "device" && !selectedFile) {
      toast.error("Please select an image.");
      return;
    }

    if (method === "url" && !validUrl) {
      toast.error("Please enter a valid image URL.");
      return;
    }

    if (!validSortOrder) {
      toast.error("Sort order must be a non-negative integer.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = url.trim();

      // Upload local file first.
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
      }

      // Save image metadata using the existing Prisma API.
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: imageUrl,
          altText: altText.trim(),
          type,
          sortOrder: Number(sortOrder),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add image.");
        return;
      }

      toast.success("Image added successfully.");

      router.push(imagesUrl);
      router.refresh();
    } catch (error) {
      console.error("Add product image error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
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

            <span className="font-semibold text-gray-900">Add Image</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <Upload size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Product Image
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Upload an image or provide an external image URL.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={imagesUrl}
          className="inline-flex min-h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
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
          {/* Image Source */}
          <section className={cardClass}>
            <SectionHeading
              icon={<ImageIcon size={19} />}
              title="Image Source"
              description="Choose how you want to add your image."
            />

            <div className="p-5 sm:p-6">
              {/* Method Tabs */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F5F2F9] p-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changeMethod("device")}
                  className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-medium transition disabled:cursor-not-allowed ${
                    method === "device"
                      ? "bg-white text-gray-950 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
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
                  className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-medium transition disabled:cursor-not-allowed ${
                    method === "url"
                      ? "bg-white text-gray-950 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
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
                    aria-label="Select product image"
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {localPreview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={localPreview}
                            alt="Selected image"
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
                          Ready to upload
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={saving}
                        aria-label="Remove selected image"
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
                      className={`rounded-[20px] border-2 border-dashed p-8 text-center transition sm:p-12 ${
                        dragging
                          ? "border-[#A48ACD] bg-[#F7F3FC]"
                          : "border-[#DDD3EB] bg-[#FBF9FE]"
                      }`}
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#8065B0] shadow-sm">
                        <CloudUpload size={29} />
                      </div>

                      <h3 className="mt-5 text-base font-bold text-gray-900">
                        Drag & drop your image here
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Or browse your device to select an image.
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#403948] disabled:cursor-not-allowed"
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
                    Image URL <span className="text-red-500">*</span>
                  </label>

                  <div className="relative mt-2">
                    <Link2
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="imageUrl"
                      type="url"
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        setPreviewError(false);
                      }}
                      placeholder="https://example.com/image.jpg"
                      disabled={saving}
                      required={method === "url"}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#FCFBFD] pl-11 pr-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Use a publicly accessible HTTP or HTTPS image URL.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Image Details */}
          <section className={cardClass}>
            <SectionHeading
              icon={<Images size={19} />}
              title="Image Details"
              description="Configure image accessibility and display settings."
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
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-[#FCFBFD] px-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Describe the image for accessibility and SEO.
                </p>
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
                            ? "border-[#A48ACD] bg-[#F8F5FC] ring-1 ring-[#C8B8E0]"
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
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-[#FCFBFD] px-4 text-sm outline-none transition focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
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
              className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Uploading & Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Preview */}
          <section className={cardClass}>
            <div className="border-b border-[#F0ECF4] px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Image Preview</h2>
            </div>

            <div className="p-5">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {previewSource && !previewError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={previewSource}
                    src={previewSource}
                    alt={altText || "Product preview"}
                    onError={() => setPreviewError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-4 text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-300" />

                    <p className="mt-3 text-xs leading-5 text-gray-400">
                      {previewError
                        ? "Preview unavailable"
                        : "Your image preview will appear here"}
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-4 break-words text-sm font-semibold text-gray-900">
                {altText.trim() || selectedFile?.name || "Product image"}
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

          {/* Completion */}
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

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0EBFA]">
              <div
                className="h-full rounded-full bg-[#8065B0] transition-all"
                style={{
                  width: `${(completedFields / 3) * 100}%`,
                }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <CompletionRow label="Image selected" completed={hasImage} />

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

          {/* Tip */}
          <section className="rounded-[20px] border border-[#EDE5F6] bg-gradient-to-br from-[#FBF8FF] to-[#F4EFFB] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Info size={17} />
              Upload Information
            </h2>

            <p className="mt-3 text-xs leading-6 text-gray-500">
              Uploaded images are stored on your server in
              <span className="font-semibold"> public/uploads/products</span>.
              Their URLs are saved in the existing product image database
              records.
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
    <div className="flex items-center gap-3 border-b border-[#F0ECF4] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-base font-bold text-gray-950">{title}</h2>

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
            ? "bg-[#E7F6ED] text-[#278455]"
            : "bg-[#F0EBFA] text-[#A48ACD]"
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
