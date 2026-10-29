
import { requireAdminPermission } from "@/lib/auth-guards";
import NewBrandForm from "@/components/admin/NewBrandForm";

export default async function NewBrandPage() {
  const admin = await requireAdminPermission("brands.create");

  return (
    <NewBrandForm
      canViewBrands={admin.permissions.includes("brands.view")}
    />
  );
}
