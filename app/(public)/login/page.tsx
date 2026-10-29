"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();

      if (!session?.user) {
        setError("Unable to verify your session. Please try again.");
        return;
      }

      const role = session.user.role?.toUpperCase();

      let dashboardUrl = "/";
      let adminPermissions: string[] = [];

      switch (role) {
        case "ADMIN": {
          const response = await fetch("/api/admin/landing-page", {
            cache: "no-store",
          });

          if (!response.ok) {
            setError("Unable to load your admin permissions.");
            return;
          }

          const data: {
            success: boolean;
            redirectUrl: string | null;
            permissions: string[];
          } = await response.json();

          if (!data.success || !data.redirectUrl) {
            setError(
              "Your admin account has no accessible modules. Contact the Super Admin.",
            );
            return;
          }

          dashboardUrl = data.redirectUrl;
          adminPermissions = data.permissions;
          break;
        }

        case "VENDOR":
          dashboardUrl = "/vendor";
          break;

        case "USER":
          dashboardUrl = "/";
          break;

        default:
          setError("Your account role is not recognized.");
          return;
      }

      // Validate callback URL
      const isSafeCallback =
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//") &&
        !callbackUrl.startsWith("/\\");

      const callbackPath = callbackUrl.split(/[?#]/)[0];

      const isAllowedCallback =
        role === "ADMIN"
          ? callbackPath === "/admin" || callbackPath.startsWith("/admin/")
          : role === "VENDOR"
            ? callbackPath === "/vendor" || callbackPath.startsWith("/vendor/")
            : callbackPath !== "/admin" &&
              !callbackPath.startsWith("/admin/") &&
              callbackPath !== "/vendor" &&
              !callbackPath.startsWith("/vendor/");

      let canAccessCallback = isSafeCallback && isAllowedCallback;

      if (role === "ADMIN" && canAccessCallback) {
        const permissionRoutes = [
          { path: "/admin/products", permission: "products.view" },
          { path: "/admin/features", permission: "features.view" },
          {
            path: "/admin/specifications",
            permission: "specifications.view",
          },
          { path: "/admin/brands", permission: "brands.view" },
          { path: "/admin/categories", permission: "categories.view" },
          { path: "/admin/reviews", permission: "reviews.view" },
          { path: "/admin/questions", permission: "questions.view" },
          { path: "/admin/enquiries", permission: "enquiries.view" },
          {
            path: "/admin/contact-messages",
            permission: "contact_messages.view",
          },
          { path: "/admin/blog-posts", permission: "blog_posts.view" },
          { path: "/admin/users", permission: "users.view" },
          { path: "/admin/vendors", permission: "vendors.view" },
          {
            path: "/admin/website-design",
            permission: "website_design.view",
          },
          { path: "/admin/roles", permission: "roles.view" },
        ];

        if (callbackPath === "/admin") {
          canAccessCallback = adminPermissions.includes("dashboard.view");
        } else {
          const matchedRoute = permissionRoutes.find(
            (route) =>
              callbackPath === route.path ||
              callbackPath.startsWith(`${route.path}/`),
          );

          canAccessCallback =
            !!matchedRoute &&
            callbackPath === matchedRoute.path &&
            adminPermissions.includes(matchedRoute.permission);
        }
      }

      const redirectUrl = canAccessCallback ? callbackUrl : dashboardUrl;

      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--site-surface)" }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-stretch px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="login-page-shell grid w-full overflow-hidden rounded-[32px] border lg:grid-cols-[0.9fr_1.1fr]">
          {/* =================================================
              BRAND PANEL
          ================================================== */}
          <section className="login-brand-panel relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div
              aria-hidden="true"
              className="login-glow-primary pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full blur-[100px]"
            />

            <div
              aria-hidden="true"
              className="login-glow-accent pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-[110px]"
            />

            <div
              aria-hidden="true"
              className="login-grid pointer-events-none absolute inset-0 opacity-40"
            />

            <div className="relative z-10">
              <div className="login-brand-badge inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                <Sparkles size={14} />

                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                  CADGram
                </span>
              </div>

              <h1 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Your software research,
                <span className="block" style={{ color: "var(--site-accent)" }}>
                  all in one place.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                Sign in to continue exploring software, comparing solutions and
                accessing your CADGram account.
              </p>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="login-benefit flex items-center gap-3 rounded-2xl border p-4">
                <div className="login-benefit-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Search size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Discover software
                  </p>

                  <p className="mt-0.5 text-xs text-white/45">
                    Explore products, brands and categories.
                  </p>
                </div>
              </div>

              <div className="login-benefit flex items-center gap-3 rounded-2xl border p-4">
                <div className="login-benefit-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Access your account
                  </p>

                  <p className="mt-0.5 text-xs text-white/45">
                    Sign in securely with your CADGram credentials.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              LOGIN FORM
          ================================================== */}
          <section className="login-form-panel flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-md">
              {/* Mobile icon */}
              <div className="login-mobile-icon mb-7 flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden">
                <LockKeyhole size={21} />
              </div>

              <p className="site-primary-text text-xs font-bold uppercase tracking-[0.15em]">
                Welcome Back
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: "var(--site-text)" }}
              >
                Login to CADGram
              </h2>

              <p
                className="mt-3 text-sm leading-6"
                style={{ color: "var(--site-muted)" }}
              >
                Enter your account details to continue.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="login-form-label mb-2 block text-sm font-semibold"
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

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="login-form-control w-full rounded-xl border px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="login-form-label mb-2 block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className="login-form-control w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="login-password-toggle absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
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
                      <span className="login-spinner h-4 w-4 rounded-full border-2" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      Login
                    </>
                  )}
                </button>
              </form>

              {/* Register */}
              <div
                className="mt-7 border-t pt-6 text-center"
                style={{ borderColor: "var(--site-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--site-muted)" }}>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="login-register-link inline-flex cursor-pointer items-center gap-1 font-semibold transition"
                  >
                    Create account
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
