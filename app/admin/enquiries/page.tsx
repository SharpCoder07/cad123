import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  MessageSquareText,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import EnquiryCatalog from "@/components/admin/EnquiryCatalog";

export default async function AdminEnquiriesPage() {
  // RBAC: Only admins with enquiries.view can access this page.
  const admin = await requireAdminPermission("enquiries.view");

  const canEdit = admin.permissions.includes("enquiries.edit");
  const canDelete = admin.permissions.includes("enquiries.delete");

  const enquiries = await prisma.enquiry.findMany({
    include: {
      product: true,
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

  const stats = [
    {
      label: "Total Enquiries",
      value: enquiries.length,
      description: "All submitted enquiries",
      icon: MessageSquareText,
      className:
        "border-[#E9E0FA] bg-gradient-to-br from-[#F4EEFF] to-[#FBF9FF]",
      iconClassName: "bg-[#E9DDF9] text-[#8065B0]",
    },
    {
      label: "Pending",
      value: pendingCount,
      description: "Awaiting follow-up",
      icon: Clock3,
      className:
        "border-[#F6E6C7] bg-gradient-to-br from-[#FFF4DD] to-[#FFFCF5]",
      iconClassName: "bg-[#FCE8BB] text-[#B47D24]",
    },
    {
      label: "Contacted",
      value: contactedCount,
      description: "Enquiries already contacted",
      icon: CheckCircle2,
      className:
        "border-[#DCEAFB] bg-gradient-to-br from-[#EAF3FF] to-[#FAFCFF]",
      iconClassName: "bg-[#D8E8FC] text-[#477AB8]",
    },
    {
      label: "Closed",
      value: closedCount,
      description: "Completed enquiries",
      icon: XCircle,
      className:
        "border-[#D9EFE3] bg-gradient-to-br from-[#EAF9F0] to-[#FAFFFC]",
      iconClassName: "bg-[#D6F0E1] text-[#398C63]",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Enquiries
            </h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Manage product enquiries submitted by visitors.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Enquiry summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border p-5 shadow-[0_6px_22px_rgba(39,28,59,0.035)] ${stat.className}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#625C6B]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconClassName}`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#26222D]">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-[#827C89]">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <EnquiryCatalog
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
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
