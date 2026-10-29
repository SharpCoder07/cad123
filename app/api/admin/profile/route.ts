import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";
import { createActivityLog } from "@/lib/activity-log";

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

  console.error("Admin profile API error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error." },
    { status: 500 },
  );
}

const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  phone: true,
  jobTitle: true,
  department: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
  adminRole: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export async function GET() {
  try {
    const admin = await requireAdmin();

    const profile = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: profileSelect,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    return errorResponse(error);
  }
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

    // Explicit allowlist: never accept role, adminRoleId,
    // password, email, or other security-sensitive fields.
    const allowedFields = new Set([
      "name",
      "phone",
      "jobTitle",
      "department",
      "timezone",
    ]);

    const submittedFields = Object.keys(input);

    if (
      submittedFields.length === 0 ||
      submittedFields.some((field) => !allowedFields.has(field))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more profile fields are not allowed.",
        },
        { status: 400 },
      );
    }

    const data: {
      name?: string;
      phone?: string | null;
      jobTitle?: string | null;
      department?: string | null;
      timezone?: string;
    } = {};

    if ("name" in input) {
      if (
        typeof input.name !== "string" ||
        !input.name.trim() ||
        input.name.trim().length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be between 1 and 100 characters.",
          },
          { status: 400 },
        );
      }

      data.name = input.name.trim();
    }

    for (const field of ["phone", "jobTitle", "department"] as const) {
      if (!(field in input)) continue;

      const value = input[field];

      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid ${field} value.`,
          },
          { status: 400 },
        );
      }

      const trimmed = typeof value === "string" ? value.trim() : "";

      const maxLength = field === "phone" ? 30 : 100;

      if (trimmed.length > maxLength) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} must not exceed ${maxLength} characters.`,
          },
          { status: 400 },
        );
      }

      data[field] = trimmed || null;
    }

    if ("timezone" in input) {
      if (typeof input.timezone !== "string" || !input.timezone.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "A valid timezone is required.",
          },
          { status: 400 },
        );
      }

      const timezone = input.timezone.trim();

      try {
        new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
        });
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid timezone.",
          },
          { status: 400 },
        );
      }

      data.timezone = timezone;
    }

    const profile = await prisma.$transaction(async (tx) => {
      // Step 1: Get existing profile values
      const previousProfile = await tx.user.findUnique({
        where: { id: admin.userId },
        select: {
          name: true,
          phone: true,
          jobTitle: true,
          department: true,
          timezone: true,
        },
      });

      if (!previousProfile) {
        throw new Error("Profile not found.");
      }

      // Step 2: Compare old and new values
      const changes: Record<
        string,
        {
          from: string | null;
          to: string | null;
        }
      > = {};

      for (const field of Object.keys(data) as Array<keyof typeof data>) {
        const oldValue = previousProfile[field] ?? null;
        const newValue = data[field] ?? null;

        if (oldValue !== newValue) {
          changes[field] = {
            from: oldValue,
            to: newValue,
          };
        }
      }

      // Step 3: Update profile
      const updatedProfile = await tx.user.update({
        where: { id: admin.userId },
        data,
        select: profileSelect,
      });

      // Step 4: Log only actual changes
      if (Object.keys(changes).length > 0) {
        await createActivityLog({
          userId: admin.userId,
          action: "PROFILE_UPDATED",
          description: "Updated profile information",
          status: "SUCCESS",
          metadata: {
            changes,
          },
          tx,
        });
      }

      return updatedProfile;
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
