import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = [
  "pending",
  "contacted",
  "closed",
];

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { vendorId } =
      await requireVendor();

    const { id } = await params;

    const enquiryId = Number(id);

    if (
      !Number.isInteger(enquiryId) ||
      enquiryId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry ID.",
        },
        { status: 400 },
      );
    }

    /*
     * Never update directly from the supplied ID.
     *
     * First prove that this enquiry belongs to
     * one of the logged-in vendor's products.
     */
    const enquiry =
      await prisma.enquiry.findFirst({
        where: {
          id: enquiryId,

          product: {
            vendorId,
          },
        },

        select: {
          id: true,
        },
      });

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lead not found or access denied.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const status =
      typeof body.status === "string"
        ? body.status
            .trim()
            .toLowerCase()
        : "";

    if (
      !ALLOWED_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid lead status.",
        },
        { status: 400 },
      );
    }

    const updatedEnquiry =
      await prisma.enquiry.update({
        where: {
          id: enquiry.id,
        },

        data: {
          status,
        },

        select: {
          id: true,
          status: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Lead status updated successfully.",
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    const authResponse =
      handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "Vendor lead update error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update lead.",
      },
      { status: 500 },
    );
  }
}