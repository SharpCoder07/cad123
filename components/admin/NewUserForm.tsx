
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  LockKeyhole,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  ShieldCheck,
  UserPlus,
  Save,
} from "lucide-react";

type NewUserFormProps = {
  canViewUsers: boolean;
  canAssignRoles: boolean;
};

type AdminRole = {
  id: number;
  name: string;
  isSystem: boolean;
};

type RolesResponse = {
  success?: boolean;
  message?: string;
  roles?: AdminRole[];
};

export default function NewUserForm({
  canViewUsers,
  canAssignRoles,
}: NewUserFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [adminRoleId, setAdminRoleId] = useState("");

  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [creating, setCreating] = useState(false);

  const usersPath = canViewUsers ? "/admin/users" : "/admin";

  useEffect(() => {
    if (!canAssignRoles) return;

    let cancelled = false;

    async function loadRoles() {
      setRolesLoading(true);
      setRolesError("");

      try {
        const response = await fetch("/api/admin/roles", {
          cache: "no-store",
        });

        const data: RolesResponse = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.roles)) {
          throw new Error(data.message || "Failed to load admin roles.");
        }

        if (!cancelled) {
          setAdminRoles(data.roles);
        }
      } catch (error) {
        if (!cancelled) {
          setRolesError(
            error instanceof Error
              ? error.message
              : "Failed to load admin roles.",
          );
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, [canAssignRoles]);

  const passwordBytes = new TextEncoder().encode(password).length;

  const nameValid = name.trim().length > 0 && name.trim().length <= 100;
  const emailValid =
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8 && passwordBytes <= 72;
  const accessValid = role === "USER" || Boolean(adminRoleId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (creating) return;

    if (!nameValid) {
      toast.error("Name must be between 1 and 100 characters.");
      return;
    }

    if (!emailValid) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!passwordValid) {
      toast.error(
        "Password must be at least 8 characters and at most 72 UTF-8 bytes.",
      );
      return;
    }

    if (role === "ADMIN" && (!canAssignRoles || !adminRoleId)) {
      toast.error("Please select an administrator role.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          adminRoleId: role === "ADMIN" ? Number(adminRoleId) : null,
        }),
      });

      const data: {
        success?: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create user.");
        return;
      }

      toast.success(data.message || "User created successfully.");

      router.push(usersPath);
      router.refresh();
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("Something went wrong while creating the user.");
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292633] outline-none transition placeholder:text-[#A39EAC] focus:border-[#A994CD] focus:ring-2 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#92909A]">
            <Link
              href={usersPath}
              className="cursor-pointer hover:text-gray-900"
            >
              Users
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#44414C]">Add User</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <UserPlus size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add User
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a CADGram account and configure its access.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={usersPath}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            {/* Basic Information */}
            <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
              <div className="border-b border-[#F0EDF4] px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#25232C]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]"><UserPlus size={16} /></span>
                  User Information
                </h2>
                <p className="mt-1 text-[13px] text-[#85808E]">
                  Enter the account holder's basic details.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="user-name"
                    className="text-[13px] font-medium text-[#44414C]"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter full name"
                    disabled={creating}
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="user-email"
                    className="text-[13px] font-medium text-[#44414C]"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="user@example.com"
                    autoComplete="off"
                    disabled={creating}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-[#928D9B]">
                    This email will be used to sign in to CADGram.
                  </p>
                </div>
              </div>
            </section>

            {/* Account Security */}
            <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
              <div className="border-b border-[#F0EDF4] px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#25232C]">
                  <LockKeyhole size={17} className="text-[#8065B0]" />
                  Account Security
                </h2>
                <p className="mt-1 text-[13px] text-[#85808E]">
                  Set an initial password for this account.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <label
                  htmlFor="user-password"
                  className="text-[13px] font-medium text-[#44414C]"
                >
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    disabled={creating}
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={creating}
                    className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-500 hover:text-slate-900 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-[#928D9B]">
                  Use at least 8 characters. Maximum 72 UTF-8 bytes.
                </p>
              </div>
            </section>

            {/* Access & Permissions */}
            <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
              <div className="border-b border-[#F0EDF4] px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#25232C]">
                  <ShieldCheck size={17} className="text-[#8065B0]" />
                  Access & Permissions
                </h2>
                <p className="mt-1 text-[13px] text-[#85808E]">
                  Select the platform role and administrator access.
                </p>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <label
                    htmlFor="user-role"
                    className="text-[13px] font-medium text-[#44414C]"
                  >
                    Platform Role <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="user-role"
                    value={role}
                    onChange={(event) => {
                      setRole(event.target.value as "USER" | "ADMIN");
                      setAdminRoleId("");
                    }}
                    disabled={creating}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="USER">Regular User</option>
                    {canAssignRoles && (
                      <option value="ADMIN">Administrator</option>
                    )}
                  </select>
                </div>

                {role === "ADMIN" && canAssignRoles && (
                  <div>
                    <label
                      htmlFor="admin-role"
                      className="text-[13px] font-medium text-[#44414C]"
                    >
                      Administrator RBAC Role{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {rolesLoading ? (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Loading administrator roles...
                      </div>
                    ) : rolesError ? (
                      <p className="mt-2 text-sm text-red-600">
                        {rolesError}
                      </p>
                    ) : (
                      <select
                        id="admin-role"
                        required
                        value={adminRoleId}
                        onChange={(event) =>
                          setAdminRoleId(event.target.value)
                        }
                        disabled={creating}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select administrator role</option>
                        {adminRoles.map((adminRole) => (
                          <option key={adminRole.id} value={adminRole.id}>
                            {adminRole.name}
                            {adminRole.isSystem ? " (System)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href={usersPath}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  creating ||
                  !nameValid ||
                  !emailValid ||
                  !passwordValid ||
                  !accessValid ||
                  (role === "ADMIN" && (rolesLoading || !!rolesError))
                }
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save User
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-[#25232C]">
                    User Setup
                  </h3>
                  <p className="text-xs text-[#85808E]">
                    Complete the required fields
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Full name", complete: nameValid },
                  { label: "Email address", complete: emailValid },
                  { label: "Password", complete: passwordValid },
                  { label: "Access role", complete: accessValid },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-[#85808E]">
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        item.complete ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {item.complete ? "Complete" : "Required"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#EAE7EF] bg-[#FAF9FC] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0EBFA] text-[#8065B0]">
                  <Info size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-[#25232C]">
                    Account access
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Regular users receive standard account access.
                    Administrators receive permissions based on their
                    assigned RBAC role.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#EAE7EF] bg-white p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#8065B0]"
                />
                <p className="text-xs leading-5 text-[#85808E]">
                  Administrator roles are validated by the server.
                  You cannot assign permissions beyond your own access.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
