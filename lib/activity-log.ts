import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";

export type ActivityAction =
  | "PROFILE_UPDATED"
  | "PASSWORD_CHANGED"
  | "PROFILE_PHOTO_UPLOADED"
  | "PROFILE_PHOTO_REMOVED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "PRODUCT_SUBMITTED"
  | "PRODUCT_APPROVED"
  | "PRODUCT_REJECTED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "PERMISSIONS_UPDATED"
  | "LOGIN_SUCCESS"
  | "LOGOUT";

export type ActivityStatus = "SUCCESS" | "FAILED";

type CreateActivityLogInput = {
  userId: number;
  action: ActivityAction;
  description: string;
  status?: ActivityStatus;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
};

export async function createActivityLog({
  userId,
  action,
  description,
  status = "SUCCESS",
  metadata,
  tx,
}: CreateActivityLogInput) {
  const db = tx ?? prisma;

  return db.activityLog.create({
    data: {
      userId,
      action,
      description,
      status,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });
}
