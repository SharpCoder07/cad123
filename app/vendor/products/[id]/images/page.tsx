"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileImage,
  GalleryHorizontal,
  ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";

type ProductImage = {
  id: number;
  url: string;
  altText: string | null;
  type: string;
  sortOrder: number;
  productId: number;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(33,25,52,0.025)]";

export default function ProductImagesPage() {
  const params = useParams();
  const productId = params.id as string;

  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("order");
  const [showFilters, setShowFilters] = useState(false);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function loadImages() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/vendor/products/${productId}/images`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to load product images.");
          return;
        }

        setImages(data.images || []);
      } catch (error) {
        console.error("Load product images error:", error);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    void loadImages();
  }, [productId]);

  async function handleDelete(imageId: number) {
    try {
      setDeletingId(imageId);

      const response = await fetch(
        `/api/vendor/products/${productId}/images/${imageId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete image.");
        return;
      }

      setImages((currentImages) =>
        currentImages.filter((image) => image.id !== imageId),
      );

      toast.success("Image deleted successfully.");
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Delete product image error:", error);
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  const heroCount = images.filter(
    (image) => image.type.toLowerCase() === "hero",
  ).length;

  const galleryCount = images.filter(
    (image) => image.type.toLowerCase() === "gallery",
  ).length;

  const selectedDeleteImage =
    confirmDeleteId !== null
      ? images.find((image) => image.id === confirmDeleteId)
      : null;

  const filteredImages = images
    .filter((image) => {
      const matchesType =
        filter === "all" || image.type.toLowerCase() === filter;
      const query = search.trim().toLowerCase();
      return (
        matchesType &&
        (!query ||
          `${image.altText || ""} ${image.type} ${image.id} ${image.url}`
            .toLowerCase()
            .includes(query))
      );
    })
    .sort((a, b) =>
      sort === "newest"
        ? b.id - a.id
        : sort === "oldest"
          ? a.id - b.id
          : sort === "name"
            ? (a.altText || "").localeCompare(b.altText || "")
            : a.sortOrder - b.sortOrder,
    );
  const activeFilters = Number(filter !== "all") + Number(sort !== "order");
  const resetFilters = () => {
    setFilter("all");
    setSort("order");
    setSearch("");
  };
  const stats = [
    {
      label: "TOTAL IMAGES",
      value: images.length,
      description: "Visual assets linked to this product",
      icon: GalleryHorizontal,
      background: "bg-gradient-to-br from-[#F4EAFE] to-[#FDEFF5]",
      iconBg: "bg-[#E9D8FA] text-[#8065B0]",
    },
    {
      label: "HERO IMAGES",
      value: heroCount,
      description: "Images marked as hero assets",
      icon: ImageIcon,
      background: "bg-gradient-to-br from-[#E8F8F1] to-[#F2FCF7]",
      iconBg: "bg-[#D4F0E2] text-[#2B936B]",
    },
    {
      label: "GALLERY IMAGES",
      value: galleryCount,
      description: "Images assigned to the gallery",
      icon: FileImage,
      background: "bg-gradient-to-br from-[#FFF0E4] to-[#FFF7ED]",
      iconBg: "bg-[#FFE0C7] text-[#D48A55]",
    },
  ];
  return (
    <div className="space-y-6 pb-8">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-[#9893A2]">
        <Link
          href="/vendor/products"
          className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>
        <ChevronRight size={13} />
        <Link
          href={`/vendor/products/${productId}/edit`}
          className="cursor-pointer hover:text-gray-900"
        >
         Edit Product
        </Link>
        <ChevronRight size={13} />
        <span className="font-medium text-[#484451]">Images</span>
      </nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <GalleryHorizontal size={23} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Images
              </h1>
              <span className="rounded-full border border-[#EAE7EF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#77717F]">
                #{productId}
              </span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Manage and organize your product's visual assets.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/vendor/products/${productId}/edit`}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA]"
          >
            <ArrowLeft size={16} />
            Back to Product
          </Link>
          <Link
            href={`/vendor/products/${productId}/images/new`}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white hover:bg-[#403948]"
          >
            <Plus size={16} />
            Add Image
          </Link>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/70 p-5 ${stat.background}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold tracking-[0.09em] text-[#686270]">
                  {stat.label}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <div>
                <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#25232C]">
                  {stat.value.toLocaleString("en-IN")}
                </p>
                <p className="mt-2 text-xs text-[#77717F]">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <GalleryHorizontal size={20} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#25232C]">
                Media Library
              </h2>
              <p className="mt-0.5 text-xs text-[#8A8592]">
                Preview, edit, and manage product images.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F5F3F8] px-3 py-1.5 text-xs font-medium text-[#77717F]">
              {filteredImages.length} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium ${showFilters || activeFilters ? "border-[#D7C6EF] bg-[#F0EBFA] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && (
                <span className="rounded-full bg-[#8065B0] px-1.5 text-[10px] text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="border-t border-[#F0EDF3] px-5 py-4 sm:px-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A94A2]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search images by name, type or URL..."
                className="min-h-10 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-3 text-[13px] text-[#25232C] outline-none placeholder:text-[#A49EAC] focus:border-[#B9A0E0]"
              />
            </div>
            {(search || activeFilters > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E2EA] px-3 text-xs text-[#77717F] hover:bg-[#F8F6FA]"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
          {showFilters && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                aria-label="Image type"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`min-h-10 cursor-pointer rounded-xl border bg-white px-3 text-[13px] outline-none ${filter !== "all" ? "border-[#B9A0E0] text-[#8065B0]" : "border-[#E5E2EA] text-[#44414C]"}`}
              >
                <option value="all">All image types</option>
                <option value="hero">Hero images</option>
                <option value="gallery">Gallery images</option>
              </select>
              <select
                aria-label="Sort images"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`min-h-10 cursor-pointer rounded-xl border bg-white px-3 text-[13px] outline-none ${sort !== "order" ? "border-[#B9A0E0] text-[#8065B0]" : "border-[#E5E2EA] text-[#44414C]"}`}
              >
                <option value="order">Sort by display order</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          )}
        </div>
        {loading ? (
          <div className="grid gap-4 border-t border-[#F0EDF3] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="overflow-hidden rounded-2xl border border-[#EAE7EF]"
              >
                <div className="aspect-[4/3] animate-pulse bg-[#F5F3F8]" />
                <div className="h-24 animate-pulse bg-white" />
              </div>
            ))}
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid gap-4 border-t border-[#F0EDF3] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map((image) => {
              const isHero = image.type.toLowerCase() === "hero";
              return (
                <article
                  key={image.id}
                  className="group overflow-hidden rounded-2xl border border-[#EAE7EF] bg-white transition hover:border-[#D8C7EB] hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F5F9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.altText || "Product image"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                    />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span
                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${isHero ? "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]" : "border-[#E6DDF3] bg-[#F4EFFB] text-[#8065B0]"}`}
                      >
                        {image.type}
                      </span>
                      <span className="rounded-lg bg-white/95 px-2 py-1 text-[10px] font-medium text-[#6F6976]">
                        Order #{image.sortOrder}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(image)}
                      aria-label={`Preview ${image.altText || "image"}`}
                      className="absolute bottom-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-[#6F6976] shadow-sm hover:text-[#8065B0]"
                    >
                      <Eye size={17} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-semibold text-[#25232C]">
                          {image.altText || "Product image"}
                        </h3>
                        <p className="mt-1 text-[11px] text-[#938D9B]">
                          Image #{image.id}
                        </p>
                      </div>
                      {isHero && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2 py-1 text-[10px] font-medium text-[#278455]">
                          <CheckCircle2 size={12} />
                          Hero
                        </span>
                      )}
                    </div>
                    <p
                      title={image.url}
                      className="mt-3 line-clamp-2 min-h-9 break-all text-[11px] leading-5 text-[#898391]"
                    >
                      {image.url}
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-[#F0EDF3] pt-3">
                      <Link
                        href={`/vendor/products/${productId}/images/${image.id}/edit`}
                        className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E5E2EA] bg-white text-xs font-medium text-[#44414C] hover:bg-[#F8F6FA]"
                      >
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(image)}
                        aria-label="Preview image"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] text-[#77717F] hover:bg-[#F8F6FA]"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(image.id)}
                        disabled={deletingId === image.id}
                        aria-label="Delete image"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] hover:bg-[#FFE5E9] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[290px] flex-col items-center justify-center border-t border-[#F0EDF3] px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              <GalleryHorizontal size={25} />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-[#25232C]">
              {images.length ? "No matching images" : "No images yet"}
            </h3>
            <p className="mt-2 max-w-sm text-[13px] text-[#898391]">
              {images.length
                ? "Try another search or reset your filters."
                : "Add your first image to build the product gallery."}
            </p>
            {images.length ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 cursor-pointer rounded-xl border border-[#E5E2EA] px-4 py-2 text-xs text-[#44414C]"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                href={`/vendor/products/${productId}/images/new`}
                className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] text-white"
              >
                <Plus size={16} />
                Add Image
              </Link>
            )}
          </div>
        )}
      </section>
      {selectedDeleteImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F1A29]/55 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-image-title"
            className="w-full max-w-md rounded-[22px] border border-[#EAE7EF] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </span>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                aria-label="Close confirmation"
                className="cursor-pointer rounded-lg p-2 text-[#77717F] hover:bg-[#F8F6FA]"
              >
                <X size={18} />
              </button>
            </div>
            <h3
              id="delete-image-title"
              className="mt-4 text-lg font-semibold text-[#25232C]"
            >
              Delete image?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#77717F]">
              This permanently removes image #{selectedDeleteImage.id} from this
              product. This action cannot be undone.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#EAE7EF] bg-[#F8F6FA]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDeleteImage.url}
                alt={selectedDeleteImage.altText || "Product image"}
                className="h-40 w-full object-cover"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                className="min-h-10 cursor-pointer rounded-xl border border-[#E5E2EA] px-4 text-[13px] text-[#44414C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedDeleteImage.id)}
                disabled={deletingId !== null}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#DC5361] px-4 text-[13px] text-white disabled:opacity-50"
              >
                {deletingId === selectedDeleteImage.id ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17131D]/90 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
              className="absolute right-0 top-0 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
            >
              <X size={20} />
            </button>
            <div className="max-h-full max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.altText || "Product image"}
                className="max-h-[75vh] max-w-[90vw] object-contain"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE7EF] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#25232C]">
                    {previewImage.altText || "Product image"}
                  </p>
                  <p className="mt-1 text-xs text-[#898391]">
                    {previewImage.type} · Order #{previewImage.sortOrder}
                  </p>
                </div>
                <Link
                  href={`/vendor/products/${productId}/images/${previewImage.id}/edit`}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-xs text-white"
                >
                  Edit Image
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="flex flex-wrap justify-between gap-2 border-t border-[#EAE7EF] pt-5 text-xs text-[#A09AA8]">
        <span>CADGram Vendor Portal</span>
        <span>Manage product media. Grow your business.</span>
      </footer>
    </div>
  );
}
