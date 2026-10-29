"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileImage,
  GalleryHorizontal,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

type ProductImage = {
  id: number;
  url: string;
  altText: string | null;
  type: string;
  sortOrder: number;
  productId: number;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function ProductImagesPage() {
  const params = useParams();
  const productId = params.id as string;

  const [images, setImages] = useState<ProductImage[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("order");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);

  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!productId) return;

    let active = true;

    async function loadImages() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch(`/api/admin/products/${productId}/images`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(data.message || "Failed to load product images.");
          }
          return;
        }

        if (active) {
          setImages(Array.isArray(data.images) ? data.images : []);
        }
      } catch (error) {
        console.error("Load product images error:", error);

        if (active) {
          setLoadError(true);
          toast.error("Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadImages();

    return () => {
      active = false;
    };
  }, [productId]);

  const modalOpen = confirmDeleteId !== null || previewImage !== null;

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";

    const dialog =
      confirmDeleteId !== null
        ? deleteDialogRef.current
        : previewDialogRef.current;

    const initialFocus =
      confirmDeleteId !== null
        ? deleteCancelRef.current
        : previewCloseRef.current;

    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (deletingId !== null) return;

        setConfirmDeleteId(null);
        setPreviewImage(null);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [modalOpen, confirmDeleteId, deletingId]);

  async function handleDelete(imageId: number) {
    if (deletingId !== null) return;

    try {
      setDeletingId(imageId);

      const response = await fetch(
        `/api/admin/products/${productId}/images/${imageId}`,
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

  const filteredImages = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = images.filter((image) => {
      const matchesType =
        typeFilter === "all" || image.type.toLowerCase() === typeFilter;
      const matchesSearch =
        !query ||
        [image.altText ?? "", image.url, image.type, String(image.id)].some(
          (field) => field.toLowerCase().includes(query),
        );
      return matchesType && matchesSearch;
    });
    return result.sort((a, b) =>
      sortBy === "newest"
        ? b.id - a.id
        : sortBy === "oldest"
          ? a.id - b.id
          : sortBy === "name"
            ? (a.altText ?? "").localeCompare(b.altText ?? "")
            : a.sortOrder - b.sortOrder || a.id - b.id,
    );
  }, [images, search, typeFilter, sortBy]);

  const imageTypes = useMemo(
    () => [...new Set(images.map((image) => image.type.toLowerCase()))].sort(),
    [images],
  );
  const activeFilters =
    Number(typeFilter !== "all") + Number(sortBy !== "order");
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSortBy("order");
  };

  const selectedDeleteImage =
    confirmDeleteId !== null
      ? images.find((image) => image.id === confirmDeleteId)
      : null;

  const addImageUrl = `/admin/products/${productId}/images/new`;

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400"
          >
            <Link
              href="/admin/products"
              className="cursor-pointer transition hover:text-gray-900"
            >
              Products
            </Link>

            <ChevronRight size={14} />

            <Link
              href={`/admin/products/${productId}/edit`}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Edit Product
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Images</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <GalleryHorizontal size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Product Images
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage visual assets associated with this product.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E7E8EC] bg-white px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back to Product
          </Link>

          <Link
            href={addImageUrl}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
          >
            <Plus size={18} />
            Add Image
          </Link>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<GalleryHorizontal size={19} />}
          label="Total Images"
          value={images.length}
          description="Images associated with this product"
          tone="lavender"
        />

        <SummaryCard
          icon={<ImageIcon size={19} />}
          label="Hero Images"
          value={heroCount}
          description="Images marked as hero assets"
          tone="mint"
        />

        <SummaryCard
          icon={<FileImage size={19} />}
          label="Gallery Images"
          value={galleryCount}
          description="Images marked for the gallery"
          tone="peach"
        />
      </section>

      {/* Media Library — shared CADGram catalog filter layout */}
      <section className={`overflow-hidden ${cardClass}`}>
        <div className="px-4 pt-4 pb-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
                <GalleryHorizontal size={19} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-[#262735]">
                  Media Library
                </h2>
                <p className="mt-1 text-[12px] text-[#7B8495]">
                  Preview, edit, and manage product images
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F3EFF8] px-3 py-2 text-[12px] font-medium text-[#7F6C9A]">
                {filteredImages.length} of {images.length} images
              </span>
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                aria-expanded={showFilters}
                aria-controls="image-catalog-filters"
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition ${showFilters || activeFilters > 0 ? "border-[#D8C5F2] bg-[#F4ECFD] text-[#7855A9]" : "border-[#E5E2EA] bg-white text-[#45414E] hover:bg-[#F8F6FA]"}`}
              >
                <SlidersHorizontal size={16} /> Filters
                {activeFilters > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8966B9] px-1 text-[11px] text-white">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9C93AB]"
              />
              <input
                aria-label="Search images"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by image name, URL, type, or ID..."
                className="h-10 w-full rounded-xl border border-[#E4DFEB] bg-[#FAF9FC] pl-10 pr-4 text-[13px] text-[#302A38] outline-none placeholder:text-[#A59CAE] focus:border-[#BCA1DF] focus:ring-4 focus:ring-[#F0EBFA]"
              />
            </div>
            {(Boolean(search.trim()) || activeFilters > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] font-medium text-[#45414E] transition hover:bg-[#F8F6FA]"
              >
                <RotateCcw size={15} /> Reset
              </button>
            )}
          </div>

          {showFilters && (
            <div
              id="image-catalog-filters"
              className="mt-3 grid gap-3 sm:grid-cols-2"
            >
              <label className="sr-only" htmlFor="image-type-filter">
                Filter by image type
              </label>
              <select
                id="image-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-[#E4DFEB] bg-white px-4 text-[13px] text-[#45414E] outline-none focus:border-[#BCA1DF] focus:ring-4 focus:ring-[#F0EBFA]"
              >
                <option value="all">All image types</option>
                {imageTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="image-sort-filter">
                Sort images
              </label>
              <select
                id="image-sort-filter"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-[#E4DFEB] bg-white px-4 text-[13px] text-[#45414E] outline-none focus:border-[#BCA1DF] focus:ring-4 focus:ring-[#F0EBFA]"
              >
                <option value="order">Display order</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          )}
        </div>
        <div className="border-t border-[#F0EDF4]" />
        {loading ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="aspect-[4/3] animate-pulse bg-gray-200" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <AlertTriangle size={28} className="text-red-500" />

            <h3 className="mt-4 text-base font-bold text-gray-900">
              Unable to load images
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Please refresh the page and try again.
            </p>
          </div>
        ) : images.length > 0 ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.length === 0 && (
              <div className="col-span-full flex flex-col items-center py-14 text-center">
                <Search size={25} className="text-[#A48ACD]" />
                <h3 className="mt-3 text-sm font-semibold text-[#302A38]">
                  No matching images
                </h3>
                <p className="mt-2 text-xs text-[#8B8494]">
                  Try another search or reset your filters.
                </p>
                {(Boolean(search.trim()) || activeFilters > 0) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 cursor-pointer rounded-xl border border-[#E5E2EA] px-4 py-2 text-sm hover:bg-[#F8F6FA]"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
            {filteredImages.map((image) => {
              const isHero = image.type.toLowerCase() === "hero";

              return (
                <article
                  key={image.id}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white transition hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.altText || "Product image"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />

                    <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur ${
                          isHero
                            ? "bg-gray-950/90 text-white"
                            : "bg-white/95 text-gray-700"
                        }`}
                      >
                        {image.type}
                      </span>

                      <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 backdrop-blur">
                        Order #{image.sortOrder}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewImage(image)}
                      className="absolute bottom-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-gray-700 shadow-sm transition hover:bg-white"
                      aria-label={`Preview ${image.altText || "image"}`}
                    >
                      <Eye size={17} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-gray-950">
                          {image.altText || "Product image"}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Image #{image.id}
                        </p>
                      </div>

                      {isHero && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Hero
                        </span>
                      )}
                    </div>

                    <p
                      title={image.url}
                      className="mt-3 line-clamp-2 break-all text-xs leading-5 text-gray-500"
                    >
                      {image.url}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/admin/products/${productId}/images/${image.id}/edit`}
                        className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPreviewImage(image)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        aria-label="Preview image"
                        title="Preview image"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(image.id)}
                        disabled={deletingId !== null}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete image"
                        title="Delete image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              <GalleryHorizontal size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              No images yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add your first product image to start building the product
              gallery.
            </p>

            <Link
              href={addImageUrl}
              className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
            >
              <Plus size={17} />
              Add Image
            </Link>
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {selectedDeleteImage &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && deletingId === null) {
                setConfirmDeleteId(null);
              }
            }}
          >
            <div
              ref={deleteDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-image-title"
              aria-describedby="delete-image-description"
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={23} />
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId !== null}
                  aria-label="Close confirmation"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id="delete-image-title"
                className="mt-5 text-xl font-bold text-gray-950"
              >
                Delete Image?
              </h3>

              <p
                id="delete-image-description"
                className="mt-2 text-sm leading-6 text-gray-500"
              >
                Are you sure you want to delete image #{selectedDeleteImage.id}?
                This action cannot be undone.
              </p>

              <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedDeleteImage.url}
                  alt={selectedDeleteImage.altText || "Product image"}
                  className="h-40 w-full object-contain"
                />
              </div>

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-5 text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  The image record will be permanently removed from this
                  product.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={deleteCancelRef}
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedDeleteImage.id)}
                  disabled={deletingId !== null}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === selectedDeleteImage.id ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Image preview */}
      {previewImage &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/85 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPreviewImage(null);
              }
            }}
          >
            <div
              ref={previewDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              className="flex max-h-[94vh] w-full max-w-5xl flex-col items-center"
            >
              <div className="flex w-full justify-end pb-3">
                <button
                  ref={previewCloseRef}
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Close image preview"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[calc(94vh-60px)] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex min-h-[200px] items-center justify-center bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage.url}
                    alt={previewImage.altText || "Product image"}
                    className="max-h-[65vh] w-full object-contain"
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-gray-950">
                      {previewImage.altText || "Product image"}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {previewImage.type} · Order #{previewImage.sortOrder}
                    </p>
                  </div>

                  <Link
                    href={`/admin/products/${productId}/images/${previewImage.id}/edit`}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-xs font-semibold text-white transition hover:bg-[#403948]"
                  >
                    <Pencil size={15} />
                    Edit Image
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  tone: "lavender" | "mint" | "peach";
}) {
  const tones = {
    lavender: {
      card: "from-[#FFF6F8] to-[#F5F0FA]",
      icon: "bg-[#EDE0FA] text-[#8260B4]",
    },
    mint: {
      card: "from-[#F1FAF5] to-[#E8F7EE]",
      icon: "bg-[#D7F0E4] text-[#278B69]",
    },
    peach: {
      card: "from-[#FFFAF2] to-[#FFF0DF]",
      icon: "bg-[#FCE5C5] text-[#CB8428]",
    },
  };
  const theme = tones[tone];
  return (
    <div
      className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/90 bg-gradient-to-br ${theme.card} px-5 py-4 shadow-[0_8px_24px_rgba(40,29,57,0.035)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.075em] text-[#788294]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${theme.icon}`}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#202632]">
          {value}
        </p>
        <p className="mt-3 text-[12px] leading-4 text-[#788294]">
          {description}
        </p>
      </div>
    </div>
  );
}
