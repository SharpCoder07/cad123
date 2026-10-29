
"use client";

import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { signOut } from "next-auth/react";

type VendorHeaderProps = {
  collapsed: boolean;
  userName: string;
  vendorName: string;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  draftCount: number;
  submittedCount: number;
};

const quickLinks = [
  {
    label: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    label: "My Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    label: "Add Product",
    href: "/vendor/products/new",
    icon: Plus,
  },
];

const createLinks = [
  {
    label: "Create Product",
    href: "/vendor/products/new",
    icon: Package,
  },
];

export default function VendorHeader({
  collapsed,
  userName,
  vendorName,
  mobileOpen,
  onMobileToggle,
  draftCount,
  submittedCount,
}: VendorHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();

  const [searchOpen, setSearchOpen] =
    useState(false);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [
    profileModalOpen,
    setProfileModalOpen,
  ] = useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const createRef =
    useRef<HTMLDivElement>(null);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  const profileRef =
    useRef<HTMLDivElement>(null);

  const userInitial =
    userName.charAt(0).toUpperCase() || "V";

  const query = search.trim().toLowerCase();

  const filteredQuickLinks = quickLinks.filter(
    (item) =>
      item.label.toLowerCase().includes(query)
  );

  const notificationCount =
    draftCount + submittedCount;

  function closeMenus() {
    setCreateOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  function openSearch() {
    closeMenus();
    setSearchOpen(true);
  }

  function navigate(href: string) {
    closeSearch();
    closeMenus();
    router.push(href);
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    setCreateOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setSearch("");
    setProfileModalOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;

    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
        setCreateOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
        setCreateOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setProfileModalOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, []);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !createRef.current?.contains(target)
      ) {
        setCreateOpen(false);
      }

      if (
        !notificationRef.current?.contains(
          target
        )
      ) {
        setNotificationsOpen(false);
      }

      if (
        !profileRef.current?.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      onMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onMouseDown
      );
    };
  }, []);

  useEffect(() => {
    if (!searchOpen && !profileModalOpen) {
      return;
    }

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [searchOpen, profileModalOpen]);

  return (
    <>
      <header
        className={`fixed right-4 top-4 z-30 h-[72px] rounded-[24px] border border-white/90 bg-white/95 shadow-[0_8px_35px_rgba(55,45,75,0.055)] backdrop-blur-xl transition-[left] duration-300 ${
          collapsed
            ? "left-4 md:left-[124px]"
            : "left-4 md:left-[284px]"
        }`}
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMobileToggle}
              aria-label={
                mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
            >
              {mobileOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-semibold text-gray-900">
                CADGram Vendor
              </p>

              <p className="truncate text-[11px] text-gray-500">
                Vendor workspace
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search vendor pages"
              className="flex h-11 items-center gap-3 rounded-xl border border-[#EAE5EF] bg-[#F8F6FA] px-3 text-sm text-[#6B7280] transition hover:bg-[#F0ECF5] sm:w-[240px] lg:w-[320px]"
            >
              <Search
                size={19}
                className="shrink-0"
              />

              <span className="hidden flex-1 truncate text-left sm:block">
                Search or jump to...
              </span>

              <kbd className="hidden rounded-md border border-gray-300 bg-[#E1E3E7] px-2 py-1 text-[11px] font-semibold text-gray-500 lg:inline-block">
                ⌘K
              </kbd>
            </button>

            {/* Create */}
            <div
              ref={createRef}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() => {
                  const next = !createOpen;
                  closeMenus();
                  setCreateOpen(next);
                }}
                aria-expanded={createOpen}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#25232C] px-4 text-sm font-semibold text-white transition hover:bg-[#303030]"
              >
                <Plus size={18} />
                Create
                <ChevronDown size={15} />
              </button>

              {createOpen && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
                  {createLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() =>
                          navigate(item.href)
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Public Website */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="View website"
              aria-label="View website"
              className="hidden h-11 w-11 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:flex"
            >
              <ExternalLink size={19} />
            </a>

            {/* Notifications */}
            <div
              ref={notificationRef}
              className="relative"
            >
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={
                  notificationsOpen
                }
                onClick={() => {
                  const next =
                    !notificationsOpen;

                  closeMenus();
                  setNotificationsOpen(next);
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
              >
                <Bell size={19} />

                {notificationCount > 0 && (
                  <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#7C668F] px-1 text-[10px] font-bold text-white">
                    {notificationCount > 99
                      ? "99+"
                      : notificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-[-55px] top-14 z-50 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl sm:right-0">
                  <div className="px-2 py-2">
                    <p className="font-semibold text-gray-950">
                      Product Status
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Your current catalog summary
                    </p>
                  </div>

                  {[
                    {
                      label: "Draft products",
                      value: draftCount,
                      icon: FileClock,
                    },
                    {
                      label: "Submitted products",
                      value: submittedCount,
                      icon: Send,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          navigate(
                            "/vendor/products"
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                          <Icon size={17} />
                        </span>

                        <span className="flex-1 text-sm font-medium text-gray-800">
                          {item.label}
                        </span>

                        <span className="text-sm font-bold text-gray-950">
                          {item.value}
                        </span>

                        <ChevronRight
                          size={15}
                          className="text-gray-400"
                        />
                      </button>
                    );
                  })}

                  <p className="px-3 pb-2 pt-3 text-[11px] leading-5 text-gray-400">
                    These are product counts,
                    not unread notifications.
                  </p>
                </div>
              )}
            </div>

            {/* Profile */}
            <div
              ref={profileRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  const next = !profileOpen;
                  closeMenus();
                  setProfileOpen(next);
                }}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-gray-100"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C668F] text-sm font-bold text-white">
                  {userInitial}
                </span>

                <span className="hidden text-left lg:block">
                  <span className="block max-w-36 truncate text-sm font-semibold text-gray-900">
                    {userName}
                  </span>

                  <span className="block text-xs text-gray-500">
                    Vendor
                  </span>
                </span>

                <ChevronDown
                  size={16}
                  className="hidden text-gray-500 lg:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
                  <div className="border-b border-gray-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {userName}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {vendorName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserRound size={17} />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/vendor")
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LayoutDashboard
                      size={17}
                    />
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={17} />
                    {loggingOut
                      ? "Signing out..."
                      : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      {mounted && searchOpen && createPortal(
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSearch();
            }
          }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[#25232C]/20 px-3 pt-[8vh]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vendor navigation search"
            className="w-full max-w-[620px] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <Search
                size={21}
                className="text-gray-400"
              />

              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search vendor pages..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none"
              />

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                {query
                  ? "Matching pages"
                  : "Quick navigation"}
              </p>

              {filteredQuickLinks.map(
                (item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() =>
                        navigate(item.href)
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-100"
                    >
                      <Icon
                        size={18}
                        className="text-gray-500"
                      />

                      <span className="flex-1 text-sm font-medium text-gray-800">
                        {item.label}
                      </span>

                      <ChevronRight
                        size={15}
                        className="text-gray-400"
                      />
                    </button>
                  );
                }
              )}

              {filteredQuickLinks.length ===
                0 && (
                <p className="py-10 text-center text-sm text-gray-500">
                  No matching pages found.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-400">
              Search CADGram Vendor Portal pages
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Modal */}
      {mounted && profileModalOpen && createPortal(
        <div
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setProfileModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#25232C]/20 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vendor profile"
            className="w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">
                Vendor Profile
              </h2>

              <button
                type="button"
                onClick={() =>
                  setProfileModalOpen(false)
                }
                aria-label="Close profile"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7C668F] text-lg font-bold text-white">
                {userInitial}
              </span>

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-950">
                  {userName}
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {vendorName}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-500">
                Role
              </span>

              <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                <ShieldCheck
                  size={16}
                  className="text-emerald-600"
                />
                Vendor
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setProfileModalOpen(false)
              }
              className="mt-6 w-full rounded-xl bg-[#25232C] px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
