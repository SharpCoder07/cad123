
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
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

  console.error("Website section template API error:", error);

  return fail("Unable to process section template", 500);
}

async function getTemplateId(params: RouteContext["params"]) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const templateId = Number(id);

  return Number.isSafeInteger(templateId) ? templateId : null;
}

// GET: Fetch one reusable section template
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdminPermission("website_builder.view");

    const id = await getTemplateId(params);

    if (id === null) {
      return fail("Invalid template ID", 400);
    }

    const template = await prisma.websiteSectionTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return fail("Section template not found", 404);
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE: Remove a reusable section template
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdminPermission("website_builder.edit");

    const id = await getTemplateId(params);

    if (id === null) {
      return fail("Invalid template ID", 400);
    }

    const template = await prisma.websiteSectionTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!template) {
      return fail("Section template not found", 404);
    }

    await prisma.websiteSectionTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Section template deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
