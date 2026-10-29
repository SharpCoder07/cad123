
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  KeyRound,
  Loader2,
  LockKeyhole,
  Save,
  Search,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import { toast } from "react-toastify";

type Permission = {
  id: number;
  module: string;
  action: string;
  key: string;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: {
    id: number;
    permissionId: number;
    permission: Permission;
  }[];
  _count: {
    users: number;
  };
};

type PermissionResponse = {
  success: boolean;
  permissions?: Permission[];
  message?: string;
};

type RoleResponse = {
  success: boolean;
  role?: Role;
  message?: string;
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roleId = params.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [roleResponse, permissionsResponse] =
        await Promise.all([
          fetch(`/api/admin/roles/${roleId}`, {
            cache: "no-store",
          }),
          fetch("/api/admin/permissions", {
            cache: "no-store",
          }),
        ]);

      const roleData: RoleResponse = await roleResponse.json();
      const permissionsData: PermissionResponse =
        await permissionsResponse.json();

      if (!roleResponse.ok || !roleData.success || !roleData.role) {
        throw new Error(roleData.message || "Failed to load role.");
      }

      if (
        !permissionsResponse.ok ||
        !permissionsData.success ||
        !permissionsData.permissions
      ) {
        throw new Error(
          permissionsData.message || "Failed to load permissions.",
        );
      }

      const existingRole = roleData.role;

      setRole(existingRole);
      setName(existingRole.name);
      setDescription(existingRole.description || "");
      setPermissions(permissionsData.permissions);
      setSelectedIds(
        existingRole.permissions.map((item) => item.permissionId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load role.",
      );
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }

      groups[permission.module].push(permission);
    });

    return Object.entries(groups);
  }, [permissions]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return groupedPermissions;

    return groupedPermissions
      .map(([module, items]) => {
        const matchesModule = formatLabel(module)
          .toLowerCase()
          .includes(query);

        return [
          module,
          matchesModule
            ? items
            : items.filter(
                (permission) =>
                  permission.action.toLowerCase().includes(query) ||
                  permission.key.toLowerCase().includes(query),
              ),
        ] as const;
      })
      .filter(([, items]) => items.length > 0);
  }, [groupedPermissions, search]);

  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  const selectedModuleCount = useMemo(
    () =>
      groupedPermissions.filter(([, items]) =>
        items.some((item) => selectedSet.has(item.id)),
      ).length,
    [groupedPermissions, selectedSet],
  );

  const isProtected = role?.isSystem ?? false;

  function togglePermission(id: number) {
    if (isProtected) return;

    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function toggleModule(items: Permission[]) {
    if (isProtected) return;

    const ids = items.map((item) => item.id);

    setSelectedIds((previous) => {
      const next = new Set(previous);
      const allSelected = ids.every((id) => next.has(id));

      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }

      return [...next];
    });
  }

  function selectAll() {
    if (isProtected) return;
    setSelectedIds(permissions.map((permission) => permission.id));
  }

  function clearAll() {
    if (isProtected) return;
    setSelectedIds([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || isProtected || !role) return;

    if (!name.trim()) {
      toast.error("Role name is required.");
      return;
    }

    if (name.trim().length > 100) {
      toast.error("Role name cannot exceed 100 characters.");
      return;
    }

    if (description.trim().length > 500) {
      toast.error("Description cannot exceed 500 characters.");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Select at least one permission.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          permissionIds: selectedIds,
        }),
      });

      const data: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update role.");
      }

      toast.success(data.message || "Role updated successfully.");

      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3">
        <Loader2
          size={30}
          className="animate-spin text-[#8065B0]"
        />
        <p className="text-sm text-[#7A8190]">
          Loading role information...
        </p>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="rounded-[24px] border border-[#EAE7EF] bg-white px-6 py-16 text-center">
        <CircleAlert
          size={36}
          className="mx-auto mb-4 text-[#8065B0]"
        />

        <h2 className="text-xl font-bold text-[#111827]">
          Unable to Load Role
        </h2>

        <p className="mt-2 text-sm text-[#7A8190]">
          {error || "Role not found."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/admin/roles"
            className="rounded-xl border border-[#EAE7EF] px-5 py-3 text-sm font-semibold"
          >
            Back to Roles
          </Link>

          <button
            type="button"
            onClick={() => void loadData()}
            className="cursor-pointer rounded-xl bg-[#25232C] px-5 py-3 text-[13px] font-medium text-white hover:bg-[#403948]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9298A3]">
          <Link
            href="/admin/roles"
            className="cursor-pointer hover:text-[#8065B0]"
          >
            Roles & Permissions
          </Link>

          <ChevronRight size={14} />

          <span className="text-[#424957]">Edit Role</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <ShieldCheck size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit Role
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Update role information and assigned permissions.
              </p>
            </div>
          </div>
          <Link href="/admin/roles" className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
            <ArrowLeft size={16} /> Back to Roles
          </Link>
        </div>
      </div>

      {isProtected && (
        <div className="flex items-start gap-3 rounded-[20px] border border-red-100 bg-[#F0EBFA] p-5">
          <LockKeyhole
            size={21}
            className="mt-0.5 shrink-0 text-[#8065B0]"
          />

          <div>
            <h3 className="text-sm font-bold text-[#8065B0]">
              Protected System Role
            </h3>

            <p className="mt-1 text-xs leading-6 text-[#7A8190]">
              This is a system-managed role. Its information and
              permissions cannot be modified.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Information */}
        <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
              <ShieldCheck size={21} />
            </span>

            <div>
              <h2 className="text-[17px] font-semibold text-[#252632]">
                Role Information
              </h2>

              <p className="text-[13px] text-[#848797]">
                Edit the role name and description
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div>
              <label
                htmlFor="role-name"
                className="mb-2 block text-[13px] font-medium text-[#44414C]"
              >
                Role Name <span className="text-[#8065B0]">*</span>
              </label>

              <input
                id="role-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isProtected}
                className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] px-4 text-sm outline-none transition focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="role-description"
                className="mb-2 block text-[13px] font-medium text-[#44414C]"
              >
                Description
              </label>

              <textarea
                id="role-description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                disabled={isProtected}
                className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] px-4 py-3 text-sm outline-none transition focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 text-right text-[13px] text-[#848797]">
                {description.length}/500
              </p>
            </div>
          </div>
        </section>

        {/* Permissions */}
        <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
          <div className="border-b border-[#F0EDF4] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <KeyRound size={21} />
                </span>

                <div>
                  <h2 className="text-[17px] font-semibold text-[#252632]">
                    Module Permissions
                  </h2>

                  <p className="mt-1 text-[13px] text-[#848797]">
                    Configure the actions allowed for this role
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-[#E9E4F0] bg-[#F8F6FC] px-3 py-1.5 text-xs font-medium text-[#71677F]">
                {selectedIds.length} / {permissions.length} Selected
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[420px]">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA1AC]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search modules or actions..."
                  className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] pl-10 pr-4 text-sm outline-none focus:border-[#B7A3D8]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={isProtected}
                  className="cursor-pointer text-sm font-semibold text-[#8065B0] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Select All
                </button>

                <span className="text-[#D1D5DB]">|</span>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={isProtected}
                  className="cursor-pointer text-sm font-semibold text-[#626B78] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {visibleGroups.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#9298A3]">
              No matching permissions found.
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
              {visibleGroups.map(([module, items]) => {
                const allSelected = items.every((item) =>
                  selectedSet.has(item.id),
                );

                const selectedCount = items.filter((item) =>
                  selectedSet.has(item.id),
                ).length;

                return (
                  <div
                    key={module}
                    className="overflow-hidden rounded-2xl border border-[#EAE7EF]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[#F0EDF4] bg-[#F8F6FC] px-4 py-4">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleModule(items)}
                          disabled={isProtected}
                          className="h-4 w-4 cursor-pointer accent-[#8065B0] disabled:cursor-not-allowed"
                        />

                        <span className="text-sm font-bold text-[#111827]">
                          {formatLabel(module)}
                        </span>
                      </label>

                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#7A8190]">
                        {selectedCount}/{items.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                      {items.map((permission) => {
                        const checked = selectedSet.has(permission.id);

                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                              checked
                                ? "border-[#D8C9EE] bg-[#F0EBFA] text-[#8065B0]"
                                : "border-[#F0EDF4] bg-white text-[#626B78]"
                            } ${
                              isProtected
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                togglePermission(permission.id)
                              }
                              disabled={isProtected}
                              className="h-4 w-4 shrink-0 cursor-pointer accent-[#8065B0] disabled:cursor-not-allowed"
                            />

                            <span className="truncate">
                              {formatLabel(permission.action)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Summary */}
        <div className="flex items-start gap-3 rounded-[20px] border border-[#EAE7EF] bg-[#FBFAFD] p-5">
          <LockKeyhole
            size={20}
            className="mt-0.5 shrink-0 text-[#626B78]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Access Summary
            </h3>

            <p className="mt-1 text-xs leading-6 text-[#7A8190]">
              <strong className="text-[#111827]">
                {role.name}
              </strong>{" "}
              has{" "}
              <strong className="text-[#111827]">
                {selectedIds.length} permissions
              </strong>{" "}
              selected across{" "}
              <strong className="text-[#111827]">
                {selectedModuleCount} modules
              </strong>
              . This role is currently assigned to{" "}
              <strong className="text-[#111827]">
                {role._count.users} administrator(s)
              </strong>
              .
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4">
          <Link
            href="/admin/roles"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#EAE7EF] bg-white px-6 text-[13px] font-medium text-[#44414C] hover:bg-[#F5F6F8]"
          >
            {isProtected ? "Back to Roles" : "Cancel"}
          </Link>

          {!isProtected && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
