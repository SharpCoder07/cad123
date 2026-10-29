
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdminPermission,
} from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseEnquiryId(value: string): number | null {
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
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action.",
      },
      { status: 403 }
    );
  }

  console.error(`${operation} enquiry error:`, error);

  return NextResponse.json(
    {
      success: false,
      message: `Failed to ${operation.toLowerCase()} enquiry.`,
    },
    { status: 500 }
  );
}

// DELETE /api/admin/enquiries/[id]
// Required permission: enquiries.delete

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("enquiries.delete");

    const { id } = await context.params;
    const enquiryId = parseEnquiryId(id);

    if (enquiryId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry ID.",
        },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
    });

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        { status: 404 }
      );
    }

    await prisma.enquiry.delete({
      where: {
        id: enquiryId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    return handleError(error, "Delete");
  }
}

// PATCH /api/admin/enquiries/[id]
// Required permission: enquiries.edit

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdminPermission("enquiries.edit");

    const { id } = await context.params;
    const enquiryId = parseEnquiryId(id);

    if (enquiryId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry ID.",
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
      Array.isArray(body) ||
      !("status" in body) ||
      typeof body.status !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry status.",
        },
        { status: 400 }
      );
    }

    const status = body.status.toLowerCase();

    const allowedStatuses = [
      "pending",
      "contacted",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry status.",
        },
        { status: 400 }
      );
    }

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
    });

    if (!existingEnquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        { status: 404 }
      );
    }

    const enquiry = await prisma.enquiry.update({
      where: {
        id: enquiryId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Enquiry marked as ${status}.`,
      enquiry,
    });
  } catch (error) {
    return handleError(error, "Update");
  }
}
