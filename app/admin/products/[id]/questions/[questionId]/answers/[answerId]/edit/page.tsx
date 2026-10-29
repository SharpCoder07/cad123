import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import EditProductAnswerForm from "@/components/admin/EditProductAnswerForm";

type PageProps = {
  params: Promise<{
    id: string;
    questionId: string;
    answerId: string;
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

export default async function EditProductAnswerPage({ params }: PageProps) {
  // RBAC: questions.answer
  const admin = await requireAdminPermission("questions.answer");

  const { id, questionId, answerId } = await params;

  const productId = parseId(id);
  const parsedQuestionId = parseId(questionId);
  const parsedAnswerId = parseId(answerId);

  if (
    productId === null ||
    parsedQuestionId === null ||
    parsedAnswerId === null
  ) {
    notFound();
  }

  // Verify the answer belongs to the requested question and product.
  const existingAnswer = await prisma.productAnswer.findFirst({
    where: {
      id: parsedAnswerId,
      questionId: parsedQuestionId,
      question: {
        productId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingAnswer) {
    notFound();
  }

  return (
    <EditProductAnswerForm
      productId={productId}
      questionId={parsedQuestionId}
      answerId={parsedAnswerId}
      canViewProducts={admin.permissions.includes("products.view")}
      canViewQuestions={admin.permissions.includes("questions.view")}
    />
  );
}
