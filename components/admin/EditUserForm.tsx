"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Save,
  ShieldCheck,
  UserRound,
  Pencil,
  Mail,
  ListChecks,
} from "lucide-react";

type PlatformRole = "USER" | "ADMIN" | "VENDOR";

type AdminRole = {
  id: number;
  name: string;
  isSystem: boolean;
};

type EditableUser = {
  id: number;
  name: string | null;
  email: string;
  role: PlatformRole;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  adminRoleId: number | null;
  adminRole: AdminRole | null;
};

type EditUserFormProps = {
  user: EditableUser;
  currentUserId: number;
  canViewUsers: boolean;
  canAssignRoles: boolean;
};

type RolesResponse = {
  success?: boolean;
  message?: string;
  roles?: AdminRole[];
};

export default function EditUserForm({
  user,
  currentUserId,
  canViewUsers,
  canAssignRoles,
}: EditUserFormProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [department, setDepartment] = useState(
    user.department ?? "",
  );

  const [role, setRole] = useState<PlatformRole>(user.role);
  const [adminRoleId, setAdminRoleId] = useState(
    user.adminRoleId?.toString() ?? "",
  );

  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const [saving, setSaving] = useState(false);

  const usersPath = canViewUsers ? "/admin/users" : "/admin";
  const isSelf = user.id === currentUserId;
  const isVendor = user.role === "VENDOR";
  const canEditAccess = canAssignRoles && !isSelf && !isVendor;

  useEffect(() => {
    if (!canEditAccess) return;

    let active = true;

    async function loadRoles() {
      setRolesLoading(true);
      setRolesError("");

      try {
        const response = await fetch("/api/admin/roles", {
          cache: "no-store",
        });

        const data: RolesResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ?? "Failed to load admin roles.",
          );
        }

        if (active) {
          setAdminRoles(data.roles ?? []);
        }
      } catch (error) {
        if (active) {
          setRolesError(
            error instanceof Error
              ? error.message
              : "Unable to load admin roles.",
          );
        }
      } finally {
        if (active) {
          setRolesLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      active = false;
    };
  }, [canEditAccess]);

  const validName =
    name.trim().length >= 1 && name.trim().length <= 100;

  const validEmail =
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const profileChanged =
    name.trim() !== (user.name ?? "") ||
    email.trim().toLowerCase() !== user.email.toLowerCase() ||
    phone.trim() !== (user.phone ?? "") ||
    jobTitle.trim() !== (user.jobTitle ?? "") ||
    department.trim() !== (user.department ?? "");

  const accessChanged =
    canEditAccess &&
    (role !== user.role ||
      (role === "ADMIN" &&
        adminRoleId !== (user.adminRoleId?.toString() ?? "")));

  const hasChanges = profileChanged || accessChanged;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    if (!validName) {
      toast.error("Name must contain 1 to 100 characters.");
      return;
    }

    if (!validEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (phone.trim().length > 20) {
      toast.error("Phone number cannot exceed 20 characters.");
      return;
    }

    if (jobTitle.trim().length > 100) {
      toast.error("Job title cannot exceed 100 characters.");
      return;
    }

    if (department.trim().length > 100) {
      toast.error("Department cannot exceed 100 characters.");
      return;
    }

    if (accessChanged && role === "ADMIN" && !adminRoleId) {
      toast.error("Please select an administrator role.");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        department: department.trim() || null,
        ...(accessChanged
          ? {
              role,
              adminRoleId:
                role === "ADMIN" ? Number(adminRoleId) : null,
            }
          : {}),
      };

      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "Failed to update user.",
        );
      }

      toast.success(
        data.message ?? "User updated successfully.",
      );

      router.push(usersPath);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the user.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#92909C]">
          <Link
            href={usersPath}
            className="cursor-pointer hover:text-gray-900"
          >
            Users
          </Link>
          <ChevronRight size={15} />
          <span className="text-gray-900">Edit User</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <UserRound size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Edit User
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Update account information and access permissions.
              </p>
            </div>
          </div>

          <Link
            href={usersPath}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
          >
            <ArrowLeft size={17} />
            Back to Users
          </Link>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="space-y-5">
          {/* Personal Information */}
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]"><UserRound size={16} /></span>
                <h2 className="text-[15px] font-semibold text-[#252631]">Personal Information</h2>
              </div>
              <p className="mt-1 text-[13px] text-[#858391]">
                Manage the user's basic account details.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label
                  htmlFor="edit-user-name"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Full Name *
                </label>
                <input
                  id="edit-user-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  required
                  className="min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition placeholder:text-[#AAA6B0] focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA]"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-email"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Email Address *
                </label>
                <input
                  id="edit-user-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  maxLength={254}
                  required
                  className="min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition placeholder:text-[#AAA6B0] focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA]"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-phone"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Phone Number
                </label>
                <input
                  id="edit-user-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  maxLength={20}
                  className="min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition placeholder:text-[#AAA6B0] focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA]"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-job-title"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Job Title
                </label>
                <input
                  id="edit-user-job-title"
                  value={jobTitle}
                  onChange={(event) =>
                    setJobTitle(event.target.value)
                  }
                  maxLength={100}
                  className="min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition placeholder:text-[#AAA6B0] focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA]"
                  placeholder="Enter job title"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-user-department"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Department
                </label>
                <input
                  id="edit-user-department"
                  value={department}
                  onChange={(event) =>
                    setDepartment(event.target.value)
                  }
                  maxLength={100}
                  className="min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition placeholder:text-[#AAA6B0] focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA]"
                  placeholder="Enter department"
                />
              </div>
            </div>
          </section>

          {/* Access & Permissions */}
          <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]"><ShieldCheck size={16} /></span>
                <h2 className="text-[15px] font-semibold text-[#252631]">
                  Access & Permissions
                </h2>
              </div>

              <p className="mt-1 text-[13px] text-[#858391]">
                Review or update the user's platform access.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="edit-user-role"
                  className="mb-2 block text-[13px] font-medium text-[#494651]"
                >
                  Platform Role
                </label>

                <select
                  id="edit-user-role"
                  value={role}
                  onChange={(event) => {
                    const nextRole = event.target
                      .value as PlatformRole;
                    setRole(nextRole);

                    if (nextRole !== "ADMIN") {
                      setAdminRoleId("");
                    } else if (user.role === "ADMIN") {
                      setAdminRoleId(
                        user.adminRoleId?.toString() ?? "",
                      );
                    }
                  }}
                  disabled={!canEditAccess}
                  className="min-h-11 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]"
                >
                  <option value="USER">Regular User</option>
                  <option value="ADMIN">Administrator</option>
                  {isVendor && (
                    <option value="VENDOR">Vendor</option>
                  )}
                </select>
              </div>

              {role === "ADMIN" && (
                <div>
                  <label
                    htmlFor="edit-user-admin-role"
                    className="mb-2 block text-[13px] font-medium text-[#494651]"
                  >
                    Administrator Role *
                  </label>

                  {canEditAccess ? (
                    <select
                      id="edit-user-admin-role"
                      value={adminRoleId}
                      onChange={(event) =>
                        setAdminRoleId(event.target.value)
                      }
                      disabled={rolesLoading}
                      className="min-h-11 w-full cursor-pointer rounded-xl border border-[#E5E2EA] bg-white px-4 py-2.5 text-[13px] text-[#252631] outline-none transition focus:border-[#A88DCB] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]"
                    >
                      <option value="">
                        {rolesLoading
                          ? "Loading roles..."
                          : "Select administrator role"}
                      </option>

                      {adminRoles.map((adminRole) => (
                        <option
                          key={adminRole.id}
                          value={adminRole.id}
                        >
                          {adminRole.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-[#E5E2EA] bg-[#F8F7FA] px-4 py-3 text-[13px] text-[#77717F]">
                      {user.adminRole?.name ??
                        "No administrator role assigned"}
                    </div>
                  )}

                  {rolesError && (
                    <p className="mt-2 text-xs text-red-600">
                      {rolesError}
                    </p>
                  )}
                </div>
              )}

              {!canEditAccess && (
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />
                  <p className="text-sm text-slate-600">
                    {isSelf
                      ? "You cannot change your own access role."
                      : isVendor
                        ? "Vendor access must be managed through the Vendors module."
                        : "You do not have permission to modify this user's access role."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={usersPath}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]"><Mail size={16} /></span><h3 className="text-[15px] font-semibold text-[#252631]">User Overview</h3></div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  User ID
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  #{user.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Current Role
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {user.role === "ADMIN"
                    ? user.adminRole?.name ?? "Administrator"
                    : user.role === "VENDOR"
                      ? "Vendor"
                      : "Regular User"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Account Email
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                  {user.email}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#EAE7EF] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]"><ListChecks size={16} /></span><h3 className="text-[15px] font-semibold text-[#252631]">Update Checklist</h3></div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={19}
                  className={
                    validName
                      ? "text-green-600"
                      : "text-slate-300"
                  }
                />
                <span className="text-sm text-slate-600">
                  Valid full name
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={19}
                  className={
                    validEmail
                      ? "text-green-600"
                      : "text-slate-300"
                  }
                />
                <span className="text-sm text-slate-600">
                  Valid email address
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={19}
                  className={
                    hasChanges
                      ? "text-green-600"
                      : "text-slate-300"
                  }
                />
                <span className="text-sm text-slate-600">
                  Changes ready to save
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#E8E0F4] bg-[#F8F5FD] p-5">
            <div className="flex gap-3">
              <Info
                size={18}
                className="mt-0.5 shrink-0 text-[#8065B0]"
              />

              <div>
                <h3 className="text-sm font-semibold text-[#493B61]">
                  Access Security
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#76678B]">
                  Role changes require additional permissions.
                  Your backend must also enforce these rules
                  before saving any changes.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
