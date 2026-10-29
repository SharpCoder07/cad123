import { MessageSquareText, Star, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import ReviewCatalog from "@/components/admin/ReviewCatalog";

export default async function AdminReviewsPage() {
  // RBAC: Only admins with reviews.view can access this page.
  const admin = await requireAdminPermission("reviews.view");

  const canEdit = admin.permissions.includes("reviews.edit");
  const canDelete = admin.permissions.includes("reviews.delete");

  const reviews = await prisma.review.findMany({
    include: {
      user: true,
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;

  const fiveStarReviews = reviews.filter(
    (review) => review.rating === 5,
  ).length;

  const reviewerCount = new Set(reviews.map((review) => review.userId)).size;

  const serializedReviews = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: {
      id: review.user.id,
      name: review.user.name,
      email: review.user.email,
    },
    product: {
      id: review.product.id,
      name: review.product.name,
      slug: review.product.slug,
    },
  }));

  const stats = [
    {
      label: "Total Reviews",
      value: reviews.length.toLocaleString("en-IN"),
      description: "Reviews across your catalog",
      icon: MessageSquareText,
      cardStyle: "border-[#E9E1F6] bg-gradient-to-br from-[#F5F0FF] to-[#FAF7FF]",
      iconStyle: "bg-white/80 text-[#8065B0]",
    },
    {
      label: "Average Rating",
      value: averageRating > 0 ? averageRating.toFixed(1) : "—",
      description: "Average product review score",
      icon: Star,
      cardStyle: "border-[#F4E5CD] bg-gradient-to-br from-[#FFF5E7] to-[#FFFBF3]",
      iconStyle: "bg-white/80 text-[#B9853C]",
    },
    {
      label: "5-Star Reviews",
      value: fiveStarReviews.toLocaleString("en-IN"),
      description: "Reviews with the highest rating",
      icon: Star,
      cardStyle: "border-[#D9EDE2] bg-gradient-to-br from-[#EAF8F0] to-[#F5FCF8]",
      iconStyle: "bg-white/80 text-[#3A9064]",
    },
    {
      label: "Reviewers",
      value: reviewerCount.toLocaleString("en-IN"),
      description: "Unique users who left reviews",
      icon: Users,
      cardStyle: "border-[#DBE8F8] bg-gradient-to-br from-[#EDF5FF] to-[#F7FAFF]",
      iconStyle: "bg-white/80 text-[#5885BB]",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
          Reviews Management
        </h1>
        <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
          Monitor and manage product reviews submitted by users.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Review statistics">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border p-5 shadow-[0_6px_22px_rgba(31,36,48,0.025)] ${stat.cardStyle}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#686676]">{stat.label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
              </div>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#25232C]">
                {stat.value}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-[#85818E]">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <section className="min-w-0">
        <ReviewCatalog
          reviews={serializedReviews}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}
