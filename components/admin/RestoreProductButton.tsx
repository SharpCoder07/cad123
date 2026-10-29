"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { toast } from "react-toastify";

type RestoreProductButtonProps = {
  productId: number;
};

export default function RestoreProductButton({
  productId,
}: RestoreProductButtonProps) {
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/restore`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to restore product.");
      }

      toast.success(data.message || "Product restored successfully.");

      setShowConfirm(false);

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while restoring the product.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D7EBDD] bg-[#EFF9F2] px-3 text-[12px] font-medium text-[#328258] transition hover:bg-[#E2F4E8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCcw size={15} />
        Restore
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setShowConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`restore-title-${productId}`}
            className="w-full max-w-[420px] rounded-[22px] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF9F2] text-[#328258]">
                <RotateCcw size={23} />
              </span>

              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                aria-label="Close confirmation"
                className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X size={18} />
              </button>
            </div>

            <h2
              id={`restore-title-${productId}`}
              className="mt-5 text-[19px] font-semibold tracking-tight text-[#1F2430]"
            >
              Restore this product?
            </h2>

            <p className="mt-2 text-[13px] leading-6 text-[#77808E]">
              This product will be moved back to the active product catalog.
              Its previous publishing status and product information will be
              preserved.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="min-h-10 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRestore}
                disabled={loading}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Restoring..." : "Yes, Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}