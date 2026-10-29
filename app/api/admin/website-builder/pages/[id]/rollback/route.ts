import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return NextResponse.json(
      { success: false, message: "Another publishing operation occurred. Please retry." },
      { status: 409 },
    );
  }
  console.error("Website page rollback failed:", error);
  return NextResponse.json(
    { success: false, message: "Unable to roll back the website page." },
    { status: 500 },
  );
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("website_builder.publish");

    const { id } = await params;
    const pageId = Number(id);
    if (!Number.isSafeInteger(pageId) || pageId <= 0) {
      return NextResponse.json({ success: false, message: "Invalid page ID." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "A JSON body with a version number is required." },
        { status: 400 },
      );
    }
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const { version } = body as Record<string, unknown>;
    if (typeof version !== "number" || !Number.isSafeInteger(version) || version <= 0) {
      return NextResponse.json(
        { success: false, message: "version must be a positive integer." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const page = await tx.websitePage.findUnique({
          where: { id: pageId },
          select: { id: true, status: true, publishedVersion: true },
        });
        if (!page) return { kind: "not_found" as const };
        if (page.status === "ARCHIVED") return { kind: "archived" as const };
        if (page.publishedVersion === null) return { kind: "never_published" as const };
        if (page.publishedVersion === version) return { kind: "already_live" as const };

        const target = await tx.websitePageVersion.findUnique({
          where: { pageId_version: { pageId, version } },
          select: { id: true, status: true, publishedAt: true },
        });
        // An archived version is eligible only if it was previously published.
        if (!target || target.publishedAt === null || target.status === "DRAFT") {
          return { kind: "invalid_version" as const };
        }

        const updated = await tx.websitePage.updateMany({
          where: { id: pageId, status: "ACTIVE", publishedVersion: page.publishedVersion },
          data: { publishedVersion: version },
        });
        if (updated.count !== 1) return { kind: "conflict" as const };

        await tx.websitePageVersion.update({
          where: { id: target.id },
          data: { status: "PUBLISHED" },
        });
        await tx.websitePageVersion.updateMany({
          where: {
            pageId,
            version: { not: version },
            status: "PUBLISHED",
          },
          data: { status: "ARCHIVED" },
        });

        return {
          kind: "success" as const,
          pageId,
          previousVersion: page.publishedVersion,
          publishedVersion: version,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ success: false, message: "Page not found." }, { status: 404 });
      case "archived":
        return NextResponse.json({ success: false, message: "Archived pages cannot be rolled back." }, { status: 409 });
      case "never_published":
        return NextResponse.json({ success: false, message: "This page has never been published." }, { status: 409 });
      case "already_live":
        return NextResponse.json({ success: false, message: "This version is already live." }, { status: 409 });
      case "invalid_version":
        return NextResponse.json({ success: false, message: "Version not found or was never published." }, { status: 400 });
      case "conflict":
        return NextResponse.json({ success: false, message: "The live version changed. Please retry." }, { status: 409 });
      default:
        return NextResponse.json({
          success: true,
          message: "Website page rolled back successfully.",
          data: {
            pageId: result.pageId,
            previousVersion: result.previousVersion,
            publishedVersion: result.publishedVersion,
          },
        });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
