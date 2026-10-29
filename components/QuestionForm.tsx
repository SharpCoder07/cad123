"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type QuestionFormProps = {
  productId: number;
};

export default function QuestionForm({
  productId,
}: QuestionFormProps) {
  const router = useRouter();

  const [question, setQuestion] = useState("");
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

    if (!question.trim()) {
      setMessage("Please enter your question.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to submit question."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        "Question submitted successfully."
      );
      setMessageType("success");
      setQuestion("");

      router.refresh();
    } catch (error) {
      console.error(
        "Question form error:",
        error
      );

      setMessage(
        "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="question-form rounded-2xl border p-6">
      <div>
        <p className="question-form-eyebrow text-xs font-bold uppercase tracking-[0.14em]">
          Community Q&A
        </p>

        <h3 className="question-form-title mt-2 text-xl font-bold">
          Ask a Question
        </h3>

        <p className="question-form-description mt-2 text-sm leading-6">
          Have a question about this product? Ask the
          community.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="product-question"
            className="question-form-label mb-2 block text-sm font-semibold"
          >
            Your Question
          </label>

          <textarea
            id="product-question"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Ask something about this product..."
            rows={4}
            className="question-form-control w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition"
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
            : "Ask Question"}
        </button>
      </form>
    </div>
  );
}