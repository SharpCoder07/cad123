import { requireAdminPermission } from "@/lib/auth-guards";
import EditProductForm from "@/components/admin/EditProductForm";

export default async function EditProductPage() {
  const admin = await requireAdminPermission("products.edit");

  const canApprove = admin.permissions.includes("products.approve");

  return <EditProductForm canApprove={canApprove} />;
}
