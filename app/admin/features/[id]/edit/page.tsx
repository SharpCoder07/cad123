import { requireAdminPermission } from "@/lib/auth-guards";
import EditFeatureForm from "@/components/admin/EditFeatureForm";

export default async function EditFeaturePage() {
  // RBAC: features.edit
  const admin = await requireAdminPermission("features.edit");

  const canViewFeatures = admin.permissions.includes("features.view");

  return <EditFeatureForm canViewFeatures={canViewFeatures} />;
}
