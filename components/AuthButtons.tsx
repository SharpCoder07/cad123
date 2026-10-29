"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

type AuthButtonsProps = {
  isLoggedIn: boolean;
};

export default function AuthButtons({
  isLoggedIn,
}: AuthButtonsProps) {
  const sharedClassName =
    "inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition hover:opacity-75";

  const sharedStyle = {
    color: "var(--site-text)",
  };

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() =>
          signOut({
            callbackUrl: "/",
          })
        }
        className={sharedClassName}
        style={sharedStyle}
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className={sharedClassName}
      style={sharedStyle}
    >
      Login
    </Link>
  );
}