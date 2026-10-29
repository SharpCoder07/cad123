import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdminPermission,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = ["new", "read", "replied", "closed"];

function parseMessageId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleError(error: unknown, operation: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Please log in.",
      },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action.",
      },
      { status: 403 },
    );
  }

  console.error(`${operation} contact message error:`, error);

  return NextResponse.json(
    {
      success: false,
      message: `Failed to ${operation.toLowerCase()} contact message.`,
    },
    { status: 500 },
  );
}

// PUT /api/admin/contact-messages/[id]
// Temporary policy: contact_messages.delete required
// Recommended future permission: contact_messages.edit

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("contact_messages.delete");

    const { id } = await params;
    const messageId = parseMessageId(id);

    if (messageId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid message ID",
        },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      !("status" in body) ||
      typeof body.status !== "string" ||
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status",
        },
        { status: 400 },
      );
    }

    const status = body.status;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message not found",
        },
        { status: 404 },
      );
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id: messageId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: "Contact message status updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    return handleError(error, "PUT");
  }
}

// DELETE /api/admin/contact-messages/[id]
// Required permission: contact_messages.delete

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission("contact_messages.delete");

    const { id } = await params;
    const messageId = parseMessageId(id);

    if (messageId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid message ID",
        },
        { status: 400 },
      );
    }

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact message not found",
        },
        { status: 404 },
      );
    }

    await prisma.contactMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    return handleError(error, "DELETE");
  }
}
