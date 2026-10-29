
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export default function DeleteBrandButton({
  brandId,
}: {
  brandId: number;
}) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setIsOpen(false);

        requestAnimationFrame(() => {
          triggerButtonRef.current?.focus();
        });
      }

      if (event.key === "Tab") {
        const modal = document.getElementById(
          `delete-brand-modal-${brandId}`
        );

        if (!modal) return;

        const focusableElements =
          modal.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

        const elements = Array.from(focusableElements);

        if (!elements.length) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, brandId]);

  function closeModal() {
    if (isDeleting) return;

    setIsOpen(false);

    requestAnimationFrame(() => {
      triggerButtonRef.current?.focus();
    });
  }

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/brands/${brandId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Failed to delete brand."
        );
        return;
      }

      setIsOpen(false);

      toast.success("Brand deleted successfully.");

      router.refresh();
    } catch (error) {
      console.error("Delete brand error:", error);

      toast.error(
        "Something went wrong while deleting the brand."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Compact delete icon — same as Products and Categories */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        title="Delete brand"
        aria-label="Delete brand"
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      >
        <Trash2 size={17} strokeWidth={1.8} />
      </button>

      {/* Confirmation modal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              id={`delete-brand-modal-${brandId}`}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="w-full max-w-[440px] overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <Trash2 size={25} strokeWidth={1.8} />
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isDeleting}
                    aria-label="Close dialog"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>

                <h2
                  id={titleId}
                  className="mt-5 text-xl font-bold tracking-tight text-gray-950"
                >
                  Delete Brand?
                </h2>

                <p
                  id={descriptionId}
                  className="mt-2 text-sm leading-6 text-gray-500"
                >
                  Are you sure you want to delete this brand?
                  This action cannot be undone.
                </p>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-xs leading-5 text-amber-800">
                    This brand may be associated with existing
                    products. Deletion may be restricted if
                    related records exist.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FAFAFB] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={closeModal}
                  disabled={isDeleting}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC0000] px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
