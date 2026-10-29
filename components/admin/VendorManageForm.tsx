"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Package,
  Save,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

type VendorStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

type VendorUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type VendorProduct = {
  id: number;
  name: string;
  slug: string;
  status: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED";
  createdAt: string;

  brand: {
    id: number;
    name: string;
  };

  category: {
    id: number;
    name: string;
  };

  _count: {
    enquiries: number;
    questions: number;
    reviews: number;
  };
};

type Vendor = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  description: string | null;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;

  users: VendorUser[];
  products: VendorProduct[];

  stats: {
    users: number;
    products: number;
    enquiries: number;
    questions: number;
    reviews: number;
  };
};

const statusClasses: Record<VendorStatus, string> = {
  ACTIVE: "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",

  PENDING: "border-[#F5E5C8] bg-[#FFFAED] text-[#B67D25]",

  SUSPENDED: "border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]",
};

type VendorManageFormProps = {
  canEditProducts: boolean;
};

export default function VendorManageForm({
  canEditProducts,
}: VendorManageFormProps) {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<VendorStatus>("PENDING");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadVendor() {
      try {
        setLoading(true);

        const response = await fetch(`/api/admin/vendors/${id}`);

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to load vendor.");
          return;
        }

        const currentVendor: Vendor = data.vendor;

        setVendor(currentVendor);

        setName(currentVendor.name || "");
        setSlug(currentVendor.slug || "");
        setEmail(currentVendor.email || "");
        setPhone(currentVendor.phone || "");
        setWebsite(currentVendor.website || "");
        setLogo(currentVendor.logo || "");
        setDescription(currentVendor.description || "");
        setStatus(currentVendor.status);
      } catch (error) {
        console.error("Failed to load vendor:", error);

        toast.error("Failed to load vendor.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadVendor();
    }
  }, [id]);

  const totalProductLeads = useMemo(() => {
    return (
      vendor?.products.reduce(
        (total, product) => total + product._count.enquiries,
        0,
      ) ?? 0
    );
  }, [vendor]);

  async function handleUpdate() {
    if (!name.trim()) {
      toast.error("Vendor name is required.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Vendor slug is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/vendors/${id}`, {
        method: "PUT",

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update vendor.");
        return;
      }

      toast.success("Vendor updated successfully.");

      setVendor((current) =>
        current
          ? {
              ...current,
              ...data.vendor,
            }
          : current,
      );

      router.refresh();
    } catch (error) {
      console.error("Update vendor error:", error);

      toast.error("Something went wrong while updating the vendor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <VendorSkeleton />;
  }

  if (!vendor) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-12 text-center">
          <Building2 size={28} className="mx-auto text-[#9A94A3]" />

          <h1 className="mt-4 text-xl font-bold text-[#1F2430]">
            Vendor not found
          </h1>

          <Link
            href="/admin/vendors"
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} />
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Vendor Users",
      value: vendor.stats.users,
      icon: Users,
    },
    {
      label: "Products",
      value: vendor.stats.products,
      icon: Package,
    },
    {
      label: "Leads",
      value: vendor.stats.enquiries,
      icon: Mail,
    },
    {
      label: "Questions",
      value: vendor.stats.questions,
      icon: CircleHelp,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-[#77808E]">
            <Link
              href="/admin/vendors"
              className="cursor-pointer transition hover:text-[#1F2430]"
            >
              Vendors
            </Link>

            <ChevronRight size={15} />

            <span className="text-[#44414C]">{vendor.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <VendorLogo name={vendor.name} logo={vendor.logo} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                  {vendor.name}
                </h1>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusClasses[vendor.status]
                  }`}
                >
                  {formatStatus(vendor.status)}
                </span>
              </div>

              <p className="mt-1 text-sm text-[#77808E]">
                Manage vendor information, access, users and catalog activity.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/vendors"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EAE7EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#44414C] shadow-sm transition hover:bg-[#FAF9FC]"
        >
          <ArrowLeft size={16} />
          Back to Vendors
        </Link>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`min-h-[146px] rounded-[21px] border border-[#EAE7EF] bg-gradient-to-br p-5 ${["from-[#F4EFFF] to-[#FCFAFF]", "from-[#EAF8F2] to-[#FAFFFC]", "from-[#FFF3E9] to-[#FFFCF8]", "from-[#EDF3FF] to-[#FAFCFF]"][stats.findIndex((stat) => stat.label === item.label)]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A94A3]">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-[#1F2430]">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Company */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              title="Company Information"
              description="Manage the vendor's company identity and contact details."
            />

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field
                label="Company Name"
                required
                value={name}
                onChange={setName}
                disabled={saving}
              />

              <Field
                label="Slug"
                required
                value={slug}
                onChange={setSlug}
                disabled={saving}
              />

              <Field
                label="Company Email"
                type="email"
                value={email}
                onChange={setEmail}
                disabled={saving}
              />

              <Field
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                disabled={saving}
              />

              <div className="md:col-span-2">
                <Field
                  label="Official Website"
                  type="url"
                  value={website}
                  onChange={setWebsite}
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#44414C]">
                  Description
                </label>

                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={saving}
                  className="mt-2 w-full resize-y rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm leading-6 text-[#1F2430] outline-none transition focus:border-[#9C82CC] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
                />
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Logo URL"
                  type="url"
                  value={logo}
                  onChange={setLogo}
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {/* Users */}
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              title="Vendor Users"
              description="Accounts currently linked to this vendor."
            />

            {vendor.users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No vendor users"
                description="There are currently no users assigned to this vendor."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#EAE7EF] bg-[#FAF9FC]">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {vendor.users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FAF9FC]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-bold text-[#8065B0]">{(user.name || user.email).charAt(0).toUpperCase()}</div><div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1F2430]">
                            {user.name || "Unnamed User"}
                          </p>

                          <p className="mt-1 text-xs text-[#77808E]">
                            {user.email}
                          </p></div></div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full border border-[#EAE7EF] bg-[#FAF9FC] px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {user.role}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[#77808E]">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Products */}
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <SectionHeader
              title="Vendor Products"
              description="Products currently owned by this vendor."
            />

            {vendor.products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No vendor products"
                description="No products are currently assigned to this vendor."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {vendor.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-[#FAF9FC] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#1F2430]">
                          {product.name}
                        </p>

                        <ProductStatusBadge status={product.status} />
                      </div>

                      <p className="mt-1 text-xs text-[#77808E]">
                        {product.brand.name}
                        {" · "}
                        {product.category.name}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#77808E]">
                        <span>{product._count.enquiries} leads</span>

                        <span>{product._count.questions} questions</span>

                        <span>{product._count.reviews} reviews</span>
                      </div>
                    </div>

                    {canEditProducts && (
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-[#44414C] transition hover:bg-slate-100 md:self-auto"
                      >
                        Manage
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Access */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#1F2430]">
                  Vendor Access
                </h3>

                <p className="text-xs text-[#77808E]">
                  Dashboard access status
                </p>
              </div>
            </div>

            <label className="mt-5 block text-sm font-semibold text-[#44414C]">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VendorStatus)
              }
              disabled={saving}
              className="mt-2 w-full rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition focus:border-[#9C82CC] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed"
            >
              <option value="PENDING">Pending</option>

              <option value="ACTIVE">Active</option>

              <option value="SUSPENDED">Suspended</option>
            </select>

            <div
              className={`mt-4 rounded-xl border p-4 ${statusClasses[status]}`}
            >
              <p className="text-sm font-semibold">{formatStatus(status)}</p>

              <p className="mt-1 text-xs leading-5 opacity-80">
                {status === "ACTIVE" &&
                  "Vendor is approved for dashboard access."}

                {status === "PENDING" && "Vendor is awaiting approval."}

                {status === "SUSPENDED" &&
                  "Vendor dashboard access should be blocked."}
              </p>
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1F2430]">Engagement</h3>

            <div className="mt-4 space-y-4">
              <MetricRow
                icon={Mail}
                label="Leads"
                value={vendor.stats.enquiries}
              />

              <MetricRow
                icon={CircleHelp}
                label="Questions"
                value={vendor.stats.questions}
              />

              <MetricRow
                icon={Star}
                label="Reviews"
                value={vendor.stats.reviews}
              />

              <MetricRow
                icon={MessageSquareText}
                label="Product leads"
                value={totalProductLeads}
              />
            </div>
          </section>

          {/* Logo */}
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1F2430]">
              Vendor Preview
            </h3>

            <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-[#EAE7EF] bg-[#FAF9FC] p-5">
              {logo.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={name}
                  className="max-h-20 max-w-[190px] object-contain"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EBFA] text-xl font-bold text-[#8065B0]">
                  {name.trim().charAt(0).toUpperCase() || "V"}
                </div>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}

function VendorLogo({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-sm">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <Building2 size={22} className="text-[#8065B0]" />
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#F1EEF5] px-6 py-5">
      <h2 className="text-base font-semibold text-[#1F2430]">{title}</h2>

      <p className="mt-1 text-sm text-[#77808E]">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#44414C]">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-[#EAE7EF] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition focus:border-[#9C82CC] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#FAF9FC]"
      />
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#77808E]">
      {children}
    </th>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-10 text-center">
      <Icon size={24} className="mx-auto text-[#9A94A3]" />

      <p className="mt-3 text-sm font-semibold text-[#1F2430]">{title}</p>

      <p className="mt-1 text-sm text-[#77808E]">{description}</p>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-[#77808E]">
        <Icon size={15} />
        {label}
      </div>

      <span className="text-sm font-semibold text-[#1F2430]">{value}</span>
    </div>
  );
}

function ProductStatusBadge({ status }: { status: VendorProduct["status"] }) {
  const styles = {
    PUBLISHED: "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",

    DRAFT: "border-[#EAE7EF] bg-[#FAF9FC] text-slate-600",

    SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",

    CHANGES_REQUESTED: "border-[#F5E5C8] bg-[#FFFAED] text-[#B67D25]",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        styles[status]
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function VendorSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-40 rounded bg-slate-200" />

        <div className="mt-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-200" />

          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-slate-200" />
            <div className="h-4 w-72 rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-[20px] border border-[#EAE7EF] bg-white"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="h-96 rounded-[20px] border border-[#EAE7EF] bg-white" />
          <div className="h-72 rounded-[20px] border border-[#EAE7EF] bg-white" />
          <div className="h-72 rounded-[20px] border border-[#EAE7EF] bg-white" />
        </div>

        <div className="space-y-6">
          <div className="h-64 rounded-[20px] border border-[#EAE7EF] bg-white" />
          <div className="h-52 rounded-[20px] border border-[#EAE7EF] bg-white" />
        </div>
      </div>
    </div>
  );
}
