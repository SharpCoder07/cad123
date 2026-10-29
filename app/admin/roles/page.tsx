"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  KeyRound,
  Loader2,
  LockKeyhole,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

type Role = {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    permissions: number;
  };
};

type RolesResponse = {
  success: boolean;
  roles?: Role[];
  message?: string;
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/roles", {
        method: "GET",
        cache: "no-store",
      });

      const data: RolesResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load roles.");
      }

      setRoles(data.roles ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load roles.";

      setError(message);

      if (silent) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles
      .filter((role) => {
        const matchesSearch =
          !query ||
          role.name.toLowerCase().includes(query) ||
          (role.description ?? "").toLowerCase().includes(query);
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "system" ? role.isSystem : !role.isSystem);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const delta =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sortBy === "newest" ? delta : -delta;
      });
  }, [roles, search, typeFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRoles = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  const hasActiveFilters = Boolean(search.trim()) || activeFilterCount > 0;

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setSortBy("newest");
    setPage(1);
  }

  const stats = useMemo(
    () => ({
      total: roles.length,
      custom: roles.filter((role) => !role.isSystem).length,
      system: roles.filter((role) => role.isSystem).length,
      assigned: roles.reduce((total, role) => total + role._count.users, 0),
    }),
    [roles],
  );

  async function handleDelete() {
    if (!deleteRole || deleting) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/roles/${deleteRole.id}`, {
        method: "DELETE",
      });

      const data: { success: boolean; message?: string } =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete role.");
      }

      setRoles((previous) =>
        previous.filter((role) => role.id !== deleteRole.id),
      );

      toast.success(data.message || "Role deleted successfully.");
      setDeleteRole(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete role.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb and heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Roles & Permissions
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Manage administrative roles and control access across CADGram.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/roles/new"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]"
        >
          <Plus size={17} />
          Add New Role
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Roles",
            value: stats.total,
            icon: Shield,
            detail: "Available admin roles",
            tone: "from-[#F0EBFC] to-[#F8F5FF]",
            iconTone: "bg-[#E6DCF9] text-[#8065B0]",
          },
          {
            label: "Custom Roles",
            value: stats.custom,
            icon: KeyRound,
            detail: "Configurable access",
            tone: "from-[#EAF5FE] to-[#F5FAFF]",
            iconTone: "bg-[#DCEFFD] text-[#548EBB]",
          },
          {
            label: "System Roles",
            value: stats.system,
            icon: LockKeyhole,
            detail: "Protected roles",
            tone: "from-[#FFF0EC] to-[#FFF9F6]",
            iconTone: "bg-[#FFE1D8] text-[#C97B68]",
          },
          {
            label: "Assigned Admins",
            value: stats.assigned,
            icon: Users,
            detail: "Users with assigned roles",
            tone: "from-[#EAF8F0] to-[#F6FCF8]",
            iconTone: "bg-[#D8F0E2] text-[#49996D]",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border border-white/70 bg-gradient-to-br ${stat.tone} p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-[#6E7180]">
                  {stat.label}
                </p>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconTone}`}
                >
                  <Icon size={19} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-2 text-[29px] font-semibold tracking-tight text-[#252632]">
                {loading ? (
                  <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-white/70" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="mt-1 text-xs text-[#888A97]">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Roles table */}
      <div className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
        <div className="border-b border-[#EAE7EF] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <ShieldCheck size={23} />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-[#252632]">
                  Role Library
                </h2>
                <p className="mt-1 text-[13px] text-[#848797]">
                  Search and manage administrative roles and permissions
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F3EFF8] px-3 py-1.5 text-xs font-medium text-[#79688E]">
                {filteredRoles.length} of {roles.length} roles
              </span>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-expanded={filtersOpen}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition ${
                  filtersOpen || activeFilterCount > 0
                    ? "border-[#D8C9EE] bg-[#F5F0FC] text-[#8065B0]"
                    : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"
                }`}
              >
                <SlidersHorizontal size={16} /> Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9271C6] px-1 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A29BAB]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by role name or description..."
                className="h-10 w-full rounded-xl border border-[#E4DFEA] bg-[#FAF9FC] pl-10 pr-4 text-[13px] text-[#252632] outline-none transition placeholder:text-[#A19CA8] focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA]"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
              >
                <RefreshCw size={15} /> Reset
              </button>
            )}
          </div>
          {filtersOpen && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <select
                  id="role-type-filter"
                  aria-label="Filter by role type"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as "all" | "system" | "custom",
                    )
                  }
                  className={`h-10 w-full cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] ${typeFilter !== "all" ? "border-[#BDA7E2] ring-2 ring-[#F0EBFA]" : "border-[#E5E2EA]"}`}
                >
                  <option value="all">All types</option>
                  <option value="system">System roles</option>
                  <option value="custom">Custom roles</option>
                </select>
              </div>
              <div>
                <select
                  id="role-sort"
                  aria-label="Sort roles"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as "newest" | "oldest" | "name",
                    )
                  }
                  className={`h-10 w-full cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#44414C] outline-none focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] ${sortBy !== "newest" ? "border-[#BDA7E2] ring-2 ring-[#F0EBFA]" : "border-[#E5E2EA]"}`}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-[#8065B0]" />
            <p className="text-sm text-[#7A8190]">
              Loading administrative roles...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              <CircleAlert size={25} />
            </span>

            <div>
              <h3 className="font-semibold text-[#111827]">
                Unable to load roles
              </h3>
              <p className="mt-1 text-sm text-[#7A8190]">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void fetchRoles()}
              className="cursor-pointer rounded-xl bg-[#25232C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#403948]"
            >
              Try Again
            </button>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
              <Shield size={30} />
            </span>

            <div>
              <h3 className="font-semibold text-[#111827]">
                {search ? "No matching roles" : "No roles found"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-[#7A8190]">
                {search
                  ? "Try another search term."
                  : "Create your first administrative role to get started."}
              </p>
            </div>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer text-sm font-medium text-[#8065B0] hover:underline"
              >
                Clear Search
              </button>
            ) : (
              <Link
                href="/admin/roles/new"
                className="cursor-pointer rounded-xl bg-[#25232C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#403948]"
              >
                Create Role
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="bg-[#F8F6FC] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#858091]">
                    <th className="px-6 py-4">Role</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Permissions</th>
                    <th className="px-5 py-4">Assigned Users</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0F1F3]">
                  {visibleRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="transition-colors hover:bg-[#FCFAFE]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                            {role.isSystem ? (
                              <LockKeyhole size={19} />
                            ) : (
                              <ShieldCheck size={19} />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="font-semibold text-[#111827]">
                              {role.name}
                            </p>
                            <p className="mt-1 max-w-[250px] truncate text-xs text-[#9298A3]">
                              {role.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        {role.isSystem ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F5DAD9] bg-[#FFF2F0] px-3 py-1.5 text-xs font-medium text-[#B86B68]">
                            <LockKeyhole size={12} />
                            System
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg border border-[#E5E2EA] bg-[#F8F7FA] px-3 py-1.5 text-xs font-medium text-[#77717F]">
                            Custom
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#424957]">
                          <KeyRound size={15} className="text-[#9AA1AC]" />
                          {role._count.permissions}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#424957]">
                          <Users size={15} className="text-[#9AA1AC]" />
                          {role._count.users}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-[#7A8190]">
                        {new Date(role.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {role.isSystem ? (
                            <span
                              title="System roles cannot be modified or deleted"
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F6F8] text-[#9AA1AC]"
                            >
                              <LockKeyhole size={16} />
                            </span>
                          ) : (
                            <>
                              <Link
                                href={`/admin/roles/${role.id}/edit`}
                                title={`Edit ${role.name}`}
                                aria-label={`Edit ${role.name}`}
                               className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#44414C] transition hover:border-[#D5CBE0] hover:bg-[#F8F6FA]"
                              >Edit
                                <ArrowUpRight size={14} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setDeleteRole(role)}
                                disabled={role._count.users > 0}
                                title={
                                  role._count.users > 0
                                    ? "Reassign users before deleting"
                                    : `Delete ${role.name}`
                                }
                                aria-label={`Delete ${role.name}`}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE5E9] disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEEF1] px-6 py-4">
              <p className="text-xs text-[#9298A3]">
                Showing{" "}
                {filteredRoles.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
                –{Math.min(currentPage * pageSize, filteredRoles.length)} of{" "}
                {filteredRoles.length} roles
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void fetchRoles(true)}
                  disabled={loading || refreshing}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#77717F] hover:text-[#8065B0] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh roles"
                >
                  <RefreshCw
                    size={13}
                    className={refreshing ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
                <p className="hidden items-center gap-1.5 text-xs text-[#9298A3] sm:flex">
                  <LockKeyhole size={13} /> System roles are protected
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer rounded-lg border border-[#E5E2EA] px-3 py-1.5 text-xs text-[#44414C] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#77717F]">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="cursor-pointer rounded-lg border border-[#E5E2EA] px-3 py-1.5 text-xs text-[#44414C] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
          <ShieldCheck size={20} />
        </span>

        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            About Role-Based Access Control
          </h3>
          <p className="mt-1 text-xs leading-6 text-[#7A8190]">
            Each administrative role contains a set of permissions that
            determines which CADGram modules and actions are accessible. System
            roles are protected, and custom roles assigned to users must be
            reassigned before deletion.
          </p>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/50 px-4 backdrop-blur-[3px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-role-title"
            className="w-full max-w-[440px] rounded-[20px] border border-[#EAE7EF] bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#DC0000]">
                <Trash2 size={23} />
              </span>

              <button
                type="button"
                onClick={() => setDeleteRole(null)}
                disabled={deleting}
                aria-label="Close dialog"
                className="cursor-pointer rounded-lg p-2 text-[#9298A3] hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="delete-role-title"
              className="text-xl font-bold text-[#111827]"
            >
              Delete Role?
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#7A8190]">
              Are you sure you want to delete{" "}
              <strong className="text-[#111827]">{deleteRole.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteRole(null)}
                disabled={deleting}
                className="flex-1 cursor-pointer rounded-xl border border-[#E8EAED] px-4 py-3 text-sm font-semibold text-[#424957] hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC0000] px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
