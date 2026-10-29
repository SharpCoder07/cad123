"use client";

import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { createPortal } from "react-dom";

type AdminHeaderProps = {
  collapsed: boolean;
  userName: string;
  userRole: string;
  userImage?: string | null;
  mobileOpen: boolean;
  onMobileToggle: () => void;
};

type GlobalSearchResult = {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

type NotificationData = {
  pendingEnquiries: number;
  unansweredQuestions: number;
  contactMessages: number;
};

const quickLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Brands", href: "/admin/brands", icon: Tags },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Features", href: "/admin/features", icon: Settings },
  {
    label: "Specifications",
    href: "/admin/specifications",
    icon: FileText,
  },
  { label: "Reviews", href: "/admin/reviews", icon: CircleHelp },
  { label: "Questions", href: "/admin/questions", icon: CircleHelp },
  { label: "Enquiries", href: "/admin/enquiries", icon: Mail },
  {
    label: "Contact Messages",
    href: "/admin/contact-messages",
    icon: MessageSquare,
  },
  { label: "Blog Posts", href: "/admin/blog-posts", icon: BookOpen },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Vendors", href: "/admin/vendors", icon: Store },
  {
    label: "Website Design",
    href: "/admin/website-design",
    icon: Settings,
  },
];

const createLinks = [
  { label: "Create Product", href: "/admin/products/new", icon: Package },
  { label: "Create Brand", href: "/admin/brands/new", icon: Tags },
  {
    label: "Create Category",
    href: "/admin/categories/new",
    icon: FilePlus2,
  },
  {
    label: "Create Blog Post",
    href: "/admin/blog-posts/new",
    icon: BookOpen,
  },
  { label: "Add Vendor", href: "/admin/vendors/new", icon: Store },
];

function resultIcon(type: string) {
  switch (type) {
    case "product":
      return Package;
    case "brand":
    case "category":
      return Tags;
    case "blog":
      return BookOpen;
    case "user":
      return Users;
    case "enquiry":
      return Mail;
    case "question":
      return CircleHelp;
    default:
      return FileText;
  }
}

