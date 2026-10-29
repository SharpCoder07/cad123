
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  LockKeyhole,
  Save,
  Search,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";

type Permission = {
  id: number;
  module: string;
  action: string;
  key: string;
};

type PermissionsResponse = {
  success: boolean;
  permissions?: Permission[];
  message?: string;
};

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function AddRolePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/permissions", {
        cache: "no-store",
      });

      const data: PermissionsResponse = await response.json();

      if (!response.ok || !data.success || !data.permissions) {
        throw new Error(data.message || "Failed to load permissions.");
      }

      setPermissions(data.permissions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load permissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    for (const permission of permissions) {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }

      groups[permission.module].push(permission);
    }

    return Object.entries(groups);
  }, [permissions]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return groupedPermissions;

    return groupedPermissions
      .map(([module, items]) => {
        const moduleMatches = formatLabel(module)
          .toLowerCase()
          .includes(query);

        return [
          module,
          moduleMatches
            ? items
            : items.filter(
                (item) =>
                  item.action.toLowerCase().includes(query) ||
                  item.key.toLowerCase().includes(query),
              ),
        ] as const;
      })
      .filter(([, items]) => items.length > 0);
  }, [groupedPermissions, search]);

  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  function togglePermission(id: number) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function toggleModule(items: Permission[]) {
    const ids = items.map((item) => item.id);

    setSelectedIds((previous) => {
      const selected = new Set(previous);
      const allSelected = ids.every((id) => selected.has(id));

      if (allSelected) {
        ids.forEach((id) => selected.delete(id));
      } else {
        ids.forEach((id) => selected.add(id));
      }

      return [...selected];
    });
  }

  function selectAll() {
    setSelectedIds(permissions.map((item) => item.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

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
      const response = await fetch("/api/admin/roles", {
        method: "POST",
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
        throw new Error(data.message || "Failed to create role.");
      }

      toast.success(data.message || "Role created successfully.");
      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create role.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9298A3]">
          <Link
            href="/admin/roles"
            className="cursor-pointer transition hover:text-gray-900"
          >
            Roles & Permissions
          </Link>
          <ChevronRight size={14} />
          <span className="text-[#424957]">Add New Role</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <ShieldCheck size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add New Role
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create an administrative role and configure its access.
              </p>
            </div>
          </div>
          <Link href="/admin/roles" className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
            <ArrowLeft size={16} /> Back to Roles
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role details */}
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
                Basic details of the new role
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
                placeholder="e.g. Product Manager"
                className="h-12 w-full rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] px-4 text-sm outline-none transition focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA]"
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
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this role can manage..."
                className="w-full resize-y rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] px-4 py-3 text-sm outline-none transition focus:border-[#B7A3D8] focus:ring-2 focus:ring-[#F0EBFA]"
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
                    Choose the actions this role can perform
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
                  className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FAF9FC] pl-10 pr-4 text-sm outline-none focus:border-[#DC0000]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={loading || !!error}
                  className="cursor-pointer text-sm font-semibold text-[#8065B0] hover:underline disabled:opacity-40"
                >
                  Select All
                </button>

                <span className="text-[#D1D5DB]">|</span>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={loading || !!error}
                  className="cursor-pointer text-sm font-semibold text-[#626B78] hover:underline disabled:opacity-40"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm text-[#7A8190]">
              <Loader2
                size={22}
                className="animate-spin text-[#8065B0]"
              />
              Loading permissions...
            </div>
          ) : error ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={() => void loadPermissions()}
                className="cursor-pointer rounded-xl bg-[#25232C] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#403948]"
              >
                Retry
              </button>
            </div>
          ) : visibleGroups.length === 0 ? (
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
                          className="h-4 w-4 cursor-pointer accent-[#8065B0]"
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
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                              checked
                                ? "border-[#D8C9EE] bg-[#F0EBFA] text-[#8065B0]"
                                : "border-[#F0EDF4] bg-white text-[#626B78] hover:bg-[#FAF8FD]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                togglePermission(permission.id)
                              }
                              className="h-4 w-4 shrink-0 cursor-pointer accent-[#8065B0]"
                            />

                            <span className="truncate capitalize">
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
            className="mt-0.5 shrink-0 text-[#8065B0]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Access Summary
            </h3>

            <p className="mt-1 text-xs leading-6 text-[#7A8190]">
              This role will have access to{" "}
              <strong className="text-[#111827]">
                {selectedIds.length} permissions
              </strong>{" "}
              across{" "}
              <strong className="text-[#111827]">
                {
                  groupedPermissions.filter(([, items]) =>
                    items.some((item) => selectedSet.has(item.id)),
                  ).length
                }{" "}
                modules
              </strong>
              . Access will take effect when the role is assigned to
              an administrator.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4">
          <Link
            href="/admin/roles"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#EAE7EF] bg-white px-6 text-[13px] font-medium text-[#44414C] hover:bg-[#F5F6F8]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || loading || !!error}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Creating Role..." : "Save Role"}
          </button>
        </div>
      </form>
    </div>
  );
}
