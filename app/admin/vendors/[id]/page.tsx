import { requireAdminPermission } from "@/lib/auth-guards";
import VendorManageForm from "@/components/admin/VendorManageForm";

export default async function VendorManagePage() {
  const admin = await requireAdminPermission("vendors.edit");

  return (
    <VendorManageForm
      canEditProducts={admin.permissions.includes("products.edit")}
    />
  );
}