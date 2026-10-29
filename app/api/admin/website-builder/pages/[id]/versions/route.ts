import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = { params: Promise<{ id: string }> };

function respondToError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
  console.error("Website page versions API error:", error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function jsonValue(value: Prisma.JsonValue | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminPermission("website_builder.view");
    const pageId = parseId((await context.params).id);
    if (pageId === null) {
      return NextResponse.json({ success: false, message: "Invalid page ID" }, { status: 400 });
    }

    const page = await prisma.websitePage.findUnique({
      where: { id: pageId },
      select: {
        id: true, slug: true, title: true, status: true, publishedVersion: true,
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true, version: true, status: true, settings: true,
            createdById: true, publishedAt: true, createdAt: true, updatedAt: true,
            _count: { select: { sections: true } },
          },
        },
      },
    });
    if (!page) {
      return NextResponse.json({ success: false, message: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return respondToError(error);
  }
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminPermission("website_builder.create");
    const pageId = parseId((await context.params).id);
    if (pageId === null) {
      return NextResponse.json({ success: false, message: "Invalid page ID" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock the parent row so concurrent draft creation cannot choose the same version.
      const rows = await tx.$queryRaw<Array<{ id: number; status: string }>>`
        SELECT id, status::text AS status FROM "WebsitePage" WHERE id = ${pageId} FOR UPDATE
      `;
      if (rows.length === 0) return { kind: "missing" as const };
      if (rows[0].status !== "ACTIVE") return { kind: "archived" as const };

      const latest = await tx.websitePageVersion.findFirst({
        where: { pageId },
        orderBy: { version: "desc" },
        include: {
          sections: {
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            include: {
              elements: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
            },
          },
        },
      });

      // Only one working draft per page. Reuse it rather than silently overwrite it.
      const existingDraft = await tx.websitePageVersion.findFirst({
        where: { pageId, status: "DRAFT" },
        orderBy: { version: "desc" },
        select: { id: true, version: true },
      });
      if (existingDraft) return { kind: "draft-exists" as const, draft: existingDraft };

      const created = await tx.websitePageVersion.create({
        data: {
          pageId,
          version: (latest?.version ?? 0) + 1,
          status: "DRAFT",
          settings: latest ? jsonValue(latest.settings) : Prisma.JsonNull,
          createdById: admin.userId,
        },
      });

      if (latest) {
        for (const section of latest.sections) {
          const newSection = await tx.websiteSection.create({
            data: {
              versionId: created.id,
              key: section.key,
              type: section.type,
              name: section.name,
              sortOrder: section.sortOrder,
              visible: section.visible,
              settings: jsonValue(section.settings),
              styles: jsonValue(section.styles),
            },
          });

          // Create parent elements before children, retaining tree relationships.
          const remaining = [...section.elements];
          const mappedIds = new Map<number, number>();
          while (remaining.length > 0) {
            let progress = false;
            for (let i = remaining.length - 1; i >= 0; i--) {
              const element = remaining[i];
              if (element.parentId !== null && !mappedIds.has(element.parentId)) continue;
              const newElement = await tx.websiteElement.create({
                data: {
                  sectionId: newSection.id,
                  parentId: element.parentId === null ? null : mappedIds.get(element.parentId)!,
                  key: element.key,
                  type: element.type,
                  sortOrder: element.sortOrder,
                  visible: element.visible,
                  content: jsonValue(element.content),
                  styles: jsonValue(element.styles),
                  responsive: jsonValue(element.responsive),
                  action: jsonValue(element.action),
                },
              });
              mappedIds.set(element.id, newElement.id);
              remaining.splice(i, 1);
              progress = true;
            }
            if (!progress) throw new Error("Invalid element parent hierarchy in source version");
          }
        }
      }
      return { kind: "created" as const, draft: created };
    });

    if (result.kind === "missing") {
      return NextResponse.json({ success: false, message: "Page not found" }, { status: 404 });
    }
    if (result.kind === "archived") {
      return NextResponse.json({ success: false, message: "Archived pages cannot create drafts" }, { status: 409 });
    }
    if (result.kind === "draft-exists") {
      return NextResponse.json(
        { success: false, message: "A draft already exists for this page", data: result.draft },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: true, message: "Draft version created", data: result.draft },
      { status: 201 },
    );
  } catch (error) {
    return respondToError(error);
  }
}
