"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type VendorStatus = "PENDING" | "ACTIVE";

type NewVendorFormProps = {
  canViewVendors: boolean;
  canEditVendors: boolean;
};

export default function NewVendorForm({
  canViewVendors,
  canEditVendors,
}: NewVendorFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<VendorStatus>("PENDING");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Vendor company name is required.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Vendor slug is required.");
      return;
    }

    if (!userName.trim()) {
      toast.error("Vendor login name is required.");
      return;
    }

    if (!userEmail.trim()) {
      toast.error("Vendor login email is required.");
      return;
    }

    if (!password) {
      toast.error("Initial password is required.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          email,
          phone,
          website,
          logo,
          description,
          status,
          userName,
          userEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to create vendor.");
        return;
      }

      toast.success("Vendor created successfully.");

      setTimeout(() => {
        if (canEditVendors) {
          router.push(`/admin/vendors/${data.vendor.id}`);
        } else if (canViewVendors) {
          router.push("/admin/vendors");
        } else {
          router.push("/admin");
        }

        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Create vendor error:", error);

      toast.error("Something went wrong while creating the vendor.");
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-sm text-[#252632] outline-none transition placeholder:text-[#9693A2] focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

  const labelClass = "text-[13px] font-medium text-[#44414C]";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#9294A0]">
            <Link
              href="/admin/vendors"
              className="cursor-pointer hover:text-gray-900"
            >
              Vendors
            </Link>

            <ChevronRight size={15} />

            <span className="text-[#44414C]">Add Vendor</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <Building2 size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Vendor
              </h1>

              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a vendor company and its first dashboard login.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/vendors"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Vendors
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {/* Company */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-6 py-5">
              <h2 className="text-[17px] font-semibold text-[#252632]">
                Company Information
              </h2>

              <p className="mt-1 text-[13px] text-[#77808E]">
                Basic information about the vendor company.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Company Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Autodesk India"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Slug
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="autodesk-india"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Company Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@example.com"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Official Website</label>

                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Tell us about the vendor company..."
                  disabled={creating}
                  className={`${inputClass} resize-y leading-6`}
                />
              </div>
            </div>
          </section>

          {/* Logo */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-6 py-5">
              <h2 className="text-[17px] font-semibold text-[#252632]">
                Vendor Media
              </h2>

              <p className="mt-1 text-[13px] text-[#77808E]">
                Add the vendor company logo.
              </p>
            </div>

            <div className="p-6">
              <label className={labelClass}>Logo URL</label>

              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={creating}
                className={inputClass}
              />

              {logo.trim() && (
                <div className="mt-4 rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9693A2]">
                    Preview
                  </p>

                  <div className="flex h-24 items-center justify-center rounded-xl border border-[#E5E2EA] bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt={name || "Vendor logo preview"}
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Login Account */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <UserRound size={18} />
                </div>

                <div>
                  <h2 className="text-[17px] font-semibold text-[#252632]">
                    Vendor Login Account
                  </h2>

                  <p className="mt-1 text-[13px] text-[#77808E]">
                    Create the first user who will access this vendor&apos;s
                    dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  User Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Login Email
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Initial Password
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={creating}
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={creating}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute bottom-0 right-0 flex h-[46px] w-12 cursor-pointer items-center justify-center text-[#9693A2] transition hover:text-[#44414C] disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-[#9693A2]">
                  The vendor can use this email and password to sign in once
                  their account is active.
                </p>
              </div>
            </div>
          </section>

          {/* Access */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-6 py-5">
              <h2 className="text-[17px] font-semibold text-[#252632]">
                Vendor Access
              </h2>

              <p className="mt-1 text-[13px] text-[#77808E]">
                Decide whether this vendor can access the vendor panel
                immediately.
              </p>
            </div>

            <div className="p-6">
              <label className={labelClass}>Account Status</label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                disabled={creating}
                className={inputClass}
              >
                <option value="PENDING">Pending</option>

                <option value="ACTIVE">Active</option>
              </select>

              <div
                className={`mt-4 rounded-xl border p-4 ${
                  status === "ACTIVE"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={18}
                    className={
                      status === "ACTIVE"
                        ? "mt-0.5 shrink-0 text-emerald-600"
                        : "mt-0.5 shrink-0 text-amber-600"
                    }
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        status === "ACTIVE"
                          ? "text-emerald-800"
                          : "text-amber-800"
                      }`}
                    >
                      {status === "ACTIVE"
                        ? "Vendor access enabled"
                        : "Approval required"}
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        status === "ACTIVE"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {status === "ACTIVE"
                        ? "This vendor will be eligible to access the vendor panel."
                        : "The account will be created, but vendor-panel access should remain blocked until activated."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/admin/vendors"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] px-5 py-3 text-[13px] font-medium text-[#44414C] transition hover:bg-[#FAF9FC]"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={creating}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Vendor
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Building2 size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#252632]">
                  Vendor Setup
                </h3>

                <p className="text-xs text-[#848797]">
                  Required account information
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <SetupRow label="Company" complete={Boolean(name.trim())} />

              <SetupRow label="Slug" complete={Boolean(slug.trim())} />

              <SetupRow
                label="Login user"
                complete={Boolean(userName.trim())}
              />

              <SetupRow
                label="Login email"
                complete={Boolean(userEmail.trim())}
              />

              <SetupRow label="Password" complete={password.length >= 6} />
            </div>
          </div>

          <div className="rounded-[20px] border border-[#EAE7EF] bg-[#FBFAFD] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <KeyRound size={16} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#252632]">
                  Vendor credentials
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The login account will automatically receive the VENDOR role
                  and will be linked only to this company.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SetupRow({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#77808E]">{label}</span>

      <span
        className={`text-xs font-semibold ${
          complete ? "text-emerald-600" : "text-[#9693A2]"
        }`}
      >
        {complete ? "Complete" : "Required"}
      </span>
    </div>
  );
}
