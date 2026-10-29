"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReviewFormProps = {
  productId: number;
};

export default function ReviewForm({
  productId,
}: ReviewFormProps) {
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | null
  >(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setMessageType(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          title,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to submit review."
        );
        setMessageType("error");
        return;
      }

      setMessage("Review submitted successfully.");
      setMessageType("success");

      setRating(5);
      setTitle("");
      setComment("");

      router.refresh();
    } catch (error) {
      console.error("Review form error:", error);

      setMessage(
        "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="review-form rounded-2xl border p-6">
      <div>
        <p className="review-form-eyebrow text-xs font-bold uppercase tracking-[0.14em]">
          Share your experience
        </p>

        <h3 className="review-form-title mt-2 text-xl font-bold">
          Write a Review
        </h3>

        <p className="review-form-description mt-2 text-sm leading-6">
          Help other users understand your experience
          with this software.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="rating"
            className="review-form-label mb-2 block text-sm font-semibold"
          >
            Rating
          </label>

          <select
            id="rating"
            value={rating}
            onChange={(event) =>
              setRating(Number(event.target.value))
            }
            className="review-form-control w-full cursor-pointer rounded-xl border px-4 py-3 text-sm outline-none transition"
          >
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Very Good</option>
            <option value={3}>3 - Good</option>
            <option value={2}>2 - Fair</option>
            <option value={1}>1 - Poor</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="review-title"
            className="review-form-label mb-2 block text-sm font-semibold"
          >
            Review Title
          </label>

          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Summarize your experience"
            className="review-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
          />
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="review-form-label mb-2 block text-sm font-semibold"
          >
            Your Review
          </label>

          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
            placeholder="Tell us about your experience..."
            rows={5}
            className="review-form-control w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition"
          />
        </div>

        {message && (
          <p
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="site-primary-button inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Submitting..."
            : "Submit Review"}
        </button>
      </form>
    </div>
  );
}