"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function DeleteContactMessageButton({
  messageId,
}: {
  messageId: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) setShowModal(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [showModal, deleting]);

  async function handleDelete() {
    if (deleting) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete contact message.");
        return;
      }

      toast.success("Contact message deleted successfully.");
      setShowModal(false);
      router.refresh();
    } catch (error) {
      console.error("Delete contact message error:", error);
      toast.error("Something went wrong while deleting the contact message.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Delete contact message"
        title="Delete contact message"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:border-[#EFBEC4] hover:bg-[#FFE4E7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE4E7]"
      >
        <Trash2 size={16} />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F192B]/50 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setShowModal(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-contact-message-title"
            aria-describedby="delete-contact-message-description"
            className="w-full max-w-[440px] rounded-[22px] border border-[#EAE7EF] bg-white p-6 shadow-[0_24px_80px_rgba(31,25,43,0.2)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={deleting}
                aria-label="Close delete confirmation"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#96909D] transition hover:bg-[#F8F6FA] hover:text-[#44414C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h2 id="delete-contact-message-title" className="mt-5 text-[19px] font-semibold tracking-[-0.025em] text-[#1F2430]">
              Delete contact message?
            </h2>
            <p id="delete-contact-message-description" className="mt-2 text-[13px] leading-6 text-[#77808E]">
              This message will be permanently removed from the database. This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-[#F0EDF3] pt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D94E5C] px-4 text-[13px] font-medium text-white transition hover:bg-[#BE3D4A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? "Deleting..." : "Delete Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
