
import { requireAdminPermission } from "@/lib/auth-guards";
import NewSpecificationForm from "@/components/admin/NewSpecificationForm";

export default async function NewSpecificationPage() {
  // RBAC: specifications.create
  const admin = await requireAdminPermission(
    "specifications.create"
  );

  const canViewSpecifications = admin.permissions.includes(
    "specifications.view"
  );

  return (
    <NewSpecificationForm
      canViewSpecifications={canViewSpecifications}
    />
  );
}
