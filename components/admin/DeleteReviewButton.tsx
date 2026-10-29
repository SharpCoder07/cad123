"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

export default function DeleteReviewButton({
  reviewId,
}: {
  reviewId: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?",
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete review.");
        return;
      }

      toast.success("Review deleted successfully.");
      router.refresh();
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("Something went wrong while deleting the review.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      title="Delete review"
      aria-label="Delete review"
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#FFD9DC] bg-[#FFF4F4] text-[#F04452] transition hover:border-[#FFC3C8] hover:bg-[#FFE9EB] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={16} strokeWidth={1.9} />
    </button>
  );
}
