import { requireAdminPermission } from "@/lib/auth-guards";
import NewFeatureForm from "@/components/admin/NewFeatureForm";

export default async function NewFeaturePage() {
  const admin = await requireAdminPermission("features.create");

  const canViewFeatures = admin.permissions.includes("features.view");

  return <NewFeatureForm canViewFeatures={canViewFeatures} />;
}
