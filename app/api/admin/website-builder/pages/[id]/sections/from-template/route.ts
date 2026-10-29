
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TemplateElement = {
  key: string;
  parentKey: string | null;
  type: string;
  sortOrder: number;
  visible: boolean;
  content: Prisma.JsonValue | null;
  styles: Prisma.JsonValue | null;
  responsive: Prisma.JsonValue | null;
  action: Prisma.JsonValue | null;
};

type TemplateData = {
  section: {
    type: string;
    name: string | null;
    visible: boolean;
    settings: Prisma.JsonValue | null;
    styles: Prisma.JsonValue | null;
  };
  elements: TemplateElement[];
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401);
  }

  if (error instanceof ForbiddenError) {
    return fail(error.message, 403);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return fail("A duplicate section or element key was detected", 409);
  }

  console.error("Insert section template API error:", error);
  return fail("Unable to insert section template", 500);
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function jsonValue(
  value: Prisma.JsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTemplateData(value: unknown): value is TemplateData {
  if (!isObject(value) || !isObject(value.section)) return false;

  const section = value.section;

  if (
    typeof section.type !== "string" ||
    typeof section.visible !== "boolean" ||
    !(
      typeof section.name === "string" ||
      section.name === null
    ) ||
    !Array.isArray(value.elements)
  ) {
    return false;
  }

  const keys = new Set<string>();

  for (const element of value.elements) {
    if (
      !isObject(element) ||
      typeof element.key !== "string" ||
      !element.key ||
      keys.has(element.key) ||
      !(
        typeof element.parentKey === "string" ||
        element.parentKey === null
      ) ||
      typeof element.type !== "string" ||
      !Number.isSafeInteger(element.sortOrder) ||
      typeof element.visible !== "boolean"
    ) {
      return false;
    }

    keys.add(element.key);
  }

  for (const element of value.elements) {
    if (
      element.parentKey !== null &&
      !keys.has(element.parentKey)
    ) {
      return false;
    }
  }

  return true;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdminPermission("website_builder.edit");

    const pageId = parseId((await context.params).id);

    if (pageId === null) {
      return fail("Invalid page ID", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON request body", 400);
    }

    if (!isObject(body)) {
      return fail("Request body must be an object", 400);
    }

    const templateId = body.templateId;

    if (
      typeof templateId !== "number" ||
      !Number.isSafeInteger(templateId) ||
      templateId <= 0
    ) {
      return fail("A valid templateId is required", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize edits to the page and verify that it is still active.
      const rows = await tx.$queryRaw<
        Array<{ id: number; status: string }>
      >`
        SELECT id, status::text AS status
        FROM "WebsitePage"
        WHERE id = ${pageId}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        return { kind: "missing-page" as const };
      }

      if (rows[0].status !== "ACTIVE") {
        return { kind: "archived-page" as const };
      }

      const draft = await tx.websitePageVersion.findFirst({
        where: { pageId, status: "DRAFT" },
        orderBy: { version: "desc" },
        select: { id: true },
      });

      if (!draft) {
        return { kind: "no-draft" as const };
      }

      const template = await tx.websiteSectionTemplate.findUnique({
        where: { id: templateId },
        select: {
          id: true,
          name: true,
          data: true,
        },
      });

      if (!template) {
        return { kind: "missing-template" as const };
      }

      if (!isTemplateData(template.data)) {
        return { kind: "invalid-template" as const };
      }

      const snapshot = template.data;

      const max = await tx.websiteSection.aggregate({
        where: { versionId: draft.id },
        _max: { sortOrder: true },
      });

      const sectionKey = `reused-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

      const section = await tx.websiteSection.create({
        data: {
          versionId: draft.id,
          key: sectionKey,
          type: snapshot.section.type,
          name: snapshot.section.name ?? template.name,
          sortOrder: (max._max.sortOrder ?? -1) + 1,
          visible: snapshot.section.visible,
          settings: jsonValue(snapshot.section.settings),
          styles: jsonValue(snapshot.section.styles),
        },
      });

      // Resolve parents after creating their parent elements.
      const remaining = [...snapshot.elements];
      const createdIds = new Map<string, number>();

      while (remaining.length > 0) {
        let progress = false;

        for (let i = remaining.length - 1; i >= 0; i--) {
          const element = remaining[i];

          if (
            element.parentKey !== null &&
            !createdIds.has(element.parentKey)
          ) {
            continue;
          }

          const created = await tx.websiteElement.create({
            data: {
              sectionId: section.id,
              parentId:
                element.parentKey === null
                  ? null
                  : createdIds.get(element.parentKey)!,
              key: element.key,
              type: element.type,
              sortOrder: element.sortOrder,
              visible: element.visible,
              content: jsonValue(element.content),
              styles: jsonValue(element.styles),
              responsive: jsonValue(element.responsive),
              action: jsonValue(element.action),
            },
            select: { id: true, key: true },
          });

          createdIds.set(element.key, created.id);
          remaining.splice(i, 1);
          progress = true;
        }

        if (!progress) {
          throw new Error(
            "Invalid element hierarchy in reusable section template",
          );
        }
      }

      return {
        kind: "created" as const,
        sectionId: section.id,
        sectionKey: section.key,
        elementCount: snapshot.elements.length,
      };
    });

    if (result.kind === "missing-page") {
      return fail("Page not found", 404);
    }

    if (result.kind === "archived-page") {
      return fail("Archived pages cannot be edited", 409);
    }

    if (result.kind === "no-draft") {
      return fail("Create a draft version before inserting a template", 409);
    }

    if (result.kind === "missing-template") {
      return fail("Section template not found", 404);
    }

    if (result.kind === "invalid-template") {
      return fail("The saved template data is invalid", 409);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reusable section inserted successfully",
        data: {
          id: result.sectionId,
          key: result.sectionKey,
          elementCount: result.elementCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