export default function AdminHeader({
  collapsed,
  userName,
  userRole,
  userImage = null,
  mobileOpen,
  onMobileToggle,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [notifications, setNotifications] = useState<NotificationData>({
    pendingEnquiries: 0,
    unansweredQuestions: 0,
    contactMessages: 0,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const userInitial = userName.charAt(0).toUpperCase() || "A";
  const query = search.trim().toLowerCase();

  const filteredQuickLinks = quickLinks.filter((item) =>
    item.label.toLowerCase().includes(query),
  );

  const notificationCount =
    notifications.pendingEnquiries + notifications.unansweredQuestions;

  function closeMenus() {
    setCreateOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }

  function openSearch() {
    closeMenus();
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
    setSearchResults([]);
  }

  function navigate(href: string) {
    closeSearch();
    closeMenus();
    router.push(href);
  }

  async function loadNotifications() {
    setNotificationsLoading(true);

    try {
      const responses = await Promise.allSettled([
        fetch("/api/admin/enquiries"),
        fetch("/api/admin/questions"),
        fetch("/api/admin/contact-messages"),
      ]);

      async function getItems(index: number, keys: string[]) {
        const result = responses[index];

        if (result.status !== "fulfilled" || !result.value.ok) {
          return [];
        }

        const data = await result.value.json();

        if (Array.isArray(data)) return data;

        for (const key of keys) {
          if (Array.isArray(data[key])) return data[key];
        }

        return [];
      }

      const [enquiries, questions, messages] = await Promise.all([
        getItems(0, ["enquiries", "data"]),
        getItems(1, ["questions", "data"]),
        getItems(2, ["messages", "contactMessages", "data"]),
      ]);

      setNotifications({
        pendingEnquiries: enquiries.filter(
          (item) => String(item.status).toLowerCase() === "pending",
        ).length,
        unansweredQuestions: questions.filter((item) => {
          if (Array.isArray(item.answers)) {
            return item.answers.length === 0;
          }
          return typeof item.answerCount === "number"
            ? item.answerCount === 0
            : false;
        }).length,
        contactMessages: messages.length,
      });
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    closeMenus();
    closeSearch();
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }

      if (event.key === "Escape") {
        closeSearch();
        closeMenus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!createRef.current?.contains(target)) setCreateOpen(false);
      if (!notificationRef.current?.contains(target)) {
        setNotificationsOpen(false);
      }
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (!searchOpen || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSearchResults([]);
          return;
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setSearchResults(data.success ? (data.results ?? []) : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Global search error:", error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen]);

  return (
    <>
      <header
        className={`fixed right-4 top-4 z-30 h-[72px] rounded-[24px] border border-white/90 bg-white/95 shadow-[0_8px_35px_rgba(55,45,75,0.055)] backdrop-blur-xl transition-[left] duration-300 ${
          collapsed ? "left-4 md:left-[124px]" : "left-4 md:left-[284px]"
        }`}
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMobileToggle}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#625B6B] hover:bg-[#F6F3F9] md:hidden"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-medium text-[#302B38]">
                CADGram workspace
              </p>
              <p className="truncate text-[11px] text-[#928B9B]">{userRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openSearch}
              className="cursor-pointer flex h-10 items-center gap-3 rounded-xl border border-[#EAE5EF] bg-[#F8F6FA] px-3 text-[13px] text-[#6B7280] transition hover:bg-[#F0ECF5] sm:w-[240px] lg:w-[320px]"
            >
              <Search size={19} className="shrink-0" />
              <span className="hidden flex-1 truncate text-left sm:block">
                Search or jump to...
              </span>
              <kbd className="hidden rounded-md border border-[#EAE5EF] bg-white px-2 py-1 text-[11px] font-semibold text-[#928B9B] lg:inline-block">
                ⌘K
              </kbd>
            </button>

            <div ref={createRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  const next = !createOpen;
                  closeMenus();
                  setCreateOpen(next);
                }}
                aria-expanded={createOpen}
                className="cursor-pointer flex h-10 items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
              >
                <Plus size={18} />
                Create
                <ChevronDown size={15} />
              </button>

              {createOpen && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-[#F0EDF3] bg-white p-2 shadow-[0_18px_55px_rgba(55,45,75,0.14)]">
                  {createLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#625B6B] hover:bg-[#F6F3F9]"
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="View website"
              aria-label="View website"
              className="cursor-pointer hidden h-10 w-10 items-center justify-center rounded-xl text-[#625B6B] hover:bg-[#F6F3F9] md:flex"
            >
              <ExternalLink size={19} />
            </a>

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  const next = !notificationsOpen;
                  closeMenus();
                  setNotificationsOpen(next);
                  if (next) void loadNotifications();
                }}
                className="cursor-pointer relative flex h-10 w-10 items-center justify-center rounded-xl text-[#625B6B] hover:bg-[#F6F3F9]"
              >
                <Bell size={19} />
                {notificationCount > 0 && (
                  <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#7C668F] px-1 text-[10px] font-bold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-[-55px] top-14 z-50 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-[#F0EDF3] bg-white p-3 shadow-[0_18px_55px_rgba(55,45,75,0.14)] sm:right-0">
                  <div className="flex items-center justify-between px-2 py-2">
                    <div>
                      <p className="font-semibold text-[#25232C]">
                        Notifications
                      </p>
                      <p className="text-xs text-[#928B9B]">
                        Items needing attention
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      disabled={notificationsLoading}
                      className="cursor-pointer text-xs font-semibold text-gray-600 hover:text-[#25232C] disabled:opacity-50"
                    >
                      {notificationsLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {[
                    {
                      label: "Pending enquiries",
                      value: notifications.pendingEnquiries,
                      href: "/admin/enquiries",
                      icon: Mail,
                    },
                    {
                      label: "Unanswered questions",
                      value: notifications.unansweredQuestions,
                      href: "/admin/questions",
                      icon: CircleHelp,
                    },
                    {
                      label: "Contact messages",
                      value: notifications.contactMessages,
                      href: "/admin/contact-messages",
                      icon: MessageSquare,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#FAF9FC]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F3F9] text-gray-600">
                          <Icon size={17} />
                        </span>
                        <span className="flex-1 text-sm font-medium text-[#393341]">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-[#25232C]">
                          {item.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  const next = !profileOpen;
                  closeMenus();
                  setProfileOpen(next);
                }}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="cursor-pointer flex items-center gap-3 rounded-xl p-1.5 hover:bg-[#F6F3F9]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EDE7F7] text-[13px] font-semibold text-[#55496B]">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-36 truncate text-[13px] font-medium text-[#302B38]">
                    {userName}
                  </span>
                  <span className="block text-[11px] text-[#928B9B]">
                    {userRole}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className="hidden text-[#928B9B] lg:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-[#F0EDF3] bg-white p-2 shadow-[0_18px_55px_rgba(55,45,75,0.14)]">
                  <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-3 py-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F9F3F5] text-sm font-bold text-[#55496B]">
                      {userImage ? (
                        <img
                          src={userImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#302B38]">
                        {userName}
                      </p>
                      <p className="truncate text-xs text-[#928B9B]">
                        {userRole}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/profile")}
                    className="cursor-pointer mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#625B6B] hover:bg-[#F6F3F9]"
                  >
                    <UserRound size={17} /> My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#625B6B] hover:bg-[#F6F3F9]"
                  >
                    <LayoutDashboard size={17} /> Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-[#F9F3F5] disabled:opacity-50"
                  >
                    <LogOut size={17} />
                    {loggingOut ? "Signing out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && createPortal((
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch();
          }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[#25232C]/20 px-3 pt-[8vh]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin global search"
            className="w-full max-w-[620px] overflow-hidden rounded-[24px] border border-[#F0EDF3] bg-white shadow-[0_18px_55px_rgba(55,45,75,0.14)]"
          >
            <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-4">
              <Search size={21} className="text-[#A9A2B0]" />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, users, brands, pages..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#302B38] outline-none"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="cursor-pointer rounded-lg p-2 text-[#928B9B] hover:bg-[#F6F3F9]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {query.length < 2 ? (
                <>
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#A9A2B0]">
                    Quick navigation
                  </p>
                  {filteredQuickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F6F3F9]"
                      >
                        <Icon size={18} className="text-[#928B9B]" />
                        <span className="flex-1 text-sm font-medium text-[#393341]">
                          {item.label}
                        </span>
                        <ChevronRight size={15} className="text-[#A9A2B0]" />
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {filteredQuickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F6F3F9]"
                      >
                        <Icon size={18} className="text-[#928B9B]" />
                        <span className="flex-1 text-sm font-medium text-[#393341]">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-[#A9A2B0]">
                          Page
                        </span>
                      </button>
                    );
                  })}

                  {searchResults.map((item) => {
                    const Icon = resultIcon(item.type);
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F6F3F9]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F3F9] text-gray-600">
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#302B38]">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-[#928B9B]">
                            {item.subtitle}
                          </span>
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-[#A9A2B0]">
                          {item.type}
                        </span>
                      </button>
                    );
                  })}

                  {searchLoading && (
                    <p className="py-6 text-center text-sm text-[#928B9B]">
                      Searching...
                    </p>
                  )}

                  {!searchLoading &&
                    filteredQuickLinks.length === 0 &&
                    searchResults.length === 0 && (
                      <p className="py-10 text-center text-sm text-[#928B9B]">
                        No results found.
                      </p>
                    )}
                </>
              )}
            </div>

            <div className="border-t border-[#F0EDF3] bg-[#FAF9FC] px-5 py-3 text-xs text-[#A9A2B0]">
              Search CADGram admin pages and records
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
