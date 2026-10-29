
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authOptions } from "@/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

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
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
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

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to upload images.",
        },
        { status: 401 }
      );
    }

    // 2. Allow only ADMIN users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to upload images.",
        },
        { status: 403 }
      );
    }

    // 3. Read uploaded file
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select an image to upload.",
        },
        { status: 400 }
      );
    }

    // 4. Validate declared file type
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    // 5. Validate file size
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    // 6. Read and validate file contents
    const buffer = Buffer.from(await file.arrayBuffer());

    const detectedType = detectImageType(buffer);

    if (!detectedType || detectedType !== file.type) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image file format.",
        },
        { status: 400 }
      );
    }

    // 7. Generate a unique filename
    const extension = ALLOWED_TYPES[detectedType];
    const fileName = `${randomUUID()}${extension}`;

    // 8. Create local storage directory
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    await mkdir(uploadDirectory, { recursive: true });

    // 9. Save file to local storage
    const filePath = path.join(uploadDirectory, fileName);

    await writeFile(filePath, buffer, { flag: "wx" });

    // 10. Return the public image URL
    const imageUrl = `/uploads/products/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully.",
        url: imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}
