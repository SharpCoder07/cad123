// app/api/admin/website-builder/pages/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { revalidateCmsContent } from "@/lib/cms/revalidate";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(["website_builder.pages.publish", "website_builder.pages.manage"]);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const action: "PUBLISH" | "UNPUBLISH" | "SCHEDULE" | "GENERATE_PREVIEW" = body.action ?? "PUBLISH";

  const existing = await prisma.websitePage.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { elements: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (typeof body.lockVersion === "number" && body.lockVersion !== existing.lockVersion) {
    return NextResponse.json(
      { error: "Concurrency conflict: this page was modified by another administrator. Please reload." },
      { status: 409 }
    );
  }

  if (action === "GENERATE_PREVIEW") {
    const previewToken = crypto.randomBytes(24).toString("hex");
    const updated = await prisma.websitePage.update({
      where: { id },
      data: { previewToken },
    });
    return NextResponse.json({
      previewUrl: `/api/preview?slug=${encodeURIComponent(updated.slug)}&token=${previewToken}`,
      previewToken,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const isPublishing = action === "PUBLISH";
    const isScheduling = action === "SCHEDULE" && body.scheduledAt;

    const updatedPage = await tx.websitePage.update({
      where: { id },
      data: {
        status: isPublishing ? "PUBLISHED" : isScheduling ? "SCHEDULED" : "DRAFT",
        isPublished: isPublishing,
        publishedAt: isPublishing ? new Date() : existing.publishedAt,
        scheduledAt: isScheduling ? new Date(body.scheduledAt) : null,
        lockVersion: { increment: 1 },
        updatedById: auth.user!.id,
      },
    });

    await tx.websitePageVersion.create({
      data: {
        pageId: id,
        versionNumber: updatedPage.lockVersion,
        title: updatedPage.title,
        snapshot: JSON.parse(
          JSON.stringify({
            page: updatedPage,
            sections: existing.sections,
          })
        ),
        createdById: auth.user!.id,
      },
    });

    return updatedPage;
  });

  await logActivity({
    userId: auth.user.id,
    action: `PAGE_${action}`,
    entityType: "WebsitePage",
    entityId: id,
    details: `Page "${result.title}" (${result.slug}) status changed to ${result.status}`,
  });

  revalidateCmsContent({ pageSlug: result.slug, isGlobal: result.slug === "home" });

  return NextResponse.json({ page: result });
}