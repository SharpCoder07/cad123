
import { requireAdminPermission } from "@/lib/auth-guards";
import EditBrandForm from "@/components/admin/EditBrandForm";

export default async function EditBrandPage() {
  // RBAC: Only admins with brands.edit can access this page.
  const admin = await requireAdminPermission("brands.edit");

  return (
    <EditBrandForm
      canViewBrands={admin.permissions.includes("brands.view")}
    />
  );
}
