
import { requireAdmin } from "@/lib/auth-guards";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  const userName =
    admin.user.name || admin.user.email || "Admin";

  return (
    <AdminShell
      userName={userName}
      permissions={admin.permissions}
      adminRoleName={admin.adminRole.name}
    >
      {children}
    </AdminShell>
  );
}
