"use client";

import {
  ExternalLink,
  Mail,
  MessageSquareText,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type Product = {
  id: number;
  name: string;
  slug: string;
};

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  product: Product | null;
};

type Props = {
  enquiries: Enquiry[];
};

type StatusFilter = "all" | "pending" | "contacted" | "closed";

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

export default function VendorLeadCatalog({
  enquiries: initialEnquiries,
}: Props) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      if (
        statusFilter !== "all" &&
        enquiry.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        enquiry.name,
        enquiry.email,
        enquiry.phone ?? "",
        enquiry.message ?? "",
        enquiry.product?.name ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [enquiries, search, statusFilter]);

  async function updateStatus(enquiryId: number, status: string) {
    const existing = enquiries.find((enquiry) => enquiry.id === enquiryId);

    if (!existing || existing.status.toLowerCase() === status) {
      return;
    }

    try {
      setUpdatingId(enquiryId);

      const response = await fetch(`/api/vendor/leads/${enquiryId}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update lead.");
        return;
      }

      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === enquiryId
            ? {
                ...enquiry,
                status: data.enquiry.status,
              }
            : enquiry,
        ),
      );

      toast.success("Lead status updated.");
    } catch (error) {
      console.error("Update vendor lead error:", error);

      toast.error("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      {/* Toolbar */}
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-950">Product Leads</h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredEnquiries.length}{" "}
              {filteredEnquiries.length === 1 ? "lead" : "leads"} shown
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
            >
              <option value="all">All statuses</option>

              <option value="pending">Pending</option>

              <option value="contacted">Contacted</option>

              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredEnquiries.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <MessageSquareText size={24} />
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            {enquiries.length === 0 ? "No leads yet" : "No matching leads"}
          </h3>

          <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
            {enquiries.length === 0
              ? "Customer enquiries for your products will appear here."
              : "Try changing your search or status filter."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredEnquiries.map((enquiry) => (
            <article
              key={enquiry.id}
              className="p-5 transition hover:bg-gray-50/60 sm:p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-950">
                      {enquiry.name}
                    </h3>

                    <StatusBadge status={enquiry.status} />

                    {enquiry.product && (
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                        {enquiry.product.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                    <a
                      href={`mailto:${enquiry.email}`}
                      className="inline-flex items-center gap-1.5 transition hover:text-gray-900"
                    >
                      <Mail size={14} />
                      {enquiry.email}
                    </a>

                    {enquiry.phone && (
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="inline-flex items-center gap-1.5 transition hover:text-gray-900"
                      >
                        <Phone size={14} />

                        {enquiry.phone}
                      </a>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {enquiry.message || "No message provided."}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span>
                      Received{" "}
                      {new Date(enquiry.createdAt).toLocaleDateString("en-IN")}
                    </span>

                    {enquiry.product && (
                      <Link
                        href={`/products/${enquiry.product.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-gray-500 transition hover:text-gray-950"
                      >
                        View Product
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-full shrink-0 xl:w-48">
                  <label
                    htmlFor={`status-${enquiry.id}`}
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-400"
                  >
                    Lead Status
                  </label>

                  <select
                    id={`status-${enquiry.id}`}
                    value={enquiry.status.toLowerCase()}
                    disabled={updatingId === enquiry.id}
                    onChange={(event) =>
                      updateStatus(enquiry.id, event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return (
      <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
        Pending
      </span>
    );
  }

  if (normalized === "contacted") {
    return (
      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
        Contacted
      </span>
    );
  }

  if (normalized === "closed") {
    return (
      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
        Closed
      </span>
    );
  }

  return (
    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
      {status}
    </span>
  );
}
