
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdminPermission,
} from "@/lib/auth-guards";

export async function POST(request: Request) {
  try {
    // RBAC: Admin must have permission to create blog posts.
    const admin = await requireAdminPermission(
      "blog_posts.create"
    );

    // RBAC: Publishing requires a separate permission.
    const canPublish = admin.permissions.includes(
      "blog_posts.publish"
    );

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      authorId,
      published,
    } = data;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, slug and content are required.",
        },
        { status: 400 }
      );
    }

    if (
      (excerpt != null && typeof excerpt !== "string") ||
      (featuredImage != null &&
        typeof featuredImage !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid excerpt or featured image.",
        },
        { status: 400 }
      );
    }

    if (
      published !== undefined &&
      typeof published !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid publishing status.",
        },
        { status: 400 }
      );
    }

    const shouldPublish = published === true;

    // RBAC: Prevent unauthorized publishing.
    if (shouldPublish && !canPublish) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to publish blog posts.",
        },
        { status: 403 }
      );
    }

    let parsedAuthorId: number | null = null;

    if (
      authorId !== undefined &&
      authorId !== null &&
      authorId !== ""
    ) {
      if (
        typeof authorId !== "string" &&
        typeof authorId !== "number"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid author ID.",
          },
          { status: 400 }
        );
      }

      parsedAuthorId = Number(authorId);

      if (
        !Number.isSafeInteger(parsedAuthorId) ||
        parsedAuthorId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid author ID.",
          },
          { status: 400 }
        );
      }
    }

    const trimmedSlug = slug.trim();

    const existingPost = await prisma.blogPost.findUnique({
      where: {
        slug: trimmedSlug,
      },
    });

    if (existingPost) {
      return NextResponse.json(
        {
          success: false,
          message: "A blog post with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug: trimmedSlug,
        excerpt:
          typeof excerpt === "string"
            ? excerpt.trim() || null
            : null,
        content: content.trim(),
        featuredImage:
          typeof featuredImage === "string"
            ? featuredImage.trim() || null
            : null,
        authorId: parsedAuthorId,
        published: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Blog post created successfully.",
        post,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create blog posts.",
        },
        { status: 403 }
      );
    }

    console.error("Create blog post error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create blog post.",
      },
      { status: 500 }
    );
  }
}
