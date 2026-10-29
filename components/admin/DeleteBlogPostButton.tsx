"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

type Props = {
  postId: number;
};

export default function DeleteBlogPostButton({ postId }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showConfirm) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setShowConfirm(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showConfirm, deleting]);

  async function handleDelete() {
    if (deleting) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/blog-posts/${postId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete blog post.");
        return;
      }

      toast.success("Blog post deleted successfully.");
      setShowConfirm(false);
      router.refresh();
    } catch (error) {
      console.error("Delete blog post error:", error);
      toast.error("Something went wrong while deleting the blog post.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        aria-label="Delete blog post"
        title="Delete blog post"
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:border-[#F0BFC5] hover:bg-[#FFE4E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC5361]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1A27]/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setShowConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-blog-title-${postId}`}
            aria-describedby={`delete-blog-description-${postId}`}
            className="w-full max-w-[430px] rounded-[22px] border border-[#EAE7EF] bg-white p-6 shadow-[0_24px_80px_rgba(31,26,39,0.20)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]">
                <AlertTriangle size={23} aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                aria-label="Close confirmation"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#9892A0] transition hover:bg-[#F8F6FA] hover:text-[#44414C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <h3
              id={`delete-blog-title-${postId}`}
              className="mt-5 text-[19px] font-semibold tracking-[-0.03em] text-[#1F2430]"
            >
              Delete Blog Post?
            </h3>
            <p
              id={`delete-blog-description-${postId}`}
              className="mt-2 text-[13px] leading-6 text-[#77808E]"
            >
              Are you sure you want to delete this blog post? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-4 text-[13px] font-medium text-white transition hover:bg-[#C94050] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
                    Delete Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
