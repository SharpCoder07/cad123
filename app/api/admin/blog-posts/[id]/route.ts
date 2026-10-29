
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdmin,
  requireAdminPermission,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getPostId(id: string): number | null {
  const postId = Number(id);

  if (
    !Number.isSafeInteger(postId) ||
    postId <= 0
  ) {
    return null;
  }

  return postId;
}

function authErrorResponse(
  error: unknown,
  action: string
): NextResponse | null {
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
        message: `You do not have permission to ${action}.`,
      },
      { status: 403 }
    );
  }

  return null;
}

// GET: View a blog post.
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    const canView = admin.permissions.includes(
      "blog_posts.view"
    );

    const canEdit = admin.permissions.includes(
      "blog_posts.edit"
    );

    if (!canView && !canEdit) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view blog posts.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const postId = getPostId(id);

    if (postId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog post ID.",
        },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog post not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    const authResponse = authErrorResponse(
      error,
      "view blog posts"
    );

    if (authResponse) {
      return authResponse;
    }

    console.error("Get blog post error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load blog post.",
      },
      { status: 500 }
    );
  }
}

// PUT: Update a blog post.
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdminPermission(
      "blog_posts.edit"
    );

    const canPublish = admin.permissions.includes(
      "blog_posts.publish"
    );

    const { id } = await context.params;
    const postId = getPostId(id);

    if (postId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog post ID.",
        },
        { status: 400 }
      );
    }

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

    const existingPost = await prisma.blogPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog post not found.",
        },
        { status: 404 }
      );
    }

    const publishingStatusChanged =
      published !== undefined &&
      published !== existingPost.published;

    // RBAC: Changing publication status requires publish permission.
    if (publishingStatusChanged && !canPublish) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to change the publishing status.",
        },
        { status: 403 }
      );
    }

    const duplicateSlug = await prisma.blogPost.findFirst({
      where: {
        slug: slug.trim(),
        NOT: {
          id: postId,
        },
      },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A blog post with this slug already exists.",
        },
        { status: 409 }
      );
    }

    // Preserve existing publication status if omitted.
    const nextPublished =
      published === undefined
        ? existingPost.published
        : published;

    const updatedPost = await prisma.blogPost.update({
      where: {
        id: postId,
      },
      data: {
        title: title.trim(),
        slug: slug.trim(),
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
        published: nextPublished,
        publishedAt: nextPublished
          ? existingPost.publishedAt || new Date()
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post updated successfully.",
      post: updatedPost,
    });
  } catch (error) {
    const authResponse = authErrorResponse(
      error,
      "edit blog posts"
    );

    if (authResponse) {
      return authResponse;
    }

    console.error("Update blog post error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update blog post.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a blog post.
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission(
      "blog_posts.delete"
    );

    const { id } = await context.params;
    const postId = getPostId(id);

    if (postId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog post ID.",
        },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog post not found.",
        },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({
      where: {
        id: postId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully.",
    });
  } catch (error) {
    const authResponse = authErrorResponse(
      error,
      "delete blog posts"
    );

    if (authResponse) {
      return authResponse;
    }

    console.error("Delete blog post error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete blog post.",
      },
      { status: 500 }
    );
  }
}
