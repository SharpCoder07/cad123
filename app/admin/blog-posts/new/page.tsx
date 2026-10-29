import { requireAdminPermission } from "@/lib/auth-guards";
import NewBlogPostForm from "@/components/admin/NewBlogPostForm";

export default async function NewBlogPostPage() {
  // RBAC: Only admins with create permission can access this page.
  const admin = await requireAdminPermission("blog_posts.create");

  // RBAC: Publishing is controlled independently.
  const canPublish = admin.permissions.includes("blog_posts.publish");

  return <NewBlogPostForm canPublish={canPublish} />;
}
