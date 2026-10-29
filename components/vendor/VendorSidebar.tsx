"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle } from "lucide-react";

const navigation = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/vendor", icon: LayoutDashboard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "My Products", href: "/vendor/products", icon: Package },
    ],
  },
];

type Props = {
  collapsed: boolean;
  onMobileClose?: () => void;
};

export default function VendorSidebar({ collapsed, onMobileClose }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/vendor") return pathname === "/vendor";

    if (href === "/vendor/products") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          pathname !== "/vendor/products/new")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Vendor navigation" className="space-y-4 pb-4">
      {navigation.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={sectionIndex > 0 ? "border-t border-[#F0EDF3] pt-3" : ""}
        >
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
                    className={`relative flex min-h-[42px] cursor-pointer items-center rounded-[14px] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#C7B8E6] ${
                      collapsed
                        ? "gap-3 px-3 md:justify-center md:px-0"
                        : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-[#F0EAF9] text-[#51416B] shadow-[0_2px_8px_rgba(91,69,128,0.045)]"
                        : "text-[#777080] hover:bg-[#F8F5FB] hover:text-[#3B3347]"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-[10px] left-0 top-[10px] w-[3px] rounded-r-full bg-[#A78BCA]"
                      />
                    )}

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "text-[#745A9C]"
                          : "text-[#938B9D] group-hover:text-[#5B4D6D]"
                      }`}
                    >
                      <Icon size={19} strokeWidth={active ? 2.1 : 1.9} />
                    </span>

                    <span
                      className={`min-w-0 truncate text-[14px] font-normal leading-5 tracking-normal ${
                        collapsed ? "md:hidden" : ""
                      } ${active ? "text-[#453652]" : ""}`}
                    >
                      {item.label}
                    </span>
                  </Link>

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
