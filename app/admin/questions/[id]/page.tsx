
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ManageQuestionPage({
  params,
}: PageProps) {
  // RBAC: Only admins with questions.view can access this route.
  await requireAdminPermission("questions.view");

  const { id } = await params;

  // Validate question ID.
  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const questionId = Number(id);

  if (
    !Number.isSafeInteger(questionId) ||
    questionId <= 0
  ) {
    notFound();
  }

  const question = await prisma.productQuestion.findUnique({
    where: {
      id: questionId,
    },
    select: {
      productId: true,
    },
  });

  if (!question) {
    notFound();
  }

  // Preserve existing redirect behavior.
  redirect(`/admin/products/${question.productId}/questions`);
}
