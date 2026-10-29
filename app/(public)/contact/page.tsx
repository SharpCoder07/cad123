"use client";

import { useState } from "react";
import { ArrowRight, Mail, MapPin, MessageSquare, Send } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter your message.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to send message.");
        return;
      }

      toast.success("Message sent successfully.");

      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Contact form error:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="contact-page-hero relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="contact-page-glow-primary pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="contact-page-glow-accent pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full blur-[110px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="contact-page-eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <MessageSquare size={14} />

              <span className="text-xs font-bold uppercase tracking-[0.15em]">
                Get in Touch
              </span>
            </div>

            <h1
              className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "var(--site-text)" }}
            >
              Contact CADGram
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--site-muted)" }}
            >
              Have a question about software, pricing or a product? Get in touch
              with our team and we&apos;ll help you find the information you
              need.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT CONTENT
      ====================================================== */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid overflow-hidden rounded-[30px] border lg:grid-cols-[0.85fr_1.15fr] contact-page-shell">
            {/* =================================================
                CONTACT INFORMATION
            ================================================== */}
            <section className="contact-info-panel relative overflow-hidden p-7 sm:p-9 lg:p-10">
              <div
                aria-hidden="true"
                className="contact-info-glow pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full blur-[90px]"
              />

              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                  Contact Information
                </p>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  We&apos;re here to help.
                </h2>

                <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
                  Reach out with questions about software products, pricing,
                  comparisons or anything else related to CADGram.
                </p>

                <div className="mt-10 space-y-5">
                  {/* Email */}
                  <a
                    href="mailto:support@cadgram.com"
                    className="contact-info-item group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition"
                  >
                    <div className="contact-info-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition">
                      <Mail size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-white transition group-hover:text-[var(--site-accent)]">
                        support@cadgram.com
                      </p>
                    </div>
                  </a>

                  {/* Location */}
                  <div className="contact-info-item flex items-start gap-4 rounded-2xl border p-4">
                    <div className="contact-info-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                      <MapPin size={18} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                        Location
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-7">
                  <p className="text-sm leading-6 text-white/50">
                    Looking for software instead?
                  </p>

                  <Link
                    href="/products"
                    className="contact-explore-link mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                  >
                    Explore Software
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>

            {/* =================================================
                CONTACT FORM
            ================================================== */}
            <section className="contact-form-panel p-7 sm:p-9 lg:p-10">
              <div className="max-w-xl">
                <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                  Send a Message
                </p>

                <h2
                  className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
                  style={{ color: "var(--site-text)" }}
                >
                  How can we help?
                </h2>

                <p
                  className="mt-3 text-sm leading-6"
                  style={{ color: "var(--site-muted)" }}
                >
                  Fill in the form below and send your message to the CADGram
                  team.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="contact-form-label mb-2 block text-sm font-semibold"
                    >
                      Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      disabled={isSubmitting}
                      required
                      className="contact-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="contact-form-label mb-2 block text-sm font-semibold"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                      required
                      className="contact-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="contact-form-label mb-2 block text-sm font-semibold"
                    >
                      Message
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={6}
                      placeholder="Tell us how we can help..."
                      disabled={isSubmitting}
                      required
                      className="contact-form-control min-h-[150px] w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="site-primary-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="contact-submit-spinner h-4 w-4 rounded-full border-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={15} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
