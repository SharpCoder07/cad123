"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    if (error) {
      setError("");
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-stretch px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="register-page-shell grid w-full overflow-hidden rounded-[32px] border lg:grid-cols-[0.9fr_1.1fr]">
          {/* =================================================
              BRAND PANEL
          ================================================== */}
          <section className="register-brand-panel relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div
              aria-hidden="true"
              className="register-glow-primary pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full blur-[100px]"
            />

            <div
              aria-hidden="true"
              className="register-glow-accent pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-[110px]"
            />

            <div
              aria-hidden="true"
              className="register-grid pointer-events-none absolute inset-0 opacity-40"
            />

            <div className="relative z-10">
              <div className="register-brand-badge inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                <Sparkles size={14} />

                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                  CADGram
                </span>
              </div>

              <h1 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Find software that
                <span
                  className="block"
                  style={{ color: "var(--site-accent)" }}
                >
                  fits your needs.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                Create your CADGram account and explore software products,
                brands, categories and comparisons in one place.
              </p>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="register-benefit flex items-center gap-3 rounded-2xl border p-4">
                <div className="register-benefit-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Search size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Explore software
                  </p>

                  <p className="mt-0.5 text-xs text-white/45">
                    Discover products across brands and categories.
                  </p>
                </div>
              </div>

              <div className="register-benefit flex items-center gap-3 rounded-2xl border p-4">
                <div className="register-benefit-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Create your account
                  </p>

                  <p className="mt-0.5 text-xs text-white/45">
                    Get started with your CADGram account.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              REGISTER FORM
          ================================================== */}
          <section className="register-form-panel flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-md">
              <div className="register-mobile-icon mb-7 flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden">
                <UserPlus size={21} />
              </div>

              <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                Get Started
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: "var(--site-text)" }}
              >
                Create Account
              </h2>

              <p
                className="mt-3 text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                Enter your details to create your CADGram account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="register-form-label mb-2 block text-sm font-semibold"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearError();
                    }}
                    placeholder="Enter your name"
                    required
                    disabled={isLoading}
                    className="register-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="register-form-label mb-2 block text-sm font-semibold"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError();
                    }}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="register-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="register-form-label mb-2 block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearError();
                      }}
                      placeholder="Create a password"
                      minLength={6}
                      required
                      disabled={isLoading}
                      className="register-form-control w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="register-password-toggle absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--site-muted)" }}
                  >
                    Use at least 6 characters.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="site-primary-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="register-spinner h-4 w-4 rounded-full border-2" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Login */}
              <div
                className="mt-7 border-t pt-6 text-center"
                style={{ borderColor: "var(--site-border)" }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--site-muted)" }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="register-login-link inline-flex cursor-pointer items-center gap-1 font-semibold transition"
                  >
                    Login
                    <ArrowRight size={13} />
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}