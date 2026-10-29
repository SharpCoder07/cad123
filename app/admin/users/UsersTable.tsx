"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  LockKeyhole,
  Pencil,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Store,
  Trash2,
  UserRound,
  Users,
  ShieldCheck,
  ArrowUpRight,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

type UserRole = "USER" | "ADMIN" | "VENDOR";
type RoleFilter = "all" | UserRole;
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

type AdminRole = {
  id: number;
  name: string;
  isSystem: boolean;
};

type User = {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  adminRoleId: number | null;
  adminRole: AdminRole | null;
  createdAt: string;
};

type UsersTableProps = {
  users: User[];
  currentUserId?: number;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  isSystemAdmin?: boolean;
};

const PROTECTED_ADMIN_EMAIL = "amit@example.com";

function getUserName(user: User) {
  return (user.name || user.email).toLowerCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersTable({
  users,
  currentUserId,
  canEditUsers = false,
  canDeleteUsers = false,
  isSystemAdmin = false,
}: UsersTableProps) {
  const [userList, setUserList] = useState<User[]>(users);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUserList(users);
  }, [users]);

  useEffect(() => {
    if (!deleteUser) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [deleteUser]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = userList.filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        String(user.id).includes(query) ||
        user.adminRole?.name.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "name-asc":
          return getUserName(a).localeCompare(getUserName(b));

        case "name-desc":
          return getUserName(b).localeCompare(getUserName(a));

        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [userList, search, roleFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasFilters =
    search.trim() !== "" || roleFilter !== "all" || sort !== "newest";

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setSort("newest");
  }

  function canEditUser(user: User) {
    if (!canEditUsers) return false;

    if (user.role === "VENDOR") return false;

    if (user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
      return false;
    }

    if (user.adminRole?.isSystem && !isSystemAdmin) {
      return false;
    }

    return true;
  }

  function canDeleteUser(user: User) {
    if (!canDeleteUsers) return false;

    if (user.id === currentUserId) return false;

    if (user.role === "VENDOR") return false;

    if (user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
      return false;
    }

    // DELETE API protects all system administrators.
    if (user.role === "ADMIN" && user.adminRole?.isSystem) {
      return false;
    }

    return true;
  }

  function openDeleteModal(user: User) {
    if (!canDeleteUser(user)) return;

    setDeleteUser(user);
  }

  function closeDeleteModal() {
    if (deleting) return;

    setDeleteUser(null);
  }

  async function handleDeleteUser() {
    if (!deleteUser || deleting || !canDeleteUser(deleteUser)) {
      return;
    }

    const userId = deleteUser.id;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data: {
        success: boolean;
        message?: string;
        deletedUserId?: number;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user.");
      }

      setUserList((previous) => previous.filter((user) => user.id !== userId));

      setDeleteUser(null);

      toast.success(data.message || "User deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Feature Catalog-style directory header and filters */}
      <div className="border-b border-[#EAE7EF] px-5 py-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <Users size={20} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#25232C]">
                User Directory
              </h2>
              <p className="mt-0.5 text-[12px] text-[#828A99]">
                Search and manage registered CADGram users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F4F0F9] px-3 py-1.5 text-[12px] font-medium text-[#8065B0]">
              {filteredUsers.length} of {userList.length} users
            </span>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="users-directory-filters"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              <SlidersHorizontal size={16} /> Filters
              {(roleFilter !== "all" || sort !== "newest") && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8065B0] px-1 text-[11px] text-white">
                  {Number(roleFilter !== "all") + Number(sort !== "newest")}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C91AA]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user name, email, role or ID..."
              aria-label="Search users"
              className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] pl-10 pr-10 text-[13px] text-[#25232C] outline-none transition placeholder:text-[#A19AA9] focus:border-[#A88BD3] focus:ring-2 focus:ring-[#F0EBFA]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center text-[#918A99] hover:text-[#25232C]"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] font-medium text-[#44414C] hover:bg-[#F8F6FA]"
            >
              <RotateCcw size={15} /> Reset
            </button>
          )}
        </div>
        {filtersOpen && (
          <div
            id="users-directory-filters"
            className="mt-3 grid gap-3 sm:grid-cols-2"
          >
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              aria-label="Filter users by role"
              className="h-11 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#A88BD3] focus:ring-2 focus:ring-[#F0EBFA]"
            >
              <option value="all">All roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="USER">Regular users</option>
              <option value="VENDOR">Vendors</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              aria-label="Sort users"
              className="h-11 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#A88BD3] focus:ring-2 focus:ring-[#F0EBFA]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </div>
        )}
      </div>

      {filteredUsers.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8F6FB]">
                  <Heading>User</Heading>
                  <Heading>Platform Role</Heading>
                  <Heading>Admin RBAC Role</Heading>
                  <Heading>Registered</Heading>

                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B8394]">
                    Manage Access
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pagedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50/70"
                  >
                    <td className="px-6 py-3.5">
                      <UserIdentity user={user} />
                    </td>

                    <td className="px-6 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-6 py-3.5">
                      <AdminRoleBadge user={user} />
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditUser(user) && (
                          <Link
                            href={`/admin/users/${user.id}`}
                            title="Edit User"
                            aria-label={`Edit ${user.name || user.email}`}
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E5E2EA] bg-white px-3 text-xs font-semibold text-[#424957] transition hover:border-[#BDA9D9] hover:text-[#8065B0]"
                          >Edit
                           <ArrowUpRight size={14} />
                          </Link>
                        )}

                        {canDeleteUser(user) && (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(user)}
                            title="Delete User"
                            aria-label={`Delete ${user.name || user.email}`}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:border-[#EFBFC5] hover:bg-[#FFE6E9]"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {pagedUsers.map((user) => (
              <div key={user.id} className="p-5">
                <div className="flex items-start gap-3">
                  <UserAvatar user={user} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-950">
                      {user.name || "Unnamed User"}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {user.email}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      ID #{user.id}
                    </p>
                  </div>

                  <RoleBadge role={user.role} compact />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoBox
                    label="Registered"
                    value={formatDate(user.createdAt)}
                  />
                  <InfoBox
                    label="Admin RBAC Role"
                    value={
                      user.role === "ADMIN"
                        ? user.adminRole?.name || "Not assigned"
                        : "N/A"
                    }
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {canEditUser(user) && (
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-xs font-medium text-[#44414C] transition hover:border-[#BDA9D9] hover:text-[#8065B0]"
                    >
                      <ArrowUpRight size={14} />
                      Edit User
                    </Link>
                  )}

                  {canDeleteUser(user) && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal(user)}
                      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] px-4 text-xs font-semibold text-[#DC5361] transition hover:bg-[#FFE6E9]"
                    >
                      <Trash2 size={15} />
                      Delete User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          usersExist={userList.length > 0}
          hasFilters={hasFilters}
          onReset={resetFilters}
        />
      )}

      {filteredUsers.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE7EF] px-5 py-4 sm:px-6">
          <span className="text-xs text-[#77717F]">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="min-h-9 cursor-pointer rounded-lg border border-[#E5E2EA] px-3 text-xs font-medium text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-xs font-medium text-[#77717F]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="min-h-9 cursor-pointer rounded-lg border border-[#E5E2EA] px-3 text-xs font-medium text-[#44414C] hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#111827]/50 px-4 py-6 backdrop-blur-[3px]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            aria-describedby="delete-user-description"
            className="w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5D9F5] bg-[#F0EBFA] text-[#8065B0]">
                <AlertTriangle size={26} />
              </span>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Close confirmation"
                className="cursor-pointer rounded-xl p-2 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="delete-user-title"
              className="mt-5 text-xl font-bold text-[#111827]"
            >
              Delete User?
            </h2>

            <p
              id="delete-user-description"
              className="mt-2 text-sm leading-6 text-[#7A8190]"
            >
              Are you sure you want to permanently delete this user? This action
              cannot be undone.
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#F8F6FB] p-4">
              <UserAvatar user={deleteUser} />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {deleteUser.name || "Unnamed User"}
                </p>
                <p className="truncate text-xs text-[#7A8190]">
                  {deleteUser.email}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] p-4">
              <p className="text-xs leading-5 text-red-700">
                This permanently removes the user account. Related data may also
                be affected depending on database relationships.
              </p>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="h-12 flex-1 cursor-pointer rounded-xl border border-[#E5E2EA] text-sm font-semibold text-[#424957] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteUser()}
                disabled={deleting}
                className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B8394]">
      {children}
    </th>
  );
}

