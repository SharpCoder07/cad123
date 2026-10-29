import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";

import ProductQuestionsManager from "@/components/admin/ProductQuestionsManager";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductQuestionsPage({ params }: PageProps) {
  // RBAC: questions.view
  const admin = await requireAdminPermission("questions.view");

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <ProductQuestionsManager
      productId={productId}
      canAnswer={admin.permissions.includes("questions.answer")}
      canDelete={admin.permissions.includes("questions.delete")}
      canViewProducts={admin.permissions.includes("products.view")}
      canEditProducts={admin.permissions.includes("products.edit")}
    />
  );
}
