"use client";

import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  ImageIcon,
  Mail,
  Phone,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

type Vendor = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  website: string;
  logo: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  website: "",
  logo: "",
  description: "",
};

export default function VendorProfilePage() {
  const [vendor, setVendor] =
    useState<Vendor | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [originalForm, setOriginalForm] =
    useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          "/api/vendor/profile",
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load company profile.",
          );
          return;
        }

        const vendorData: Vendor = data.vendor;

        const nextForm: FormState = {
          name: vendorData.name || "",
          email: vendorData.email || "",
          phone: vendorData.phone || "",
          website: vendorData.website || "",
          logo: vendorData.logo || "",
          description:
            vendorData.description || "",
        };

        setVendor(vendorData);
        setForm(nextForm);
        setOriginalForm(nextForm);
      } catch (error) {
        console.error(
          "Load vendor profile error:",
          error,
        );

        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const hasChanges =
    JSON.stringify(form) !==
    JSON.stringify(originalForm);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Company name is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/vendor/profile",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            website: form.website.trim(),
            logo: form.logo.trim(),
            description:
              form.description.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to update company profile.",
        );
        return;
      }

      const vendorData: Vendor = data.vendor;

      const nextForm: FormState = {
        name: vendorData.name || "",
        email: vendorData.email || "",
        phone: vendorData.phone || "",
        website: vendorData.website || "",
        logo: vendorData.logo || "",
        description:
          vendorData.description || "",
      };

      setVendor(vendorData);
      setForm(nextForm);
      setOriginalForm(nextForm);

      toast.success(
        "Company profile updated successfully.",
      );
    } catch (error) {
      console.error(
        "Update vendor profile error:",
        error,
      );

      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setForm(originalForm);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 max-w-xl animate-pulse rounded-2xl bg-gray-200" />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="h-[600px] animate-pulse rounded-2xl bg-gray-200" />

          <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Company profile unavailable
        </h2>

        <p className="mt-1 text-sm text-red-600">
          We could not load your vendor
          information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-sm">
            <Building2 size={21} />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Company Profile
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the company information
              associated with your vendor account.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
        >
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-950">
              Company Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Keep your public company
              information up to date.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Name */}
            <Field
              label="Company Name"
              icon={<Building2 size={15} />}
              required
            >
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                disabled={saving}
                className={inputClass}
              />
            </Field>

            {/* Slug */}
            <Field
              label="Vendor Slug"
              icon={<ShieldCheck size={15} />}
            >
              <input
                type="text"
                value={vendor.slug}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-500`}
              />

              <p className="mt-2 text-xs text-gray-400">
                Vendor slugs are managed by
                CADGram administrators.
              </p>
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Email"
                icon={<Mail size={15} />}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="company@example.com"
                  disabled={saving}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Phone"
                icon={<Phone size={15} />}
              >
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="+91 98765 43210"
                  disabled={saving}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Website"
              icon={<Globe2 size={15} />}
            >
              <input
                type="url"
                value={form.website}
                onChange={(event) =>
                  updateField(
                    "website",
                    event.target.value,
                  )
                }
                placeholder="https://example.com"
                disabled={saving}
                className={inputClass}
              />
            </Field>

            <Field
              label="Logo URL"
              icon={<ImageIcon size={15} />}
            >
              <input
                type="url"
                value={form.logo}
                onChange={(event) =>
                  updateField(
                    "logo",
                    event.target.value,
                  )
                }
                placeholder="https://example.com/logo.png"
                disabled={saving}
                className={inputClass}
              />
            </Field>

            <Field
              label="Company Description"
              icon={
                <Building2 size={15} />
              }
            >
              <textarea
                rows={7}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Tell customers about your company..."
                disabled={saving}
                className={`${inputClass} resize-y leading-6`}
              />

              <div className="mt-2 flex justify-end">
                <span className="text-xs text-gray-400">
                  {form.description.length}{" "}
                  characters
                </span>
              </div>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={discardChanges}
              disabled={
                saving || !hasChanges
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard Changes
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !hasChanges ||
                !form.name.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Logo preview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              Company Preview
            </p>

            <div className="mt-5 flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-5">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt={`${form.name || "Company"} logo`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon
                    size={28}
                    className="mx-auto"
                  />

                  <p className="mt-2 text-xs">
                    No logo added
                  </p>
                </div>
              )}
            </div>

            <h3 className="mt-4 font-semibold text-gray-950">
              {form.name || "Company Name"}
            </h3>

            {form.website && (
              <a
                href={form.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-gray-950"
              >
                Visit Website
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Account status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              Vendor Account
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">
                Status
              </span>

              <StatusBadge
                status={vendor.status}
              />
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-gray-400"
                />

                <p className="text-xs leading-5 text-gray-500">
                  Account status and vendor
                  identity are managed by CADGram
                  administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Saved state */}
          {!hasChanges && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Profile up to date
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Your latest company information
                  has been saved.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

function Field({
  label,
  icon,
  required = false,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-gray-400">
          {icon}
        </span>

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  if (normalized === "ACTIVE") {
    return (
      <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
        Active
      </span>
    );
  }

  if (normalized === "PENDING") {
    return (
      <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
        Pending
      </span>
    );
  }

  if (normalized === "SUSPENDED") {
    return (
      <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
        Suspended
      </span>
    );
  }

  return (
    <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
      {status}
    </span>
  );
}