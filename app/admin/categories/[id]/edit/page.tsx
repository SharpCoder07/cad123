import { requireAdminPermission } from "@/lib/auth-guards";
import EditCategoryForm from "@/components/admin/EditCategoryForm";

export default async function EditCategoryPage() {
  const admin = await requireAdminPermission("categories.edit");

  return (
    <EditCategoryForm
      canViewCategories={admin.permissions.includes("categories.view")}
    />
  );
}
