
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import EditUserForm from "@/components/admin/EditUserForm";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUserPage({
  params,
}: EditUserPageProps) {
  // Only authorized admins can edit users.
  const admin = await requireAdminPermission("users.edit");

  const { id } = await params;

  const userId = Number(id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    notFound();
  }

  // Fetch the user being edited.
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      jobTitle: true,
      department: true,
      adminRoleId: true,
      adminRole: {
        select: {
          id: true,
          name: true,
          isSystem: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const canViewUsers =
    admin.adminRole.isSystem ||
    admin.permissions.includes("users.view");

  const canAssignRoles =
    admin.adminRole.isSystem ||
    (admin.permissions.includes("roles.assign") &&
      admin.permissions.includes("roles.view"));

  return (
    <EditUserForm
      user={user}
      currentUserId={admin.userId}
      canViewUsers={canViewUsers}
      canAssignRoles={canAssignRoles}
    />
  );
}
