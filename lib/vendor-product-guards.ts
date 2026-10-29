import { prisma } from "@/lib/prisma";

export const VENDOR_EDITABLE_STATUSES = [
  "DRAFT",
  "CHANGES_REQUESTED",
] as const;

export async function getVendorEditableProduct(
  productId: number,
  vendorId: number,
) {
  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      allowed: false as const,
      status: 400,
      message: "Invalid product ID.",
    };
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!product) {
    return {
      allowed: false as const,
      status: 404,
      message: "Product not found or access denied.",
    };
  }

  if (
    product.status !== "DRAFT" &&
    product.status !== "CHANGES_REQUESTED"
  ) {
    return {
      allowed: false as const,
      status: 409,
      message:
        "This product is under review or published. Editing is locked.",
    };
  }

  return {
    allowed: true as const,
    product,
  };
}