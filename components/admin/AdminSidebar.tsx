"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  SlidersHorizontal,
  Tags,
  FolderTree,
  Star,
  MessageCircleQuestion,
  Mail,
  MessagesSquare,
  FileText,
  Users,
  Store,
  Palette,
  ShieldCheck,
  PanelsTopLeft
} from "lucide-react";

import type { AdminPermissionKey } from "@/lib/permissions";

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  permission: AdminPermissionKey;
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

const navigation: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
        permission: "products.view",
      },
      {
        label: "Features",
        href: "/admin/features",
        icon: Sparkles,
        permission: "features.view",
      },
      {
        label: "Specifications",
        href: "/admin/specifications",
        icon: SlidersHorizontal,
        permission: "specifications.view",
      },
      {
        label: "Brands",
        href: "/admin/brands",
        icon: Tags,
        permission: "brands.view",
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: FolderTree,
        permission: "categories.view",
      },
    ],
  },
  {
    title: "Engagement",
    items: [
      {
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
        permission: "reviews.view",
      },
      {
        label: "Questions",
        href: "/admin/questions",
        icon: MessageCircleQuestion,
        permission: "questions.view",
      },
      {
        label: "Enquiries",
        href: "/admin/enquiries",
        icon: Mail,
        permission: "enquiries.view",
      },
      {
        label: "Contact Messages",
        href: "/admin/contact-messages",
        icon: MessagesSquare,
        permission: "contact_messages.view",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        label: "Blog Posts",
        href: "/admin/blog-posts",
        icon: FileText,
        permission: "blog_posts.view",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        permission: "users.view",
      },
      {
        label: "Vendors",
        href: "/admin/vendors",
        icon: Store,
        permission: "vendors.view",
      },
      {
        label: "Website Design",
        href: "/admin/website-design",
        icon: Palette,
        permission: "website_design.view",
      },
      {
        label: "Roles & Permissions",
        href: "/admin/roles",
        icon: ShieldCheck,
        permission: "roles.view",
      },

      {
        label: "Website Builder",
        href: "/admin/website-builder",
        icon: PanelsTopLeft,
        permission: "website_builder.view",
      },
    ],
  },
];

type Props = {
  collapsed: boolean;
  onMobileClose?: () => void;
  permissions: readonly string[];
};

export default function AdminSidebar({
  collapsed,
  onMobileClose,
  permissions,
}: Props) {
  const pathname = usePathname();

  const visibleNavigation = useMemo(() => {
    const permissionSet = new Set(permissions);

    return navigation
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          permissionSet.has(item.permission),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [permissions]);

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Admin navigation" className="space-y-4 pb-4">
      {visibleNavigation.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={sectionIndex > 0 ? "border-t border-[#F0EDF3] pt-3" : ""}
        >
          {/* Section Heading */}
          <p
            className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E859A] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            {section.title}
          </p>

          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onMobileClose}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-[42px] items-center rounded-[14px] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#C7B8E6] ${
                      collapsed
                        ? "gap-3 px-3 md:justify-center md:px-0"
                        : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-[#F0EAF9] text-[#51416B] shadow-[0_2px_8px_rgba(91,69,128,0.045)]"
                        : "text-[#777080] hover:bg-[#F8F5FB] hover:text-[#3B3347]"
                    }`}
                  >
                    {/* Active Indicator */}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-[10px] left-0 top-[10px] w-[3px] rounded-r-full bg-[#A78BCA]"
                      />
                    )}

                    {/* Navigation Icon */}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "text-[#745A9C]"
                          : "text-[#938B9D] group-hover:text-[#5B4D6D]"
                      }`}
                    >
                      <Icon size={19} strokeWidth={active ? 2.1 : 1.9} />
                    </span>

                    {/* Navigation Label */}
                    <span
                      className={`min-w-0 truncate text-[14px] font-normal leading-5 tracking-normal ${
                        collapsed ? "md:hidden" : ""
                      } ${active ? "text-[#453652]" : ""}`}
                    >
                      {item.label}
                    </span>
                  </Link>

                  {/* Tooltip for collapsed sidebar */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-[#EDE7F3] bg-[#302B38] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-[0_8px_20px_rgba(37,35,44,0.15)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:block">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
