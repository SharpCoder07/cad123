// lib/website-builder/SectionRenderer.tsx
import React from "react";
import Link from "next/link";
import ElementRenderer from "./ElementRenderer";
import { sanitizeRichHtml, sanitizeUrl } from "@/lib/cms/security";
import EnquiryForm from "@/components/EnquiryForm";

export interface CmsSectionData {
  id: string;
  name?: string | null;
  type: string;
  isVisible?: boolean;
  sortOrder?: number;
  settings?: Record<string, any> | null;
  content?: Record<string, any> | null;
  elements?: any[];
}

const PADDING_MAP: Record<string, string> = {
  none: "py-0",
  sm: "py-6",
  md: "py-12",
  lg: "py-16 md:py-20",
  xl: "py-24 md:py-32",
};

const WIDTH_MAP: Record<string, string> = {
  narrow: "max-w-4xl mx-auto px-4 sm:px-6",
  standard: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  wide: "max-w-[1440px] mx-auto px-4 sm:px-8",
  full: "w-full px-0",
};

export default function SectionRenderer({ section }: { section: CmsSectionData }) {
  if (section.isVisible === false) return null;

  const settings = (section.settings ?? {}) as Record<string, any>;
  const content = (section.content ?? {}) as Record<string, any>;
  const paddingClass = PADDING_MAP[settings.paddingY ?? "lg"] ?? PADDING_MAP.lg;
  const containerClass = WIDTH_MAP[settings.containerWidth ?? "standard"] ?? WIDTH_MAP.standard;
  const responsiveVisibility = [
    settings.hideOnMobile ? "hidden md:block" : "",
    settings.hideOnDesktop ? "md:hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const alignClass =
    settings.alignment === "center"
      ? "text-center items-center"
      : settings.alignment === "right"
      ? "text-right items-end"
      : "text-left items-start";

  const style: React.CSSProperties = {
    backgroundColor: settings.backgroundColor || undefined,
    color: settings.textColor || undefined,
  };

  return (
    <section
      id={section.id}
      style={style}
      className={`${paddingClass} ${responsiveVisibility} transition-colors`}
    >
      <div className={containerClass}>
        {renderControlledSectionBody(section.type, content, alignClass, section.elements)}
      </div>
    </section>
  );
}

function renderControlledSectionBody(
  type: string,
  content: Record<string, any>,
  alignClass: string,
  elements?: any[]
) {
  switch (type.toUpperCase()) {
    case "HERO":
      return (
        <div className={`flex flex-col gap-6 ${alignClass}`}>
          {content.badge && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
              {String(content.badge)}
            </span>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {String(content.title ?? "Compare the Best CAD & Engineering Software")}
          </h1>
          {content.subtitle && (
            <p className="max-w-2xl text-lg text-slate-600">{String(content.subtitle)}</p>
          )}
          <div className="flex flex-wrap gap-4 pt-2">
            {content.primaryCtaLabel && (
              <Link
                href={sanitizeUrl(content.primaryCtaUrl)}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {String(content.primaryCtaLabel)}
              </Link>
            )}
            {content.secondaryCtaLabel && (
              <Link
                href={sanitizeUrl(content.secondaryCtaUrl)}
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {String(content.secondaryCtaLabel)}
              </Link>
            )}
          </div>
          {content.imageUrl && (
            <div className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
              <img
                src={sanitizeUrl(content.imageUrl)}
                alt={String(content.imageAlt ?? content.title ?? "Hero Banner")}
                className="w-full object-cover"
              />
            </div>
          )}
        </div>
      );

    case "RICH_TEXT":
      return (
        <div className={`prose prose-slate max-w-none ${alignClass}`}>
          {content.title && <h2>{String(content.title)}</h2>}
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeRichHtml(String(content.html ?? content.body ?? "")),
            }}
          />
        </div>
      );

    case "FEATURE_GRID": {
      const items = Array.isArray(content.items) ? content.items : [];
      return (
        <div className="space-y-10">
          {(content.title || content.subtitle) && (
            <div className={`flex flex-col gap-3 ${alignClass}`}>
              {content.title && <h2 className="text-3xl font-bold">{String(content.title)}</h2>}
              {content.subtitle && <p className="text-slate-600 max-w-2xl">{String(content.subtitle)}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{String(item.title ?? "")}</h3>
                <p className="mt-2 text-sm text-slate-600">{String(item.description ?? "")}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "STATS_COUNTER": {
      const stats = Array.isArray(content.items) ? content.items : [];
      return (
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat: any, idx: number) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-extrabold text-blue-600">{String(stat.value ?? "0")}</div>
              <div className="mt-1 text-sm font-medium text-slate-600">{String(stat.label ?? "")}</div>
            </div>
          ))}
        </div>
      );
    }

    case "TESTIMONIALS": {
      const testimonials = Array.isArray(content.items) ? content.items : [];
      return (
        <div className="space-y-10">
          {content.title && <h2 className="text-3xl font-bold text-center">{String(content.title)}</h2>}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t: any, idx: number) => (
              <blockquote key={idx} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-slate-700 italic">&ldquo;{String(t.quote ?? "")}&rdquo;</p>
                <footer className="mt-4 text-sm font-semibold text-slate-900">
                  {String(t.author ?? "")}
                  {t.role && <span className="block text-xs font-normal text-slate-500">{String(t.role)}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      );
    }

    case "FAQ_ACCORDION": {
      const faqs = Array.isArray(content.items) ? content.items : [];
      return (
        <div className="max-w-3xl mx-auto space-y-6">
          {content.title && <h2 className="text-3xl font-bold text-center">{String(content.title)}</h2>}
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {faqs.map((faq: any, idx: number) => (
              <details key={idx} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
                  <span>{String(faq.question ?? "")}</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600">{String(faq.answer ?? "")}</p>
              </details>
            ))}
          </div>
        </div>
      );
    }

    case "CTA_BANNER":
      return (
        <div className="rounded-2xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold">{String(content.title ?? "Ready to get started?")}</h2>
          {content.subtitle && <p className="mx-auto mt-3 max-w-xl text-slate-300">{String(content.subtitle)}</p>}
          {content.buttonLabel && (
            <div className="mt-6">
              <Link
                href={sanitizeUrl(content.buttonUrl)}
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {String(content.buttonLabel)}
              </Link>
            </div>
          )}
        </div>
      );

    case "CONTACT_FORM":
      return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {content.title && <h2 className="text-2xl font-bold mb-2">{String(content.title)}</h2>}
          {content.subtitle && <p className="text-sm text-slate-600 mb-6">{String(content.subtitle)}</p>}
          <EnquiryForm productId={content.productId} />
        </div>
      );

    default:
      // Fallback to existing WebsiteElement renderer for custom visual builder sections
      return (
        <div className="space-y-4">
          {Array.isArray(elements) &&
            elements.map((el: any) => <ElementRenderer key={el.id} element={el} />)}
        </div>
      );
  }
}