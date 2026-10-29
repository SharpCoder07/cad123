import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 },
    );
  }

  console.error("Change password error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error." },
    { status: 500 },
  );
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const currentPassword = input.currentPassword;
    const newPassword = input.newPassword;
    const confirmPassword = input.confirmPassword;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "All password fields are required." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match." },
        { status: 400 },
      );
    }

    if (
      newPassword.length < 12 ||
      newPassword.length > 128 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be 12–128 characters and include uppercase, lowercase, number and special character.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { success: false, message: "Password authentication unavailable." },
        { status: 400 },
      );
    }

    const validCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!validCurrentPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 400 },
      );
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from the current password.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: admin.userId,
          password: user.password,
        },
        data: {
          password: hashedPassword,
        },
      });

      if (updated.count !== 1) {
        return updated;
      }

      await createActivityLog({
        userId: admin.userId,
        action: "PASSWORD_CHANGED",
        description: "Changed account password",
        status: "SUCCESS",
        tx,
      });

      return updated;
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Password changed elsewhere. Please try again.",
        },
        { status: 409 },
      );
    }

    if (result.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Password changed elsewhere. Please try again.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
