import { requireAdminPermission } from "@/lib/auth-guards";
import NewCategoryForm from "@/components/admin/NewCategoryForm";

export default async function NewCategoryPage() {
  const admin = await requireAdminPermission("categories.create");

  return (
    <NewCategoryForm
      canViewCategories={admin.permissions.includes("categories.view")}
    />
  );
}
