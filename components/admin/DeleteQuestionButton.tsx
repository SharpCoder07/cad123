"use client";

import { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

type DeleteQuestionButtonProps = {
  questionId: number;
};

export default function DeleteQuestionButton({
  questionId,
}: DeleteQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete question.");
      }

      toast.success("Question deleted successfully.");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Delete question"
        aria-label="Delete question"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#FFD9DC] bg-[#FFF4F4] text-[#F04452] transition hover:border-[#F6B8BF] hover:bg-[#FFE9EB] focus:outline-none focus:ring-2 focus:ring-[#FFE1E4]"
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F2430]/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-question-title"
            className="w-full max-w-md overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between px-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FFD9DC] bg-[#FFF4F4] text-[#F04452]">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3
                    id="delete-question-title"
                    className="text-base font-semibold text-[#1F2430]"
                  >
                    Delete question
                  </h3>
                  <p className="mt-1 text-xs text-[#77808E]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#9A95A3] transition hover:bg-[#F8F6FA] hover:text-[#44414C] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-[#77717F]">
                Are you sure you want to permanently delete this question and
                its answers?
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#EEEAF2] bg-[#FBFAFD] px-6 py-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="min-h-10 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#E34D59] px-4 text-[13px] font-medium text-white transition hover:bg-[#CB3544] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Deleting..." : "Delete Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
