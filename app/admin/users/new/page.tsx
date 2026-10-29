import { requireAdminPermission } from "@/lib/auth-guards";
import NewUserForm from "@/components/admin/NewUserForm";

export default async function NewUserPage() {
  const admin = await requireAdminPermission("users.create");

  return (
    <NewUserForm
      canViewUsers={
        admin.adminRole.isSystem ||
        admin.permissions.includes("users.view")
      }
      canAssignRoles={
        admin.adminRole.isSystem ||
        (admin.permissions.includes("roles.assign") &&
          admin.permissions.includes("roles.view"))
      }
    />
  );
}