import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileClock,
  LayoutGrid,
  MessageSquareText,
  Package,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

import { requireVendor } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const statusStyles: Record<string, string> = {
  PUBLISHED: "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",
  DRAFT: "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
  SUBMITTED: "border border-[#F3E4C5] bg-[#FFF8E9] text-[#AA792C]",
  CHANGES_REQUESTED: "border border-[#F5DFC9] bg-[#FFF4E9] text-[#B87436]",
  APPROVED: "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",
  REJECTED: "border border-[#F5D8DE] bg-[#FFF1F3] text-[#C85C70]",
  ARCHIVED: "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function VendorDashboard() {
  const { vendorId, vendor } = await requireVendor();

  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    submittedProducts,
    leads,
    questions,
    recentProducts,
  ] = await Promise.all([
    prisma.product.count({
      where: { vendorId },
    }),

    prisma.product.count({
      where: {
        vendorId,
        status: "PUBLISHED",
      },
    }),

    prisma.product.count({
      where: {
        vendorId,
        status: "DRAFT",
      },
    }),

    prisma.product.count({
      where: {
        vendorId,
        status: "SUBMITTED",
      },
    }),

    prisma.enquiry.count({
      where: {
        product: { vendorId },
      },
    }),

    prisma.productQuestion.count({
      where: {
        product: { vendorId },
      },
    }),

    prisma.product.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    }),
  ]);

  const primaryStats = [
    {
      label: "Total Products",
      value: totalProducts,
      description: "Products in your catalog",
      href: "/vendor/products",
      icon: Package,
    },
    {
      label: "Published Products",
      value: publishedProducts,
      description: "Live products on CADGram",
      href: "/vendor/products",
      icon: CheckCircle2,
    },
    {
      label: "Total Leads",
      value: leads,
      description: "Customer product enquiries",
      href: null,
      icon: MessageSquareText,
    },
    {
      label: "Total Questions",
      value: questions,
      description: "Questions about your products",
      href: null,
      icon: CircleHelp,
    },
  ];

  const secondaryStats = [
    {
      label: "Draft Products",
      value: draftProducts,
      icon: FileClock,
    },
    {
      label: "Submitted Products",
      value: submittedProducts,
      icon: Send,
    },
  ];

  const attentionItems = [
    {
      label: "Draft Products",
      description: "Products still being prepared",
      value: draftProducts,
      icon: FileClock,
      color: "amber",
    },
    {
      label: "Submitted Products",
      description: "Products awaiting admin review",
      value: submittedProducts,
      icon: Send,
      color: "blue",
    },
    {
      label: "Customer Questions",
      description: "Questions received for your products",
      value: questions,
      icon: CircleHelp,
      color: "red",
    },
  ] as const;

  const totalAttention = draftProducts + submittedProducts + questions;

  const quickActions = [
    {
      label: "Add New Product",
      description: "Create a software listing",
      href: "/vendor/products/new",
      icon: Plus,
    },
    {
      label: "Manage Products",
      description: "Review and edit your catalog",
      href: "/vendor/products",
      icon: Package,
    },
  ];

  const publishingRate =
    totalProducts > 0
      ? Math.round((publishedProducts / totalProducts) * 100)
      : 0;

  const otherProducts = Math.max(
    0,
    totalProducts - publishedProducts - draftProducts - submittedProducts,
  );

  const publishingBreakdown = [
    {
      label: "Published",
      value: publishedProducts,
      color: "bg-emerald-500",
    },
    {
      label: "Drafts",
      value: draftProducts,
      color: "bg-amber-400",
    },
    {
      label: "Submitted",
      value: submittedProducts,
      color: "bg-blue-500",
    },
    {
      label: "Other",
      value: otherProducts,
      color: "bg-gray-300",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
            Welcome back,{" "}
            <span className="font-semibold text-[#8065B0]">{vendor.name}</span>
          </h1>

          <p className="mt-1 text-[14px] leading-5 text-[#77808E]">
            Manage your CADGram catalog and customer engagement.
          </p>
        </div>

        <Link
          href="/vendor/products/new"
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={17} />
          Add Product
        </Link>
      </section>

      {/* Primary Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat) => {
          const Icon = stat.icon;

          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#77717F]">
                  {stat.label}
                </p>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white/70 text-[#8065B0]">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
              </div>

              <p className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                {stat.value.toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-xs text-[#9891A0]">{stat.description}</p>
            </>
          );

          const cardPalette: Record<string, string> = {
            "Total Products": "bg-gradient-to-br from-[#F0EAFB] to-[#FAF7FF]",
            "Published Products":
              "bg-gradient-to-br from-[#E7F7EF] to-[#F7FCF9]",
            "Total Leads": "bg-gradient-to-br from-[#FDEBF0] to-[#FFF9FB]",
            "Total Questions": "bg-gradient-to-br from-[#FFF2DF] to-[#FFFCF6]",
          };
          const cardClass = `group min-h-[146px] rounded-[21px] border border-white/80 p-5 shadow-[0_5px_20px_rgba(55,45,75,0.035)] transition-all hover:-translate-y-0.5 hover:shadow-md ${cardPalette[stat.label] ?? "bg-white"}`;

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={cardClass}>
              {content}
            </Link>
          ) : (
            <div key={stat.label} className={cardClass}>
              {content}
            </div>
          );
        })}
      </section>

      {/* Needs Attention + Quick Actions */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Needs Attention */}
        <div className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDF3] px-5 py-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#25232C]">
                  Needs Attention
                </h2>

                {totalAttention > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-[#8065B0]">
                    {totalAttention}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-[#77808E]">
                Product and customer activity to review
              </p>
            </div>

            <Clock3 size={19} className="text-[#9891A0]" />
          </div>

          <div className="divide-y divide-gray-100 px-3 py-2">
            {attentionItems.map((item) => {
              const Icon = item.icon;

              const iconStyle =
                item.color === "red"
                  ? "bg-red-50 text-red-600"
                  : item.color === "amber"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-blue-600";

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-4 sm:gap-4"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                  >
                    <Icon size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#302B38]">
                      {item.label}
                    </span>

                    <span className="mt-1 block text-xs text-[#77808E]">
                      {item.description}
                    </span>
                  </span>

                  <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-[#302B38]">
                    {item.value.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <Sparkles size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-[#25232C]">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-[#77808E]">
                Shortcuts to common tasks
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#F0EDF3] bg-[#FAF9FC] px-4 py-3 transition hover:border-[#E5E2EA] hover:bg-[#F6F3F9]"
                >
                  <Icon size={18} className="shrink-0 text-[#77717F]" />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#45404D]">
                      {action.label}
                    </span>

                    <span className="mt-1 block text-xs text-[#77808E]">
                      {action.description}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-[#9891A0] transition group-hover:text-[#8065B0]"
                  />
                </Link>
              );
            })}

            {/* Enquiry Summary */}
            <div className="flex items-center gap-3 rounded-xl border border-[#F0EDF3] bg-[#FAF9FC] px-4 py-3">
              <MessageSquareText
                size={18}
                className="shrink-0 text-[#77717F]"
              />

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#45404D]">
                  Customer Enquiries
                </span>

                <span className="mt-1 block text-xs text-[#77808E]">
                  Enquiries received for your products
                </span>
              </span>

              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#302B38]">
                {leads.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Statistics */}
      <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-[#25232C]">
            Catalog Statistics
          </h2>

          <p className="mt-1 text-xs text-[#77808E]">
            More insights into your product catalog
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-2xl border border-[#F0EDF3] bg-[#FAF9FC] p-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#77717F] shadow-sm">
                  <Icon size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[#77808E]">
                    {stat.label}
                  </span>

                  <span className="mt-1 block text-xl font-bold text-[#25232C]">
                    {stat.value.toLocaleString("en-IN")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Publishing Overview */}
      <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#25232C]">
              Publishing Overview
            </h2>

            <p className="mt-1 text-xs text-[#77808E]">
              Breakdown of your products by publishing status
            </p>
          </div>

          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-[#5E5668]">
            {totalProducts.toLocaleString("en-IN")} Total
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[38px] font-bold leading-tight tracking-tight text-[#1F2430]">
              {publishingRate}%
            </p>

            <p className="mt-1 text-sm text-[#77808E]">Products published</p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={15} />
            {publishedProducts.toLocaleString("en-IN")} live listings
          </span>
        </div>

        {/* Status Distribution */}
        <div
          className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-gray-100"
          role="img"
          aria-label={`${publishingRate}% of products are published`}
        >
          {publishingBreakdown.map((item) =>
            item.value > 0 ? (
              <div
                key={item.label}
                className={`h-full ${item.color}`}
                style={{
                  width:
                    totalProducts > 0
                      ? `${(item.value / totalProducts) * 100}%`
                      : "0%",
                }}
              />
            ) : null,
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {publishingBreakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />

                <span className="text-xs text-[#77808E]">{item.label}</span>
              </div>

              <p className="mt-2 pl-[18px] text-lg font-bold text-[#25232C]">
                {item.value.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#25232C]">Recent Activity</h2>

          <p className="mt-1 text-sm text-[#77808E]">
            Latest updates from your product catalog
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ActivityCard
            title="Recent Products"
            description="Your five most recently updated products"
            icon={<Package size={19} />}
            href="/vendor/products"
          >
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/vendor/products/${product.id}/edit`}
                  className="group flex cursor-pointer items-center gap-3 border-b border-[#F0EDF3] px-5 py-4 transition last:border-0 hover:bg-[#F8F6FA]"
                >
                  <Avatar label={product.name} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#302B38]">
                      {product.name}
                    </span>

                    <span className="mt-1 block text-xs text-[#77808E]">
                      Updated {product.updatedAt.toLocaleDateString("en-IN")}
                    </span>
                  </span>

                  <StatusBadge status={product.status} />

                  <ArrowUpRight
                    size={16}
                    className="hidden shrink-0 text-gray-300 transition group-hover:text-[#8065B0] sm:block"
                  />
                </Link>
              ))
            ) : (
              <EmptyState message="No products found.">
                <Link
                  href="/vendor/products/new"
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#403948]"
                >
                  <Plus size={16} />
                  Add First Product
                </Link>
              </EmptyState>
            )}
          </ActivityCard>

          {/* Vendor Activity Summary */}
          <ActivityCard
            title="Catalog Activity"
            description="A snapshot of your current product workflow"
            icon={<Clock3 size={19} />}
            href="/vendor/products"
          >
            <div className="divide-y divide-gray-100">
              {[
                {
                  label: "Published Products",
                  description: "Products live on CADGram",
                  value: publishedProducts,
                  icon: CheckCircle2,
                  iconClass:
                    "border border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]",
                },
                {
                  label: "Draft Products",
                  description: "Listings still being prepared",
                  value: draftProducts,
                  icon: FileClock,
                  iconClass:
                    "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
                },
                {
                  label: "Submitted Products",
                  description: "Listings awaiting review",
                  value: submittedProducts,
                  icon: Send,
                  iconClass:
                    "border border-[#F3E4C5] bg-[#FFF8E9] text-[#AA792C]",
                },
                {
                  label: "Customer Questions",
                  description: "Questions across your products",
                  value: questions,
                  icon: CircleHelp,
                  iconClass: "bg-blue-50 text-blue-700",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#302B38]">
                        {item.label}
                      </span>

                      <span className="mt-1 block text-xs text-[#77808E]">
                        {item.description}
                      </span>
                    </span>

                    <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-[#302B38]">
                      {item.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>
          </ActivityCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-[#E5E2EA] pt-5 text-xs text-[#9891A0] sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage your products. Grow your business.</p>
      </footer>
    </div>
  );
}

/* Shared UI Components */

function ActivityCard({
  title,
  description,
  icon,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#F0EDF3] px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
            {icon}
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#25232C]">
              {title}
            </span>

            <span className="mt-1 block text-xs text-[#77808E]">
              {description}
            </span>
          </span>
        </div>

        <Link
          href={href}
          className="shrink-0 cursor-pointer text-xs font-semibold text-[#77717F] hover:text-[#8065B0]"
        >
          View all
        </Link>
      </div>

      <div>{children}</div>
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-bold text-[#8065B0]">
      {label.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    statusStyles[status] ??
    "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]";

  return (
    <span
      className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center">
      <LayoutGrid size={24} className="text-gray-300" />

      <p className="mt-3 text-sm font-medium text-[#77808E]">{message}</p>

      {children}
    </div>
  );
}
