import {
  CalendarDays,
  ChevronRight,
  Mail,
  MessageSquareText,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import ContactMessageCatalog from "@/components/admin/ContactMessageCatalog";

export default async function AdminContactMessagesPage() {
  // RBAC: Require permission to view contact messages.
  const admin = await requireAdminPermission("contact_messages.view");

  // Determine whether delete actions should be available.
  const canDelete = admin.permissions.includes("contact_messages.delete");

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  const todayMessages = messages.filter((message) => {
    const created = new Date(message.createdAt);
    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  }).length;

  const uniqueSenders = new Set(
    messages.map((message) => message.email.toLowerCase()),
  ).size;

  const stats = [
    {
      label: "Total Messages",
      value: messages.length,
      description: "All contact form submissions",
      icon: MessageSquareText,
      background: "from-[#F5F0FF] to-[#FBF9FF]",
      border: "border-[#E8DFF8]",
      iconBackground: "bg-[#EAE0FA]",
      iconColor: "text-[#8065B0]",
    },
    {
      label: "Received Today",
      value: todayMessages,
      description: "Messages received today",
      icon: CalendarDays,
      background: "from-[#EDF7FF] to-[#F8FCFF]",
      border: "border-[#DCEBF9]",
      iconBackground: "bg-[#DCEEFF]",
      iconColor: "text-[#568AB9]",
    },
    {
      label: "Unique Senders",
      value: uniqueSenders,
      description: "Unique email addresses",
      icon: UserRound,
      background: "from-[#EFFAF4] to-[#FAFDFB]",
      border: "border-[#DCEFE4]",
      iconBackground: "bg-[#DCF3E5]",
      iconColor: "text-[#43976A]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb and heading */}
      <section>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Contact Messages
            </h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Manage messages submitted through the CADGram contact form.
            </p>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section aria-label="Contact message statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border ${stat.border} bg-gradient-to-br ${stat.background} p-5 shadow-[0_6px_22px_rgba(39,28,59,0.035)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#77717F]">{stat.label}</p>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${stat.iconBackground} ${stat.iconColor}`}>
                  <Icon size={19} strokeWidth={1.9} />
                </div>
              </div>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#25232C]">
                {stat.value}
              </p>
              <p className="mt-3 text-[12px] text-[#85808D]">{stat.description}</p>
            </div>
          );
        })}
      </section>

      {/* Contact message inbox */}
      <ContactMessageCatalog
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          email: message.email,
          message: message.message,
          createdAt: message.createdAt.toISOString(),
        }))}
        canDelete={canDelete}
      />
    </div>
  );
}
