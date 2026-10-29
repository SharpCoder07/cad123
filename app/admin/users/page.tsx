import Link from "next/link";
import {
  ChevronRight,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  // RBAC: Only admins with users.view can access this page.
  const admin = await requireAdminPermission("users.view");

  // Action-level permissions.
  const canAssignRoles =
    admin.adminRole.isSystem ||
    (admin.permissions.includes("roles.assign") &&
      admin.permissions.includes("roles.view"));

  const canCreateUsers =
    admin.adminRole.isSystem || admin.permissions.includes("users.create");

  const canDeleteUsers =
    admin.adminRole.isSystem || admin.permissions.includes("users.delete");

  // Fetch users.
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminRoleId: true,
      adminRole: {
        select: {
          id: true,
          name: true,
          isSystem: true,
        },
      },
      createdAt: true,
    },
  });

  // Convert dates for the client component.
  const formattedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  // Statistics.
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const regularUserCount = users.filter((user) => user.role === "USER").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Users
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Manage registered CADGram users and their roles.
              </p>
            </div>
          </div>
        </div>
        {canCreateUsers && (
          <Link
            href="/admin/users/new"
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] sm:self-auto"
          >
            <Plus size={17} strokeWidth={1.9} />
            Add User
          </Link>
        )}
      </section>

      <section
        aria-label="User statistics"
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="min-h-[146px] rounded-[21px] border border-[#E8E2F4] bg-gradient-to-br from-[#F5F0FE] to-[#FBF9FF] p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#716384]">
              Total Users
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 text-[#8968B9]">
              <Users size={18} strokeWidth={1.8} />
            </span>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#292334]">
            {users.length}
          </p>
          <p className="mt-2 text-[12px] text-[#8B8199]">Registered accounts</p>
        </div>
        <div className="min-h-[146px] rounded-[21px] border border-[#DCEDE4] bg-gradient-to-br from-[#EDF9F2] to-[#FAFDFB] p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#577C68]">
              Administrators
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 text-[#46996D]">
              <ShieldCheck size={18} strokeWidth={1.8} />
            </span>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#253D30]">
            {adminCount}
          </p>
          <p className="mt-2 text-[12px] text-[#7D9A88]">
            Users with admin access
          </p>
        </div>
        <div className="min-h-[146px] rounded-[21px] border border-[#E3E8FA] bg-gradient-to-br from-[#EFF3FF] to-[#FAFBFF] p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#63749A]">
              Regular Users
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 text-[#6B87C7]">
              <UserRound size={18} strokeWidth={1.8} />
            </span>
          </div>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#29354E]">
            {regularUserCount}
          </p>
          <p className="mt-2 text-[12px] text-[#8996B2]">
            Standard user accounts
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
        <UsersTable
          users={formattedUsers}
          currentUserId={admin.userId}
          canAssignRoles={canAssignRoles}
          canEditUsers={
            admin.adminRole.isSystem || admin.permissions.includes("users.edit")
          }
          canDeleteUsers={canDeleteUsers}
          isSystemAdmin={admin.adminRole.isSystem}
        />
      </section>
    </div>
  );
}
