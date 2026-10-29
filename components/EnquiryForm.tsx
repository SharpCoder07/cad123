"use client";

import { useState } from "react";

type EnquiryFormProps = {
  productId: number;
  productName: string;
};

export default function EnquiryForm({
  productId,
  productName,
}: EnquiryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] =
    useState("");
  const [statusType, setStatusType] = useState<
    "success" | "error" | null
  >(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setStatusMessage("");
    setStatusType(null);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          name,
          email,
          phone,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage(
          data.message ||
            "Failed to submit enquiry."
        );
        setStatusType("error");
        return;
      }

      setStatusMessage(
        "Enquiry submitted successfully."
      );
      setStatusType("success");

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      console.error(
        "Enquiry submission error:",
        error
      );

      setStatusMessage(
        "Something went wrong. Please try again."
      );
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="enquiry-form space-y-5"
    >
      <div>
        <label
          htmlFor="enquiry-name"
          className="enquiry-form-label mb-2 block text-sm font-semibold"
        >
          Name
        </label>

        <input
          id="enquiry-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
          autoComplete="name"
          className="enquiry-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label
          htmlFor="enquiry-email"
          className="enquiry-form-label mb-2 block text-sm font-semibold"
        >
          Email
        </label>

        <input
          id="enquiry-email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          autoComplete="email"
          className="enquiry-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label
          htmlFor="enquiry-phone"
          className="enquiry-form-label mb-2 block text-sm font-semibold"
        >
          Phone
        </label>

        <input
          id="enquiry-phone"
          type="tel"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          autoComplete="tel"
          className="enquiry-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label
          htmlFor="enquiry-message"
          className="enquiry-form-label mb-2 block text-sm font-semibold"
        >
          Message
        </label>

        <textarea
          id="enquiry-message"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          rows={5}
          className="enquiry-form-control w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition"
          placeholder={`Tell us what you need regarding ${productName}`}
        />
      </div>

      {statusMessage && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            statusType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {statusMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="site-primary-button inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Submitting..."
          : "Send Enquiry"}
      </button>
    </form>
  );
}