import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleHelp,
  Clock3,
  FolderTree,
  Inbox,
  LayoutGrid,
  Mail,
  MessageCircleQuestion,
  MessagesSquare,
  Package,
  Star,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

export default async function AdminPage() {
  const admin = await requireAdminPermission("dashboard.view");

  const permissionSet = new Set(admin.permissions);

  const can = (permission: string) => permissionSet.has(permission);

  const [
    productCount,
    brandCount,
    categoryCount,
    reviewCount,
    questionCount,
    enquiryCount,
    contactMessageCount,
    blogPostCount,
    userCount,
    vendorCount,
    pendingEnquiries,
    unansweredQuestions,
    submittedProducts,
    recentBlogPosts,
    recentProducts,
    recentEnquiries,
    recentContactMessages,
  ] = await Promise.all([
    can("products.view") ? prisma.product.count() : Promise.resolve(0),

    can("brands.view") ? prisma.brand.count() : Promise.resolve(0),

    can("categories.view") ? prisma.category.count() : Promise.resolve(0),

    can("reviews.view") ? prisma.review.count() : Promise.resolve(0),

    can("questions.view") ? prisma.productQuestion.count() : Promise.resolve(0),

    can("enquiries.view") ? prisma.enquiry.count() : Promise.resolve(0),

    can("contact_messages.view")
      ? prisma.contactMessage.count()
      : Promise.resolve(0),

    can("blog_posts.view") ? prisma.blogPost.count() : Promise.resolve(0),

    can("users.view") ? prisma.user.count() : Promise.resolve(0),

    can("vendors.view") ? prisma.vendor.count() : Promise.resolve(0),

    can("enquiries.view")
      ? prisma.enquiry.count({
          where: { status: "pending" },
        })
      : Promise.resolve(0),

    can("questions.view")
      ? prisma.productQuestion.count({
          where: { answers: { none: {} } },
        })
      : Promise.resolve(0),

    can("products.view")
      ? prisma.product.count({
          where: { status: "SUBMITTED" },
        })
      : Promise.resolve(0),

    can("blog_posts.view")
      ? prisma.blogPost.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
            published: true,
          },
        })
      : Promise.resolve([]),

    can("products.view")
      ? prisma.product.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        })
      : Promise.resolve([]),

    can("enquiries.view")
      ? prisma.enquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
            product: { select: { name: true } },
          },
        })
      : Promise.resolve([]),

    can("contact_messages.view")
      ? prisma.contactMessage.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            message: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const primaryStats = [
    {
      label: "Total Products",
      value: productCount,
      description: "Products in your catalog",
      href: "/admin/products",
      icon: Package,
      permission: "products.view",
      tint: "bg-gradient-to-br from-[#FCEBF0]/85 via-[#FAF4F9]/90 to-[#F7F0FC]/80",
      iconTint: "bg-[#EBDEFA] text-[#76599B]",
    },
    {
      label: "Total Enquiries",
      value: enquiryCount,
      description: "Customer product enquiries",
      href: "/admin/enquiries",
      icon: Inbox,
      permission: "enquiries.view",
      tint: "bg-gradient-to-br from-[#FDF4F6]/90 via-[#FFF8F9]/85 to-[#F7F0F5]/80",
      iconTint: "bg-[#FADFE6] text-[#A35E7A]",
    },
    {
      label: "Total Vendors",
      value: vendorCount,
      description: "Registered vendor companies",
      href: "/admin/vendors",
      icon: Store,
      permission: "vendors.view",
      tint: "bg-gradient-to-br from-[#F3F7F8]/90 via-[#F1FAF7]/85 to-[#E8F6F3]/80",
      iconTint: "bg-[#D7F1E5] text-[#3F896D]",
    },
    {
      label: "Total Users",
      value: userCount,
      description: "Platform user accounts",
      href: "/admin/users",
      icon: Users,
      permission: "users.view",
      tint: "bg-gradient-to-br from-[#F6F4FE]/90 via-[#F4F5FD]/90 to-[#F0EFFB]/85",
      iconTint: "bg-[#DBE8FF] text-[#5E79AC]",
    },
  ].filter((item) => can(item.permission));

  const secondaryStats = [
    {
      label: "Brands",
      value: brandCount,
      href: "/admin/brands",
      icon: Tags,
      permission: "brands.view",
    },
    {
      label: "Categories",
      value: categoryCount,
      href: "/admin/categories",
      icon: FolderTree,
      permission: "categories.view",
    },
    {
      label: "Reviews",
      value: reviewCount,
      href: "/admin/reviews",
      icon: Star,
      permission: "reviews.view",
    },
    {
      label: "Questions",
      value: questionCount,
      href: "/admin/questions",
      icon: MessageCircleQuestion,
      permission: "questions.view",
    },
    {
      label: "Blog Posts",
      value: blogPostCount,
      href: "/admin/blog-posts",
      icon: BookOpen,
      permission: "blog_posts.view",
    },
    {
      label: "Contact Messages",
      value: contactMessageCount,
      href: "/admin/contact-messages",
      icon: MessagesSquare,
      permission: "contact_messages.view",
    },
  ].filter((item) => can(item.permission));

  const attentionItems = [
    {
      label: "Pending Enquiries",
      description: "Customer enquiries awaiting a response",
      value: pendingEnquiries,
      href: "/admin/enquiries",
      icon: Mail,
      color: "amber",
      permission: "enquiries.view",
    },
    {
      label: "Products Awaiting Review",
      description: "Vendor products submitted for approval",
      value: submittedProducts,
      href: "/admin/products",
      icon: Package,
      color: "red",
      permission: "products.view",
    },
    {
      label: "Unanswered Questions",
      description: "Product questions without an answer",
      value: unansweredQuestions,
      href: "/admin/questions",
      icon: CircleHelp,
      color: "blue",
      permission: "questions.view",
    },
  ] as const;

  const visibleAttentionItems = attentionItems.filter((item) =>
    can(item.permission),
  );

  const quickActions = [
    {
      label: "Add Product",
      href: "/admin/products/new",
      icon: Package,
      permission: "products.create",
    },
    {
      label: "Add Brand",
      href: "/admin/brands/new",
      icon: Tags,
      permission: "brands.create",
    },
    {
      label: "Add Category",
      href: "/admin/categories/new",
      icon: FolderTree,
      permission: "categories.create",
    },
    {
      label: "Add Blog Post",
      href: "/admin/blog-posts/new",
      icon: BookOpen,
      permission: "blog_posts.create",
    },
    {
      label: "Add Vendor",
      href: "/admin/vendors/new",
      icon: Store,
      permission: "vendors.create",
    },
  ].filter((item) => can(item.permission));

  const totalAttention = visibleAttentionItems.reduce(
    (total, item) => total + item.value,
    0,
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 pt-2 pb-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.035em] text-[#1F2430] sm:text-[24px]">
            Welcome back, {admin.user.name?.trim() || "Admin"}
          </h1>

          <p className="mt-1.5 text-[14px] leading-5 text-[#77808E]">
            Monitor your CADGram platform and manage daily operations.
          </p>
        </div>
      </section>

      {/* Primary metric cards — reference-inspired compact gradient layout */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`group relative flex min-h-[146px] flex-col rounded-[21px] border border-white/85 ${stat.tint} px-5 py-4 shadow-[0_10px_30px_rgba(52,43,74,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium uppercase tracking-[0.035em] text-[#66707F]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconTint}`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.055em] text-[#18202D]">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-auto pt-2 text-[13px] leading-5 text-[#77808E]">
                {stat.description}
              </p>
            </Link>
          );
        })}
      </section>

      {/* Attention + quick actions */}
      <section className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[21px] border border-white/85 bg-gradient-to-br from-[#FFF7FA]/90 via-white/85 to-[#E8FAF8]/75 shadow-[0_10px_30px_rgba(52,43,74,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E9EF]/80 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.025em] text-[#202633]">
                Needs attention
              </h2>
              <p className="mt-1 text-[13px] text-[#7C8390]">
                {totalAttention}{" "}
                {totalAttention === 1 ? "item needs" : "items need"} action
              </p>
            </div>
            <Clock3 size={17} className="text-[#9399A5]" />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {visibleAttentionItems.map((item) => {
              const Icon = item.icon;
              const tone =
                item.color === "red"
                  ? "border-[#F9D9DE] bg-[#FFF9F9]/80 text-[#BE596A]"
                  : item.color === "amber"
                    ? "border-[#F8D99D] bg-[#FFFDF5]/80 text-[#B66D16]"
                    : "border-[#D8E5F8] bg-[#F8FBFF]/80 text-[#547DAF]";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex min-h-[55px] items-center gap-2 rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm ${tone}`}
                >
                  <span className="shrink-0 text-[18px] font-semibold leading-none">
                    {item.value}
                  </span>
                  <span className="min-w-0 flex-1 text-[12px] font-medium leading-4 text-[#283140]">
                    {item.label}
                  </span>
                  <Icon
                    size={14}
                    className="hidden shrink-0 opacity-60 2xl:block"
                  />
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-[#818A97] transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              );
            })}
            {visibleAttentionItems.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-[#77808E]">
                No attention items available for your permissions.
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[21px] border border-white/85 bg-white/80 shadow-[0_10px_30px_rgba(52,43,74,0.04)]">
          <div className="border-b border-[#E8E9EF]/80 px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.025em] text-[#202633]">
              Quick actions
            </h2>
            <p className="mt-1 text-[13px] text-[#7C8390]">
              Shortcuts to common tasks
            </p>
          </div>
          <div className="space-y-2 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex min-h-[43px] items-center gap-3 rounded-xl border border-[#E9E9EF] bg-white/65 px-4 py-2.5 transition hover:border-[#DCD5EB] hover:bg-white"
                >
                  <Icon size={17} className="text-[#727C8A]" />
                  <span className="flex-1 text-[13px] font-medium text-[#283140]">
                    {action.label}
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-[#9BA3AF] group-hover:text-[#75639D]"
                  />
                </Link>
              );
            })}
            {quickActions.length === 0 && (
              <p className="py-5 text-center text-sm text-[#77808E]">
                No quick actions available.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Secondary statistics */}
      <section className="rounded-[24px] border border-[#EEE9F2] bg-white/95 p-5 shadow-[0_8px_28px_rgba(68,50,91,0.035)] sm:p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-[#25232C]">
            Platform Statistics
          </h2>
          <p className="mt-1 text-[14px] text-[#827A8A]">
            More insights into your catalog and content
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#F1EDF4] bg-[#FBF9FD] p-4 transition hover:border-[#E8E0ED] hover:bg-white/95 hover:shadow-[0_8px_28px_rgba(68,50,91,0.035)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#756B7D] shadow-[0_8px_28px_rgba(68,50,91,0.035)]">
                  <Icon size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[#827A8A]">
                    {stat.label}
                  </span>
                  <span className="mt-1 block text-xl font-bold text-[#25232C]">
                    {stat.value.toLocaleString("en-IN")}
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="text-gray-300 group-hover:text-[#8062A8]"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-[#25232C]">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-[#827A8A]">
            Latest updates across your platform
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {can("products.view") && (
            <ActivityCard
              title="Recent Products"
              description="Latest products added to your catalog"
              icon={<Package size={19} />}
              href="/admin/products"
            >
              {recentProducts.length ? (
                recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={
                      can("products.edit")
                        ? `/admin/products/${product.id}/edit`
                        : "/admin/products"
                    }
                    className="group flex items-center gap-3 border-b border-[#F1EDF4] px-5 py-4 last:border-0 hover:bg-[#FCF9FD]"
                  >
                    <Avatar label={product.name} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#302A38]">
                        {product.name}
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-[#827A8A]">
                        {product.brand?.name ?? "No brand"} ·{" "}
                        {product.category?.name ?? "No category"}
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-xs text-[#A29AAA] sm:block">
                      {product.createdAt.toLocaleDateString("en-IN")}
                    </span>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </Link>
                ))
              ) : (
                <EmptyState message="No products found." />
              )}
            </ActivityCard>
          )}

          {can("enquiries.view") && (
            <ActivityCard
              title="Recent Enquiries"
              description="Latest customer product enquiries"
              icon={<Mail size={19} />}
              href="/admin/enquiries"
            >
              {recentEnquiries.length ? (
                recentEnquiries.map((enquiry) => {
                  const status = (enquiry.status || "pending").toLowerCase();

                  return (
                    <Link
                      key={enquiry.id}
                      href="/admin/enquiries"
                      className="group flex items-center gap-3 border-b border-[#F1EDF4] px-5 py-4 last:border-0 hover:bg-[#FCF9FD]"
                    >
                      <Avatar label={enquiry.name} />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#302A38]">
                          {enquiry.name}
                        </span>
                        <span className="mt-1 block truncate text-[13px] text-[#827A8A]">
                          {enquiry.product?.name || "General enquiry"}
                        </span>
                      </span>

                      <StatusBadge status={status} />
                    </Link>
                  );
                })
              ) : (
                <EmptyState message="No enquiries found." />
              )}
            </ActivityCard>
          )}
          {can("blog_posts.view") && (
            <ActivityCard
              title="Recent Blog Posts"
              description="Latest content activity"
              icon={<BookOpen size={19} />}
              href="/admin/blog-posts"
            >
              {recentBlogPosts.length ? (
                recentBlogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={
                      can("blog_posts.edit")
                        ? `/admin/blog-posts/${post.id}/edit`
                        : "/admin/blog-posts"
                    }
                    className="group flex items-center gap-3 border-b border-[#F1EDF4] px-5 py-4 last:border-0 hover:bg-[#FCF9FD]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0F8] text-[#756B7D]">
                      <BookOpen size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#302A38]">
                        {post.title}
                      </span>
                      <span className="mt-1 block text-[13px] text-[#827A8A]">
                        {post.createdAt.toLocaleDateString("en-IN")}
                      </span>
                    </span>

                    <StatusBadge
                      status={post.published ? "published" : "draft"}
                    />
                  </Link>
                ))
              ) : (
                <EmptyState message="No blog posts found." />
              )}
            </ActivityCard>
          )}
          {can("contact_messages.view") && (
            <ActivityCard
              title="Recent Contact Messages"
              description="Latest messages from your website"
              icon={<MessagesSquare size={19} />}
              href="/admin/contact-messages"
            >
              {recentContactMessages.length ? (
                recentContactMessages.map((message) => (
                  <Link
                    key={message.id}
                    href="/admin/contact-messages"
                    className="group flex items-start gap-3 border-b border-[#F1EDF4] px-5 py-4 last:border-0 hover:bg-[#FCF9FD]"
                  >
                    <Avatar label={message.name} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#302A38]">
                        {message.name}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[13px] leading-5 text-[#827A8A]">
                        {message.message || "No message provided."}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-[#A29AAA]">
                        {message.email}
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-xs text-[#A29AAA] sm:block">
                      {message.createdAt.toLocaleDateString("en-IN")}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState message="No contact messages found." />
              )}
            </ActivityCard>
          )}
        </div>
      </section>
    </div>
  );
}

function ActivityCard({
  title,
  description,
  icon,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#EEE9F2] bg-white/95 shadow-[0_8px_28px_rgba(68,50,91,0.035)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#F1EDF4] px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0F8] text-[#665D70]">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-[#25232C]">
              {title}
            </span>
            <span className="mt-1 block text-[13px] text-[#827A8A]">
              {description}
            </span>
          </span>
        </div>

        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-[#756B7D] hover:text-[#8062A8]"
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
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2ECFA] text-sm font-bold text-[#665D70]">
      {label.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "published" || status === "contacted"
      ? "bg-[#E7F7EF] text-emerald-700"
      : status === "pending" || status === "submitted"
        ? "bg-[#FFF3E5] text-amber-700"
        : "bg-[#F5F0F8] text-[#756B7D]";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-6 py-8 text-center">
      <LayoutGrid size={22} className="text-gray-300" />
      <p className="mt-3 text-sm font-medium text-[#827A8A]">{message}</p>
    </div>
  );
}
