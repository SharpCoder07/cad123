"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import DeleteEnquiryButton from "@/components/admin/DeleteEnquiryButton";
import EnquiryStatusSelect from "@/components/admin/EnquiryStatusSelect";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  createdAt: string;

  product: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type Props = {
  enquiries: Enquiry[];
  canEdit: boolean;
  canDelete: boolean;
};

type StatusFilter = "all" | "pending" | "contacted" | "closed";

type ProductFilter = "all" | "general" | string;

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

export default function EnquiryCatalog({
  enquiries,
  canEdit,
  canDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [productFilter, setProductFilter] = useState<ProductFilter>("all");

  const [sort, setSort] = useState<SortOption>("newest");

  const products = useMemo(() => {
    const uniqueProducts = new Map<number, { id: number; name: string }>();

    enquiries.forEach((enquiry) => {
      if (enquiry.product) {
        uniqueProducts.set(enquiry.product.id, {
          id: enquiry.product.id,
          name: enquiry.product.name,
        });
      }
    });

    return Array.from(uniqueProducts.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = enquiries.filter((enquiry) => {
      const matchesSearch =
        !query ||
        enquiry.name.toLowerCase().includes(query) ||
        enquiry.email.toLowerCase().includes(query) ||
        enquiry.phone?.toLowerCase().includes(query) ||
        enquiry.message?.toLowerCase().includes(query) ||
        enquiry.product?.name.toLowerCase().includes(query);

      const normalizedStatus = enquiry.status.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      let matchesProduct = true;

      if (productFilter === "general") {
        matchesProduct = !enquiry.product;
      } else if (productFilter !== "all") {
        matchesProduct = enquiry.product?.id.toString() === productFilter;
      }

      return matchesSearch && matchesStatus && matchesProduct;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "name-asc":
          return a.name.localeCompare(b.name);

        case "name-desc":
          return b.name.localeCompare(a.name);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [enquiries, search, statusFilter, productFilter, sort]);

  useEffect(() => { setPage(1); }, [search, statusFilter, productFilter, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedEnquiries = filteredEnquiries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    productFilter !== "all" ||
    sort !== "newest";

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setProductFilter("all");
    setSort("newest");
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(39,28,59,0.035)]">
      {/* Catalog header */}
      <div className="border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#F0EBFA] text-[#8065B0]">
              <MessageSquareText size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1F2430]">Enquiry Activity</h2>
              <p className="mt-0.5 text-[13px] text-[#77808E]">Search and manage visitor enquiries and their current status.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E5DDF1] bg-[#F5F1FB] px-3 py-1.5 text-xs font-medium text-[#8065B0]">
              {filteredEnquiries.length} of {enquiries.length} enquiries
            </span>
            <button type="button" onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-[13px] font-medium transition ${showFilters ? "border-[#D9CBEF] bg-[#F0EBFA] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}>
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>
        <div className="relative mt-5">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A95A3]" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer, email, phone, product or message..."
            className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-10 text-sm text-[#24212D] outline-none transition placeholder:text-[#9A95A3] focus:border-[#AA94D0] focus:ring-4 focus:ring-[#F0EBFA]" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9A95A3] hover:text-[#24212D]"><X size={16} /></button>}
        </div>
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EAE7EF] bg-[#FBFAFD] p-4">
            <select aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 min-w-[150px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]">
              <option value="all">All statuses</option><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
            </select>
            <select aria-label="Filter product" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}
              className="h-10 min-w-[170px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]">
              <option value="all">All products</option><option value="general">General enquiries</option>
              {products.map((product) => <option key={product.id} value={product.id.toString()}>{product.name}</option>)}
            </select>
            <select aria-label="Sort enquiries" value={sort} onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-10 min-w-[150px] flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#AA94D0]">
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>
            </select>
            {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA]"><X size={15} /> Reset</button>}
          </div>
        )}
      </div>

      {filteredEnquiries.length > 0 ? (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-[#EAE7EF] bg-[#F8F6FB]">
                  <TableHeading>Customer</TableHeading>
                  <TableHeading>Product</TableHeading>
                  <TableHeading>Message</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Date</TableHeading>

                  <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EDF3]">
                {pagedEnquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="group transition hover:bg-[#FBFAFD]"
                  >
                    <td className="px-5 py-4">
                      <Customer enquiry={enquiry} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[190px] truncate text-sm font-semibold text-gray-700">
                        {enquiry.product?.name || "General enquiry"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="line-clamp-2 max-w-[360px] text-sm leading-6 text-gray-500">
                        {enquiry.message || "No message provided."}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {canEdit ? (
                        <EnquiryStatusSelect
                          enquiryId={enquiry.id}
                          status={enquiry.status}
                        />
                      ) : (
                        <span className="inline-flex rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-3 py-2 text-xs font-semibold capitalize text-[#77717F]">
                          {enquiry.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(enquiry.createdAt)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">

                        {canDelete && (
                          <DeleteEnquiryButton enquiryId={enquiry.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-[#F0EDF3] md:hidden">
            {pagedEnquiries.map((enquiry) => (
              <div key={enquiry.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Customer enquiry={enquiry} />
                  </div>

                  {canEdit ? (
                    <EnquiryStatusSelect
                      enquiryId={enquiry.id}
                      status={enquiry.status}
                    />
                  ) : (
                    <span className="inline-flex shrink-0 rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-3 py-2 text-xs font-semibold capitalize text-[#77717F]">
                      {enquiry.status}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-xl bg-[#F8F6FB] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Product
                    </p>

                    <p className="mt-1 truncate text-sm font-medium text-gray-700">
                      {enquiry.product?.name || "General enquiry"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8F6FB] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                      Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {formatDate(enquiry.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#F8F6FB] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Message
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {enquiry.message || "No message provided."}
                  </p>
                </div>

                {enquiry.phone && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={15} />
                    {enquiry.phone}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-2">

                  {canDelete && <DeleteEnquiryButton enquiryId={enquiry.id} />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EDF3] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 text-xs text-[#77808E]">
              <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredEnquiries.length)} of {filteredEnquiries.length}</span>
              <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-[#E5E2EA] bg-white px-2 text-xs text-[#44414C]">
                <option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs text-[#77808E]">Page {currentPage} of {totalPages}</span>
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button type="button" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E2EA] text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          enquiriesExist={enquiries.length > 0}
          hasFilters={hasFilters}
          onReset={resetFilters}
        />
      )}
    </section>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#918B9B]">
      {children}
    </th>
  );
}

function Customer({ enquiry }: { enquiry: Enquiry }) {
  const initial = enquiry.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-xs font-bold text-[#8065B0]">
        {initial}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#24212D]">
          {enquiry.name}
        </p>

        <p className="mt-1 max-w-[220px] truncate text-xs text-[#85808D]">
          {enquiry.email}
        </p>

        {enquiry.phone && (
          <p className="mt-1 text-xs text-[#85808D]">{enquiry.phone}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN");
}

function EmptyState({
  enquiriesExist,
  hasFilters,
  onReset,
}: {
  enquiriesExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
        {enquiriesExist ? <Search size={23} /> : <Mail size={24} />}
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {enquiriesExist ? "No matching enquiries" : "No enquiries yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {enquiriesExist
          ? "Try changing your search, status, product or sorting options."
          : "Product enquiries submitted through the website will appear here."}
      </p>

      {enquiriesExist && hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#403948]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
