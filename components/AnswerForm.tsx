"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AnswerFormProps = {
  questionId: number;
};

export default function AnswerForm({
  questionId,
}: AnswerFormProps) {
  const router = useRouter();

  const [answer, setAnswer] = useState("");
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

    if (!answer.trim()) {
      setMessage("Please enter your answer.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to submit answer."
        );
        setMessageType("error");
        return;
      }

      setMessage("Answer submitted successfully.");
      setMessageType("success");
      setAnswer("");

      router.refresh();
    } catch (error) {
      console.error("Answer form error:", error);

      setMessage(
        "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="answer-form mt-4"
    >
      <label
        htmlFor={`answer-${questionId}`}
        className="answer-form-label mb-2 block text-sm font-semibold"
      >
        Your Answer
      </label>

      <textarea
        id={`answer-${questionId}`}
        value={answer}
        onChange={(event) =>
          setAnswer(event.target.value)
        }
        placeholder="Write your answer..."
        rows={3}
        className="answer-form-control w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition"
      />

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
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
        className="site-primary-button mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Submitting..."
          : "Submit Answer"}
      </button>
    </form>
  );
}