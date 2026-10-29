import Link from "next/link";
import { ArrowUpRight, GitCompareArrows } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative border-t text-white"
      style={{
        borderColor: "color-mix(in srgb, var(--site-primary) 35%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--site-secondary) 88%, black)",
      }}
    >
      {/* Section divider */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--site-primary) 30%, var(--site-accent) 70%, transparent 100%)",
        }}
      />
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-16">
        {/* Top CTA */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{
                color: "var(--site-accent)",
              }}
            >
              Find the right software
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Compare software before you decide.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Explore software for CAD, engineering, design and business
              workflows, then compare the options that fit your requirements.
            </p>
          </div>

          <Link
            href="/compare"
            className="footer-compare-button inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
          >
            <GitCompareArrows size={16} />
            Compare Software
          </Link>
        </div>

        {/* Footer columns */}
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex cursor-pointer items-center"
              aria-label="CADGram home"
            >
              <img
                src="https://www.cadgram.com/wp-content/uploads/2026/08/cropped-Cadgram-logo.png"
                alt="CADGram"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>

            <p className="mt-5 text-sm leading-6 text-white/60">
              A software discovery platform helping users explore and compare
              CAD, engineering, design and business solutions.
            </p>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore">
            <FooterLink href="/products">Products</FooterLink>

            <FooterLink href="/category">Categories</FooterLink>

            <FooterLink href="/brand">Brands</FooterLink>

            <FooterLink href="/compare">Compare</FooterLink>
          </FooterColumn>

          {/* Resources */}
          <FooterColumn title="Resources">
            <FooterLink href="/blog">Blog</FooterLink>

            <FooterLink href="/contact">Contact Us</FooterLink>

            <FooterLink href="/login">Login</FooterLink>
          </FooterColumn>

          {/* Discover */}
          <div>
            <h3 className="text-sm font-bold text-white">Discover</h3>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Browse software by category, explore brands or compare products
              side by side.
            </p>

            <Link
              href="/products"
              className="footer-discover-link group mt-5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold transition"
            >
              Browse software
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} CADGram. All rights reserved.</p>

          <p>Software discovery and comparison platform.</p>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   Footer Column
========================================================= */

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>

      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

/* =========================================================
   Footer Link
========================================================= */

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="footer-link block w-fit cursor-pointer text-sm transition hover:translate-x-0.5"
    >
      {children}
    </Link>
  );
}
