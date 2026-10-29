import { requireAdminPermission } from "@/lib/auth-guards";
import NewVendorForm from "@/components/admin/NewVendorForm";

export default async function NewVendorPage() {
  const admin = await requireAdminPermission("vendors.create");

  return (
    <NewVendorForm
      canViewVendors={admin.permissions.includes("vendors.view")}
      canEditVendors={admin.permissions.includes("vendors.edit")}
    />
  );
}
