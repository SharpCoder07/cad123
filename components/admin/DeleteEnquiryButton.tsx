"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  enquiryId: number;
};

export default function DeleteEnquiryButton({ enquiryId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, deleting]);

  async function handleDelete() {
    if (deleting) return;
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete enquiry.");
        return;
      }
      setOpen(false);
      toast.success(data.message || "Enquiry deleted successfully.");
      router.refresh();
    } catch (error) {
      console.error("Delete enquiry error:", error);
      toast.error("Something went wrong while deleting the enquiry.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={deleting}
        aria-label="Delete enquiry"
        title="Delete enquiry"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F5CDCD] bg-[#FFF0F0] text-[#D64F4F] transition hover:border-[#EBAAAA] hover:bg-[#FFE5E5] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17131F]/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-enquiry-title-${enquiryId}`}
            aria-describedby={`delete-enquiry-description-${enquiryId}`}
            className="w-full max-w-[440px] rounded-[22px] border border-[#EAE7EF] bg-white p-6 shadow-[0_24px_70px_rgba(23,19,31,0.18)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#D64F4F]">
                <AlertTriangle size={23} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                aria-label="Close confirmation"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#918B9B] transition hover:bg-[#F8F6FA] hover:text-[#44414C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <h2 id={`delete-enquiry-title-${enquiryId}`} className="mt-5 text-[20px] font-semibold tracking-tight text-[#1F2430]">
              Delete enquiry?
            </h2>
            <p id={`delete-enquiry-description-${enquiryId}`} className="mt-2 text-[14px] leading-6 text-[#77808E]">
              Are you sure you want to delete this enquiry? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D64F4F] px-5 text-[13px] font-medium text-white transition hover:bg-[#BC3D3D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? "Deleting..." : "Delete enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
