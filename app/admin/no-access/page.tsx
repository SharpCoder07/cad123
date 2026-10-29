
import Link from "next/link";
import { ShieldAlert, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminNoAccessPage() {
  await requireAdmin();

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-[#E8EAED] bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#DC0000]">
          <ShieldAlert size={30} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#111827]">
          No Admin Access
        </h1>

        <p className="mt-3 text-sm leading-7 text-gray-500">
          Your administrator account currently has no accessible
          modules. Please contact the Super Admin to update
          your permissions.
        </p>

        <Link
          href="/api/auth/signout"
          className="mt-7 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#333333]"
        >
          <LogOut size={17} />
          Sign Out
        </Link>
      </div>
    </div>
  );
}
