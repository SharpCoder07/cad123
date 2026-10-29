import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import VendorLeadCatalog from "@/components/vendor/VendorLeadCatalog";

export default async function VendorLeadsPage() {
  const { vendorId } = await requireVendor();

  const enquiries = await prisma.enquiry.findMany({
    where: {
      product: {
        vendorId,
      },
    },

    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingCount = enquiries.filter(
    (enquiry) => enquiry.status.toLowerCase() === "pending",
  ).length;

  const contactedCount = enquiries.filter(
    (enquiry) => enquiry.status.toLowerCase() === "contacted",
  ).length;

  const closedCount = enquiries.filter(
    (enquiry) => enquiry.status.toLowerCase() === "closed",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
          <span>Vendor</span>

          <ChevronRight size={15} />

          <span className="text-gray-600">Engagement</span>

          <ChevronRight size={15} />

          <span className="text-gray-900">Leads</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-sm">
            <Mail size={21} />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Leads
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage enquiries submitted for your products.
            </p>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Leads"
          value={enquiries.length}
          description="All product enquiries"
          icon={<MessageSquareText size={18} />}
          iconClass="bg-gray-100 text-gray-700"
        />

        <SummaryCard
          label="Pending"
          value={pendingCount}
          description="Awaiting follow-up"
          icon={<Clock3 size={18} />}
          iconClass="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Contacted"
          value={contactedCount}
          description="Leads already contacted"
          icon={<CheckCircle2 size={18} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          label="Closed"
          value={closedCount}
          description="Completed leads"
          icon={<XCircle size={18} />}
          iconClass="bg-gray-100 text-gray-600"
        />
      </section>

      {/* Leads */}
      <VendorLeadCatalog
        enquiries={enquiries.map((enquiry) => ({
          id: enquiry.id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          message: enquiry.message,
          status: enquiry.status,
          createdAt: enquiry.createdAt.toISOString(),

          product: enquiry.product
            ? {
                id: enquiry.product.id,
                name: enquiry.product.name,
                slug: enquiry.product.slug,
              }
            : null,
        }))}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}
