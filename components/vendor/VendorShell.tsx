"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import VendorHeader from "@/components/vendor/VendorHeader";
import VendorSidebar from "@/components/vendor/VendorSidebar";

type VendorShellProps = {
  userName: string;
  vendorName: string;
  draftCount: number;
  submittedCount: number;
  children: React.ReactNode;
};

export default function VendorShell({
  userName,
  vendorName,
  draftCount,
  submittedCount,
  children,
}: VendorShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F3F1F7] text-[#25232C]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_8%_5%,rgba(250,219,226,0.46),transparent_34%),radial-gradient(ellipse_at_92%_4%,rgba(225,217,249,0.42),transparent_35%),radial-gradient(ellipse_at_75%_92%,rgba(211,244,232,0.34),transparent_36%)]"
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-[#25232C]/35 md:hidden"
        />
      )}

      <aside
        className={`fixed bottom-4 left-4 top-4 z-50 flex flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white/95 shadow-[0_12px_45px_rgba(55,45,75,0.055)] backdrop-blur-xl transition-[width,transform] duration-300 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+24px)] md:translate-x-0"
        } ${collapsed ? "w-[260px] md:w-[92px]" : "w-[260px] md:w-[252px]"}`}
      >
        {/* Desktop expanded: logo + name + toggle.
            Desktop collapsed: ONLY centered expand toggle, no G logo.
            Mobile always shows full branding and its close button. */}
        <div
          className={`relative flex h-[86px] shrink-0 items-center border-b border-[#F0EDF3] px-4 ${
            collapsed ? "md:justify-center" : "justify-between"
          }`}
        >
          <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "md:hidden" : ""}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#25232C] text-xl font-extrabold text-white shadow-[0_5px_14px_rgba(37,35,44,0.13)]">
              G
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold tracking-[-0.035em] text-[#25232C]">
                CADGram
              </p>
              <p className="text-[11px] font-medium text-[#96909F]">
                Vendor workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#F0EDF3] text-[#817B8B] transition-colors hover:bg-[#F6F3F9] md:flex ${
              collapsed ? "md:bg-[#F8F5FC] md:border-[#EBE4F4]" : ""
            }`}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#817B8B] transition-colors hover:bg-[#F6F3F9] md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-5 ${
            collapsed ? "px-3 md:px-2" : "px-3"
          }`}
        >
          <VendorSidebar
            collapsed={collapsed}
            onMobileClose={() => setMobileOpen(false)}
          />
        </div>

        <div className="shrink-0 border-t border-[#F0EDF3] p-3">
          <div
            className={`flex items-center gap-3 rounded-[16px] border border-[#F1EDF4] bg-[#F9F7FB] p-2.5 ${
              collapsed ? "md:justify-center md:p-1.5" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#EDE7F7] text-xs font-bold text-[#55496B]">
              {userName.charAt(0).toUpperCase() || "V"}
            </span>
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="truncate text-[12px] font-semibold text-[#302B38]">
                {userName}
              </p>
              <p className="truncate text-[11px] text-[#928B9B]" title={vendorName}>
                {vendorName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`relative z-10 min-h-screen transition-[margin] duration-300 ${
          collapsed ? "md:ml-[108px]" : "md:ml-[268px]"
        }`}
      >
        <VendorHeader
          collapsed={collapsed}
          userName={userName}
          vendorName={vendorName}
          mobileOpen={mobileOpen}
          draftCount={draftCount}
          submittedCount={submittedCount}
          onMobileToggle={() => setMobileOpen((value) => !value)}
        />
        <main className="min-h-screen px-4 pb-10 pt-[112px] sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
