"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminPermissionWatcher from "@/components/admin/AdminPermissionWatcher";

type AdminShellProps = {
  userName: string;
  permissions: readonly string[];
  adminRoleName?: string;
  userImage?: string | null;
  children: React.ReactNode;
};

export default function AdminShell({
  userName,
  permissions,
  adminRoleName = "Administrator",
  userImage = null,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  const [profileName, setProfileName] = useState(userName);
  const [profileImage, setProfileImage] = useState<string | null>(userImage);
  const [profileRole, setProfileRole] = useState(adminRoleName);

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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function syncProfile() {
      try {
        const response = await fetch("/api/admin/profile", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!data.success || !data.profile || cancelled) return;

        setProfileName(data.profile.name?.trim() || "Admin");
        setProfileImage(data.profile.image ?? null);
        setProfileRole(data.profile.adminRole?.name || adminRoleName);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to synchronize admin profile:", error);
        }
      }
    }

    function handleProfileUpdated() {
      void syncProfile();
    }

    void syncProfile();

    window.addEventListener("admin-profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener("admin-profile-updated", handleProfileUpdated);
    };
  }, [pathname, adminRoleName]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F3F1F7] text-[#25232C]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_8%_5%,rgba(250,219,226,0.46),transparent_34%),radial-gradient(ellipse_at_92%_4%,rgba(225,217,249,0.42),transparent_35%),radial-gradient(ellipse_at_75%_92%,rgba(211,244,232,0.34),transparent_36%)]"
      />

      <AdminPermissionWatcher
        permissions={permissions}
        adminRoleName={adminRoleName}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-[#25232C]/35 backdrop-blur-[3px] md:hidden"
        />
      )}

      <aside
        className={`fixed bottom-4 left-4 top-4 z-50 flex flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white/95 shadow-[0_12px_45px_rgba(55,45,75,0.055)] backdrop-blur-xl transition-[width,transform] duration-300 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+24px)] md:translate-x-0"
        } ${collapsed ? "w-[260px] md:w-[92px]" : "w-[260px] md:w-[252px]"}`}
      >
        {/* Brand and desktop sidebar toggle */}
        <div className={`relative flex h-[86px] shrink-0 items-center border-b border-[#F0EDF3] px-4 ${collapsed ? "md:justify-center" : "justify-between"}`}>
          <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "md:hidden" : ""}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#25232C] text-xl font-extrabold text-white shadow-[0_5px_14px_rgba(37,35,44,0.13)]">
              G
            </div>
            <div className={collapsed ? "md:hidden" : ""}>
              <p className="text-[16px] font-bold tracking-[-0.035em] text-[#25232C]">
                CADGram
              </p>
              <p className="text-[11px] font-medium text-[#96909F]">
                Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#EAE5F1] bg-[#F8F5FB] text-[#77628F] transition-colors hover:bg-[#EFE8F8] hover:text-[#59456F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7B8E6] md:flex"
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

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          <AdminSidebar
            collapsed={collapsed}
            onMobileClose={() => setMobileOpen(false)}
            permissions={permissions}
          />
        </div>

        <div className="shrink-0 border-t border-[#F0EDF3] p-3">
          <div
            className={`flex items-center gap-3 rounded-[16px] border border-[#F1EDF4] bg-[#F9F7FB] p-2.5 ${
              collapsed ? "md:justify-center" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#EDE7F7] text-xs font-bold text-[#55496B]">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt="Admin profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                profileName.charAt(0).toUpperCase() || "A"
              )}
            </span>
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="truncate text-[12px] font-semibold text-[#302B38]">
                {profileName}
              </p>
              <p className="truncate text-[11px] text-[#928B9B]">
                {profileRole}
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
        <AdminHeader
          collapsed={collapsed}
          userName={profileName}
          userRole={profileRole}
          userImage={profileImage}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((value) => !value)}
        />

        <main className="min-h-screen px-4 pb-10 pt-[112px] sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
