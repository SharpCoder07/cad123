import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const PHOTO_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "profiles",
);

function detectImageType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

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

  console.error("Profile photo error:", error);

  return NextResponse.json(
    { success: false, message: "Unable to process profile photo." },
    { status: 500 },
  );
}

async function removeLocalPhoto(imageUrl: string | null) {
  if (!imageUrl) return;

  // Only delete files owned by the profile-upload directory.
  const match = /^\/uploads\/profiles\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/.exec(
    imageUrl,
  );

  if (!match) return;

  const filePath = path.join(PHOTO_DIRECTORY, match[1]);

  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Unable to remove previous profile photo:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 5 MB.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectImageType(buffer);

    if (!detectedType || detectedType !== file.type) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image file format.",
        },
        { status: 400 },
      );
    }

    await mkdir(PHOTO_DIRECTORY, { recursive: true });

    const fileName = `${randomUUID()}${ALLOWED_TYPES[detectedType]}`;
    const filePath = path.join(PHOTO_DIRECTORY, fileName);
    const imageUrl = `/uploads/profiles/${fileName}`;

    await writeFile(filePath, buffer, { flag: "wx" });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const previousUser = await tx.user.findUnique({
          where: { id: admin.userId },
          select: { image: true },
        });

        if (!previousUser) {
          throw new Error("User not found.");
        }

        const updatedUser = await tx.user.update({
          where: { id: admin.userId },
          data: { image: imageUrl },
          select: { image: true },
        });

        await createActivityLog({
          userId: admin.userId,
          action: "PROFILE_PHOTO_UPLOADED",
          description: "Updated profile photo",
          status: "SUCCESS",
          tx,
        });

        return {
          image: updatedUser.image,
          previousImage: previousUser.image,
        };
      });

      // Clean up the previous local photo after the DB commit.
      // Never delete the new image if this cleanup fails.
      if (result.previousImage) {
        await removeLocalPhoto(result.previousImage);
      }

      return NextResponse.json({
        success: true,
        message: "Profile photo updated successfully.",
        image: result.image,
      });
    } catch (error) {
      // If the DB transaction fails, remove the newly uploaded file.
      await removeLocalPhoto(imageUrl);
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const admin = await requireAdmin();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: admin.userId },
        select: { image: true },
      });

      if (!user) {
        return { found: false as const, previousImage: null };
      }

      if (!user.image) {
        return { found: true as const, previousImage: null };
      }

      await tx.user.update({
        where: { id: admin.userId },
        data: { image: null },
      });

      await createActivityLog({
        userId: admin.userId,
        action: "PROFILE_PHOTO_REMOVED",
        description: "Removed profile photo",
        status: "SUCCESS",
        tx,
      });

      return {
        found: true as const,
        previousImage: user.image,
      };
    });

    if (!result.found) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // Delete the local file only after the DB transaction commits.
    await removeLocalPhoto(result.previousImage);

    return NextResponse.json({
      success: true,
      message: "Profile photo removed successfully.",
      image: null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
