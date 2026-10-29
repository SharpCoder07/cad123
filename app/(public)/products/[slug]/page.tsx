import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleHelp,
  ExternalLink,
  FileQuestion,
  GalleryHorizontalEnd,
  ImageIcon,
  Info,
  Layers3,
  MessageCircle,
  Package,
  Send,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

import { getProductBySlug } from "@/lib/data/products";

import EnquiryForm from "@/components/EnquiryForm";
import ReviewForm from "@/components/ReviewForm";
import QuestionForm from "@/components/QuestionForm";
import AnswerForm from "@/components/AnswerForm";
import ProductSectionNav from "@/components/ProductSectionNav";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   Metadata
========================================================= */

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | CADGram",
    };
  }

  return {
    title: `${product.name} - Features, Pricing & Reviews | CADGram`,
    description:
      product.shortDescription ||
      `Explore ${product.name}, including features, pricing, reviews, specifications and alternatives.`,
  };
}

/* =========================================================
   Product Page
========================================================= */

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const heroImage =
    product.images.find((image) => image.type === "hero") || product.images[0];

  const galleryImages = product.images.filter(
    (image) => image.type === "gallery",
  );

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      {/* ===================================================
          HERO
      ==================================================== */}

      <section className="product-detail-hero relative overflow-hidden border-b">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="product-detail-glow-primary absolute -left-40 top-0 h-96 w-96 rounded-full blur-[120px]" />

          <div className="product-detail-glow-accent absolute -right-40 top-10 h-96 w-96 rounded-full blur-[120px]" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          {/* Back */}
          <Link
            href="/products"
            className="product-detail-back group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Software
          </Link>

          {/* Hero card */}
          <div className="product-detail-card mt-7 grid gap-8 overflow-hidden rounded-[32px] border p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)] sm:p-8 lg:grid-cols-[360px_1fr] lg:gap-12 lg:p-10">
            {/* Product visual */}
            <div className="product-detail-visual relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[26px] border p-8 lg:min-h-[360px]">
              <div
                aria-hidden="true"
                className="product-detail-visual-glow absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[60px]"
              />

              {heroImage ? (
                <img
                  src={heroImage.url}
                  alt={heroImage.altText || `${product.name} preview`}
                  className="relative z-10 max-h-[280px] w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                />
              ) : product.logo ? (
                <img
                  src={product.logo}
                  alt={`${product.name} logo`}
                  className="relative z-10 max-h-40 max-w-[220px] object-contain"
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="product-detail-fallback-icon flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm">
                    <Package size={32} />
                  </div>

                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--site-muted)" }}
                  >
                    {product.name}
                  </span>
                </div>
              )}
            </div>

            {/* Product information */}
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="product-detail-category inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold">
                  <Layers3 size={12} />
                  {product.category.name}
                </span>

                {product.freeTrial && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <BadgeCheck size={12} />
                    Free Trial
                  </span>
                )}
              </div>

              <h1
                className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--site-text)" }}
              >
                {product.name}
              </h1>

              <p
                className="mt-3 text-sm font-semibold sm:text-base"
                style={{ color: "var(--site-muted)" }}
              >
                by{" "}
                <span style={{ color: "var(--site-text)" }}>
                  {product.brand.name}
                </span>
              </p>

              {product.shortDescription && (
                <p
                  className="mt-5 max-w-3xl text-sm leading-7 sm:text-base"
                  style={{ color: "var(--site-muted)" }}
                >
                  {product.shortDescription}
                </p>
              )}

              {/* Rating */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                {product.rating !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3">
                      <Star
                        size={16}
                        className="fill-amber-400 text-amber-400"
                      />

                      <span
                        className="font-bold"
                        style={{ color: "var(--site-text)" }}
                      >
                        {product.rating}
                      </span>
                    </div>

                    <span className="text-sm text-slate-500">
                      {product.reviewCount}{" "}
                      {product.reviewCount === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">No ratings yet</span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                {product.website && (
                  <a
                    href={product.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-primary-button group inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                  >
                    Visit Official Website
                    <ExternalLink
                      size={15}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </a>
                )}

                <Link
                  href={`/compare?products=${product.slug}`}
                  className="product-detail-secondary-button group inline-flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition"
                >
                  Compare Product
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION NAVIGATION
      ==================================================== */}

      <ProductSectionNav />

      {/* ===================================================
          PAGE CONTENT
      ==================================================== */}

      <div className="product-detail-card mt-6 rounded-[26px] border p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-8">
        {/* =================================================
            OVERVIEW
        ================================================== */}

        <section id="overview" className="scroll-mt-44">
          <SectionHeading
            eyebrow="Overview"
            title={`About ${product.name}`}
            description="Learn more about the product, its capabilities and where it fits."
            icon={<Info size={17} />}
          />

          <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-8">
            {product.description ? (
              <p
                className="whitespace-pre-line text-sm leading-8 sm:text-base"
                style={{ color: "var(--site-muted)" }}
              >
                {product.description}
              </p>
            ) : (
              <EmptyInline
                text={`Detailed information about ${product.name} is not available yet.`}
              />
            )}
          </div>
        </section>

        {/* =================================================
            PRICING
        ================================================== */}

        <section id="pricing" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Pricing"
            title="Pricing Plans"
            description={`Explore available ${product.name} pricing options.`}
            icon={<Tag size={17} />}
          />

          {product.pricingPlans.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {product.pricingPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`product-pricing-card relative overflow-hidden rounded-[26px] border p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
                    index === 0 ? "is-featured" : ""
                  }`}
                >
                  {index === 0 && (
                    <span className="product-pricing-badge absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                      First option
                    </span>
                  )}

                  <h3
                    className="pr-24 text-xl font-bold"
                    style={{ color: "var(--site-text)" }}
                  >
                    {plan.name}
                  </h3>

                  {plan.description && (
                    <p
                      className="mt-2 min-h-[40px] text-sm leading-6 text-slate-500"
                      style={{ color: "var(--site-muted)" }}
                    >
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-6">
                    {plan.price !== null ? (
                      <div className="flex flex-wrap items-end gap-1.5">
                        <span
                          className="text-3xl font-bold tracking-tight"
                          style={{ color: "var(--site-text)" }}
                        >
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>

                        {plan.billing && (
                          <span
                            className="pb-1 text-sm text-slate-500"
                            style={{ color: "var(--site-muted)" }}
                          >
                            / {plan.billing}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--site-text)" }}
                      >
                        Contact for pricing
                      </span>
                    )}
                  </div>

                  {plan.features && (
                    <div
                      className="mt-6 border-t pt-5"
                      style={{ borderColor: "var(--site-border)" }}
                    >
                      <p className="text-sm leading-7 text-slate-600">
                        {plan.features}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<Tag size={22} />}
              title="Pricing information unavailable"
              description="No pricing plans have been added for this product yet."
            />
          )}
        </section>

        {/* =================================================
            FEATURES
        ================================================== */}

        <section id="features" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Features"
            title="Key Features"
            description={`Explore the capabilities available with ${product.name}.`}
            icon={<Sparkles size={17} />}
          />

          {product.features.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.features.map((item) => (
                <div
                  key={item.id}
                  className="product-feature-card group rounded-[22px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="product-feature-icon flex h-10 w-10 items-center justify-center rounded-xl transition">
                    <Check size={17} />
                  </div>

                  <h3
                    className="mt-4 font-bold"
                    style={{ color: "var(--site-text)" }}
                  >
                    {item.feature.name}
                  </h3>

                  {item.feature.description && (
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--site-muted)" }}
                    >
                      {item.feature.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<Sparkles size={22} />}
              title="Features coming soon"
              description="Feature information has not been added for this product yet."
            />
          )}
        </section>

        {/* =================================================
            SPECIFICATIONS
        ================================================== */}

        <section id="specifications" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Specifications"
            title="Product Specifications"
            description="Technical and product information at a glance."
            icon={<Layers3 size={17} />}
          />

          {product.specifications.length > 0 ? (
            <div className="product-specifications mt-6 overflow-hidden rounded-[26px] border">
              {product.specifications.map((item) => (
                <div
                  key={item.id}
                  className="product-specification-row grid border-b last:border-b-0 sm:grid-cols-[280px_1fr]"
                >
                  <div className="product-specification-name px-5 py-4 text-sm font-semibold sm:px-6">
                    {item.specification.name}
                  </div>

                  <div
                    className="px-5 py-4 text-sm font-medium sm:px-6"
                    style={{ color: "var(--site-text)" }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<Layers3 size={22} />}
              title="Specifications unavailable"
              description="Technical specifications have not been added yet."
            />
          )}
        </section>

        {/* =================================================
            ADDITIONAL INFORMATION
        ================================================== */}

        {(product.deployment ||
          product.supportedPlatforms ||
          product.targetAudience) && (
          <section className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.deployment && (
                <InformationCard
                  label="Deployment"
                  value={product.deployment}
                />
              )}

              {product.supportedPlatforms && (
                <InformationCard
                  label="Supported Platforms"
                  value={product.supportedPlatforms}
                />
              )}

              {product.targetAudience && (
                <InformationCard
                  label="Target Audience"
                  value={product.targetAudience}
                />
              )}
            </div>
          </section>
        )}

        {/* =================================================
            GALLERY
        ================================================== */}

        {galleryImages.length > 0 && (
          <section id="gallery" className="mt-16 scroll-mt-44">
            <SectionHeading
              eyebrow="Gallery"
              title="Product Images"
              description={`Take a closer look at ${product.name}.`}
              icon={<GalleryHorizontalEnd size={17} />}
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="product-gallery-card group flex min-h-[260px] items-center justify-center overflow-hidden rounded-[24px] border p-4 transition hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)]"
                >
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="max-h-[240px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =================================================
            REVIEWS
        ================================================== */}

        <section id="reviews" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Reviews"
            title="Customer Reviews"
            description={`See what users are saying about ${product.name}.`}
            icon={<MessageCircle size={17} />}
          />

          {/* Review form */}
          <div className="product-detail-card mt-6 rounded-[26px] p-5 sm:p-7">
            <ReviewForm productId={product.id} />
          </div>

          {/* Reviews */}
          <div className="mt-5">
            {product.reviews.length === 0 ? (
              <SectionEmptyState
                icon={<MessageCircle size={22} />}
                title="No reviews yet"
                description={`Be the first to share your experience with ${product.name}.`}
              />
            ) : (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="product-detail-card rounded-[22px] border p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="product-review-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                          {(review.user.name || "A").charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h3
                            className="font-bold"
                            style={{ color: "var(--site-text)" }}
                          >
                            {review.user.name || "Anonymous"}
                          </h3>

                          <time className="mt-1 block text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </time>
                        </div>
                      </div>

                      <div className="flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5">
                        <Star
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />

                        <span className="text-sm font-bold text-slate-800">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>

                    {review.title && (
                      <p className="mt-5 font-bold text-slate-800">
                        {review.title}
                      </p>
                    )}

                    {review.comment && (
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            FAQ
        ================================================== */}

        <section id="faqs" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="FAQs"
            title="Frequently Asked Questions"
            description={`Common questions about ${product.name}.`}
            icon={<CircleHelp size={17} />}
          />

          {product.faqs.length > 0 ? (
            <div className="mt-6 space-y-3">
              {product.faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <span className="product-faq-number flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <h3
                        className="font-bold leading-6 text-slate-900"
                        style={{ color: "var(--site-text)" }}
                      >
                        {faq.question}
                      </h3>

                      <p
                        className="mt-3 text-sm leading-7 text-slate-600"
                        style={{ color: "var(--site-muted)" }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<CircleHelp size={22} />}
              title="No FAQs available"
              description="Frequently asked questions have not been added yet."
            />
          )}
        </section>

        {/* =================================================
            QUESTIONS & ANSWERS
        ================================================== */}

        <section id="questions" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Community"
            title="Questions & Answers"
            description={`Ask questions and find answers about ${product.name}.`}
            icon={<FileQuestion size={17} />}
          />

          {product.questions.length > 0 ? (
            <div className="mt-6 space-y-4">
              {product.questions.map((item) => (
                <div
                  key={item.id}
                  className="product-detail-card rounded-[24px] border p-5 sm:p-6"
                >
                  {/* Question */}
                  <div className="flex gap-3">
                    <div className="product-question-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white">
                      Q
                    </div>

                    <div>
                      <p className="font-bold leading-6 text-slate-900">
                        {item.question}
                      </p>

                      {item.user?.name && (
                        <p className="mt-1 text-xs text-slate-400">
                          Asked by {item.user.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answers */}
                  {item.answers.length > 0 ? (
                    <div className="product-answer-list ml-0 mt-5 space-y-3 border-l-2 pl-4 sm:ml-12">
                      {item.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="product-answer-card rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2">
                            <div className="product-answer-badge flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white">
                              A
                            </div>

                            <span className="text-xs font-semibold text-slate-500">
                              {answer.user?.name || "Answer"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {answer.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ml-12 mt-4 text-sm text-slate-400">
                      No answers yet.
                    </p>
                  )}

                  <div
                    className="mt-5 border-t pt-5"
                    style={{ borderColor: "var(--site-border)" }}
                  >
                    <AnswerForm questionId={item.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<FileQuestion size={22} />}
              title="No questions yet"
              description={`Be the first to ask a question about ${product.name}.`}
            />
          )}

          {/* Ask question */}
          <div className="mt-5 pt-5">
            <QuestionForm productId={product.id} />
          </div>
        </section>

        {/* =================================================
            ALTERNATIVES
        ================================================== */}

        <section id="alternatives" className="mt-16 scroll-mt-44">
          <SectionHeading
            eyebrow="Alternatives"
            title="Software Alternatives"
            description={`Explore other software you may want to compare with ${product.name}.`}
            icon={<Package size={17} />}
          />

          {product.alternatives.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {product.alternatives.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.alternative.slug}`}
                  className="product-alternative-card group flex min-h-[210px] cursor-pointer flex-col rounded-[24px] border p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="product-alternative-logo flex h-11 w-11 items-center justify-center rounded-xl">
                      {item.alternative.logo ? (
                        <img
                          src={item.alternative.logo}
                          alt={`${item.alternative.name} logo`}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Package size={18} />
                      )}
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="product-alternative-arrow transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>

                  <h3 className="product-alternative-title mt-5 text-lg font-bold transition">
                    {item.alternative.name}
                  </h3>

                  <p
                    className="mt-2 line-clamp-2 text-sm leading-6"
                    style={{ color: "var(--site-muted)" }}
                  >
                    {item.alternative.shortDescription ||
                      "Explore features, pricing and product information."}
                  </p>

                  <div className="product-alternative-action mt-auto flex items-center gap-2 pt-5 text-sm font-semibold">
                    View product
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              icon={<Package size={22} />}
              title="No alternatives available"
              description="Alternative software recommendations have not been added yet."
            />
          )}
        </section>

        {/* =================================================
            ENQUIRY
        ================================================== */}

        <section
          className="mt-16 overflow-hidden rounded-[32px]"
          style={{ backgroundColor: "var(--site-secondary)" }}
        >
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            {/* CTA */}
            <div className="relative overflow-hidden p-7 text-white sm:p-9 lg:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="product-enquiry-primary-glow absolute -left-20 -top-20 h-64 w-64 rounded-full blur-[90px]" />

                <div className="product-enquiry-accent-glow absolute -bottom-20 -right-20 h-64 w-64 rounded-full blur-[90px]" />
              </div>

              <div className="relative">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"
                  style={{ color: "var(--site-accent)" }}
                >
                  <Send size={19} />
                </div>

                <p
                  className="mt-7 text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: "var(--site-accent)" }}
                >
                  Product Enquiry
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Interested in {product.name}?
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
                  Tell us what you need and share your requirements. Our team
                  can help you with product information and the next steps.
                </p>

                <div className="mt-8 space-y-3">
                  <EnquiryPoint text="Share your software requirements" />
                  <EnquiryPoint text="Ask about licensing and pricing" />
                  <EnquiryPoint text="Get help choosing the right solution" />
                </div>
              </div>
            </div>

            {/* Form */}
            <div
              className="p-6 sm:p-8 lg:p-10"
              style={{ backgroundColor: "var(--site-background)" }}
            >
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Contact us
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-950">
                  Send an enquiry
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Complete the form and provide a few details about what you're
                  looking for.
                </p>
              </div>

              <EnquiryForm productId={product.id} productName={product.name} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Shared Section Heading
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <div
        className="flex items-center gap-2"
        style={{ color: "var(--site-primary)" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-primary) 9%, var(--site-background))",
          }}
        >
          {icon}
        </div>

        <span className="text-xs font-bold uppercase tracking-[0.15em]">
          {eyebrow}
        </span>
      </div>

      <h2
        className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
        style={{ color: "var(--site-text)" }}
      >
        {title}
      </h2>

      {description && (
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "var(--site-muted)" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   Information Card
========================================================= */

function InformationCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="product-detail-card rounded-[20px] border p-5">
      <p
        className="text-xs font-bold uppercase tracking-[0.1em]"
        style={{ color: "var(--site-muted)" }}
      >
        {label}
      </p>

      <p
        className="mt-2 text-sm font-bold leading-6"
        style={{ color: "var(--site-text)" }}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   Section Empty State
========================================================= */

function SectionEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="product-section-empty mt-6 rounded-[24px] border border-dashed px-6 py-12 text-center">
      <div className="product-section-empty-icon mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
        {icon}
      </div>

      <h3 className="mt-4 font-bold" style={{ color: "var(--site-text)" }}>
        {title}
      </h3>

      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{ color: "var(--site-muted)" }}
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   Inline Empty
========================================================= */

function EmptyInline({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-3 text-sm"
      style={{ color: "var(--site-muted)" }}
    >
      <ImageIcon size={18} className="mt-0.5 shrink-0" />

      <p>{text}</p>
    </div>
  );
}

/* =========================================================
   Enquiry Point
========================================================= */

function EnquiryPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/70">
      <div className="product-enquiry-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        <Check size={12} />
      </div>

      {text}
    </div>
  );
}
