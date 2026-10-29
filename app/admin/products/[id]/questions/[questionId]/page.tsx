import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import ProductQuestionDetails from "@/components/admin/ProductQuestionDetails";

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

export default async function ProductQuestionDetailsPage({
  params,
}: PageProps) {
  // RBAC: questions.view
  const admin = await requireAdminPermission("questions.view");

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
    <ProductQuestionDetails
      productId={productId}
      questionId={parsedQuestionId}
      canAnswer={admin.permissions.includes("questions.answer")}
    />
  );
}
