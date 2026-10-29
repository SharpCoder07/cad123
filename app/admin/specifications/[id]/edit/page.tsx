import { requireAdminPermission } from "@/lib/auth-guards";
import EditSpecificationForm from "@/components/admin/EditSpecificationForm";

export default async function EditSpecificationPage() {
  // RBAC: specifications.edit
  const admin = await requireAdminPermission("specifications.edit");

  const canViewSpecifications = admin.permissions.includes(
    "specifications.view",
  );

  return (
    <EditSpecificationForm canViewSpecifications={canViewSpecifications} />
  );
}
