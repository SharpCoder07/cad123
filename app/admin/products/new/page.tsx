import { requireAdminPermission } from "@/lib/auth-guards";
import NewProductForm from "@/components/admin/NewProductForm";

export default async function NewProductPage() {
  // RBAC: Only admins with products.create can access this page.
  await requireAdminPermission("products.create");

  return <NewProductForm />;
}