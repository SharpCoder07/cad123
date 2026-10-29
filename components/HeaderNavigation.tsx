"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

import AuthButtons from "@/components/AuthButtons";

type HeaderNavigationProps = {
  mobile?: boolean;
  isLoggedIn?: boolean;
};

const navigation = [
  {
    label: "Products",
    href: "/products",
  },
  {
    label: "Categories",
    href: "/category",
  },
  {
    label: "Brands",
    href: "/brand",
  },
  {
    label: "Compare",
    href: "/compare",
  },
  {
    label: "Blog",
    href: "/blog",
  },
];

export default function HeaderNavigation({
  mobile = false,
  isLoggedIn = false,
}: HeaderNavigationProps) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] =
    useState(false);

  /* Close mobile menu after navigation */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Prevent page scrolling while drawer is open */
  useEffect(() => {
    if (!mobile) return;

    if (menuOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, mobile]);

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  /* =======================================================
     DESKTOP
  ======================================================== */

  if (!mobile) {
    return (
      <nav
        className="flex items-center gap-1"
        aria-label="Main navigation"
      >
        {navigation.map((item) => {
          const active = isActive(
            item.href
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold transition"
              style={{
                color: active
                  ? "var(--site-primary)"
                  : "var(--site-muted)",

                backgroundColor: active
                  ? "color-mix(in srgb, var(--site-primary) 9%, transparent)"
                  : "transparent",
              }}
              onMouseEnter={(event) => {
                if (!active) {
                  event.currentTarget.style.color =
                    "var(--site-text)";

                  event.currentTarget.style.backgroundColor =
                    "var(--site-surface)";
                }
              }}
              onMouseLeave={(event) => {
                if (!active) {
                  event.currentTarget.style.color =
                    "var(--site-muted)";

                  event.currentTarget.style.backgroundColor =
                    "transparent";
                }
              }}
            >
              {item.label}

              {active && (
                <span
                  className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      "var(--site-primary)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  /* =======================================================
     MOBILE
  ======================================================== */

  return (
    <>
      {/* Menu button */}
      <button
        type="button"
        onClick={() =>
          setMenuOpen(true)
        }
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition"
        style={{
          borderColor:
            "var(--site-border)",
          backgroundColor:
            "var(--site-background)",
          color: "var(--site-text)",
        }}
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--site-secondary) 45%, transparent)",
        }}
        onClick={() =>
          setMenuOpen(false)
        }
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[60] flex h-dvh w-[min(88vw,360px)] flex-col shadow-[-20px_0_60px_rgba(15,23,42,0.15)] transition-transform duration-300 ease-out ${
          menuOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
        style={{
          backgroundColor:
            "var(--site-background)",
        }}
        aria-hidden={!menuOpen}
      >
        {/* Drawer header */}
        <div
          className="flex h-[72px] items-center justify-between border-b px-5"
          style={{
            borderColor:
              "var(--site-border)",
          }}
        >
          <Link
            href="/"
            onClick={() =>
              setMenuOpen(false)
            }
            className="cursor-pointer"
          >
            <img
              src="https://www.cadgram.com/wp-content/uploads/2026/08/cropped-Cadgram-logo.png"
              alt="CADGram"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition"
            style={{
              backgroundColor:
                "var(--site-surface)",
              color:
                "var(--site-muted)",
            }}
            aria-label="Close navigation menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-4 py-5"
          aria-label="Mobile navigation"
        >
          <p
            className="px-3 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{
              color:
                "var(--site-muted)",
            }}
          >
            Navigation
          </p>

          <div className="mt-3 space-y-1">
            {navigation.map(
              (item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="group flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition"
                    style={{
                      color: active
                        ? "var(--site-primary)"
                        : "var(--site-text)",

                      backgroundColor:
                        active
                          ? "color-mix(in srgb, var(--site-primary) 9%, transparent)"
                          : "transparent",
                    }}
                  >
                    {item.label}

                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                      style={{
                        color: active
                          ? "var(--site-primary)"
                          : "var(--site-muted)",
                      }}
                    />
                  </Link>
                );
              }
            )}
          </div>
        </nav>

        {/* Mobile actions */}
        <div
          className="border-t p-5"
          style={{
            borderColor:
              "var(--site-border)",
          }}
        >
          <div className="mb-3">
            <AuthButtons
              isLoggedIn={
                isLoggedIn
              }
            />
          </div>

          <Link
            href="/contact"
            onClick={() =>
              setMenuOpen(false)
            }
            className="site-secondary-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
          >
            Contact Us

            <ArrowRight size={15} />
          </Link>
        </div>
      </aside>
    </>
  );
}