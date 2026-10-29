"use client";

import { useEffect, useState } from "react";

const sections = [
  { label: "Overview", id: "overview" },
  { label: "Pricing", id: "pricing" },
  { label: "Features", id: "features" },
  { label: "Specifications", id: "specifications" },
  { label: "Gallery", id: "gallery" },
  { label: "Reviews", id: "reviews" },
  { label: "FAQs", id: "faqs" },
  { label: "Q&A", id: "questions" },
  { label: "Alternatives", id: "alternatives" },
];

export default function ProductSectionNav() {
  const [activeSection, setActiveSection] =
    useState("overview");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element =
        document.getElementById(section.id);

      if (!element) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        {
          rootMargin: "-120px 0px -65% 0px",
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) =>
        observer.disconnect()
      );
    };
  }, []);

  return (
    <nav className="product-section-nav sticky top-[72px] z-30 mt-6 overflow-x-auto rounded-xl border shadow-sm">
      <div className="flex min-w-max items-center px-2">
        {sections.map((section) => {
          const isActive =
            activeSection === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`product-section-nav-link cursor-pointer whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive ? "is-active" : ""
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}