function UserAvatar({ user }: { user: User }) {
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-sm font-bold text-[#8065B0]">
      {initial}
    </div>
  );
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar user={user} />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-950">
          {user.name || "Unnamed User"}
        </p>

        <p className="mt-1 max-w-[280px] truncate text-xs text-gray-400">
          {user.email}
        </p>

        <p className="mt-1 text-[11px] text-gray-400">ID #{user.id}</p>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
  compact = false,
}: {
  role: UserRole;
  compact?: boolean;
}) {
  const config = {
    ADMIN: {
      label: compact ? "Admin" : "Administrator",
      icon: ShieldCheck,
      className: "border border-[#DCD0EF] bg-[#F0EBFA] text-[#8065B0]",
    },
    USER: {
      label: "User",
      icon: UserRound,
      className: "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
    },
    VENDOR: {
      label: "Vendor",
      icon: Store,
      className: "border border-[#E5D9F5] bg-[#F5EFFC] text-[#8065B0]",
    },
  };

  const current = config[role];
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold ${
        compact ? "px-2 py-1.5 text-[11px]" : "px-2.5 py-1.5 text-xs"
      } ${current.className}`}
    >
      <Icon size={compact ? 12 : 13} />
      {current.label}
    </span>
  );
}

function AdminRoleBadge({ user }: { user: User }) {
  if (user.role !== "ADMIN") {
    return <span className="text-xs text-gray-400">N/A</span>;
  }

  if (!user.adminRole) {
    return (
      <span className="text-xs font-semibold text-amber-600">Not assigned</span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
        user.adminRole.isSystem
          ? "border border-[#E5D9F5] bg-[#F0EBFA] text-[#8065B0]"
          : "border border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]"
      }`}
    >
      {user.adminRole.isSystem ? (
        <LockKeyhole size={13} />
      ) : (
        <KeyRound size={13} />
      )}
      {user.adminRole.name}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

function EmptyState({
  usersExist,
  hasFilters,
  onReset,
}: {
  usersExist: boolean;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        {usersExist ? <Search size={23} /> : <Users size={24} />}
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {usersExist ? "No matching users" : "No users found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {usersExist
          ? "Try changing your search, role filter or sorting options."
          : "Registered CADGram users will appear here."}
      </p>

      {usersExist && hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 cursor-pointer rounded-xl bg-[#25232C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
