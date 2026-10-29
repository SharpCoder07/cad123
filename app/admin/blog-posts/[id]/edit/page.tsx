import { requireAdminPermission } from "@/lib/auth-guards";
import EditBlogPostForm from "@/components/admin/EditBlogPostForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBlogPostPage({ params }: Props) {
  // RBAC: Only admins with edit permission can access.
  const admin = await requireAdminPermission("blog_posts.edit");

  const { id } = await params;

  // RBAC: Publishing permission is independent.
  const canPublish = admin.permissions.includes("blog_posts.publish");

  return <EditBlogPostForm postId={id} canPublish={canPublish} />;
}
