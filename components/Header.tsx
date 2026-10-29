import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import AuthButtons from "@/components/AuthButtons";
import HeaderNavigation from "@/components/HeaderNavigation";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--site-border)",
        backgroundColor:
          "color-mix(in srgb, var(--site-background) 95%, transparent)",
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 cursor-pointer items-center"
          aria-label="CADGram home"
        >
          <img
            src="https://www.cadgram.com/wp-content/uploads/2026/08/cropped-Cadgram-logo.png"
            alt="CADGram"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <HeaderNavigation />
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <AuthButtons
            isLoggedIn={!!session?.user}
          />

          <Link
            href="/contact"
            className="site-secondary-button inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            Contact Us
          </Link>
        </div>

        {/* Mobile navigation */}
        <div className="lg:hidden">
          <HeaderNavigation
            mobile
            isLoggedIn={!!session?.user}
          />
        </div>
      </div>
    </header>
  );
}