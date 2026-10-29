import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import NewProductAnswerForm from "@/components/admin/NewProductAnswerForm";

type PageProps = {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
};

function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default async function NewProductAnswerPage({ params }: PageProps) {
  // RBAC: questions.answer
  const admin = await requireAdminPermission("questions.answer");

  const { id, questionId } = await params;

  const productId = parseId(id);
  const parsedQuestionId = parseId(questionId);

  if (productId === null || parsedQuestionId === null) {
    notFound();
  }

  // Verify that the question belongs to this product.
  const question = await prisma.productQuestion.findFirst({
    where: {
      id: parsedQuestionId,
      productId,
    },
    select: {
      id: true,
    },
  });

  if (!question) {
    notFound();
  }

  return (
    <NewProductAnswerForm
      productId={productId}
      questionId={parsedQuestionId}
      canViewProducts={admin.permissions.includes("products.view")}
      canViewQuestions={admin.permissions.includes("questions.view")}
    />
  );
}
