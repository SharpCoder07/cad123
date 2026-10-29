
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

const VALID_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
] as const;

type VendorStatusInput = (typeof VALID_STATUSES)[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Please sign in.",
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

  return null;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // RBAC: Admin must have vendors.view OR vendors.edit.
    const admin = await requireAdmin();

    const canViewVendor =
      admin.permissions.includes("vendors.view") ||
      admin.permissions.includes("vendors.edit");

    if (!canViewVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view this vendor.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const vendorId = Number(id);

    if (!Number.isSafeInteger(vendorId) || vendorId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor ID.",
        },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                enquiries: true,
                questions: true,
                reviews: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        _count: {
          select: {
            users: true,
            products: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found.",
        },
        { status: 404 }
      );
    }

    const [enquiryCount, questionCount, reviewCount] =
      await Promise.all([
        prisma.enquiry.count({
          where: {
            product: {
              vendorId,
            },
          },
        }),

        prisma.productQuestion.count({
          where: {
            product: {
              vendorId,
            },
          },
        }),

        prisma.review.count({
          where: {
            product: {
              vendorId,
            },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        stats: {
          users: vendor._count.users,
          products: vendor._count.products,
          enquiries: enquiryCount,
          questions: questionCount,
          reviews: reviewCount,
        },
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Get vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load vendor.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    // RBAC: Only admins with vendors.edit can update vendors.
    await requireAdminPermission("vendors.edit");

    const { id } = await context.params;
    const vendorId = Number(id);

    if (!Number.isSafeInteger(vendorId) || vendorId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor ID.",
        },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("Invalid request body");
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      email,
      phone,
      website,
      logo,
      description,
      status,
    } = body;

    const vendorName =
      typeof name === "string" ? name.trim() : "";

    const vendorSlug =
      typeof slug === "string"
        ? slug.trim().toLowerCase()
        : "";

    if (!vendorName || !vendorSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor name and slug are required.",
        },
        { status: 400 }
      );
    }

    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugPattern.test(vendorSlug)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Slug can contain lowercase letters, numbers and hyphens only.",
        },
        { status: 400 }
      );
    }

    if (
      typeof status !== "string" ||
      !VALID_STATUSES.some((item) => item === status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor status.",
        },
        { status: 400 }
      );
    }

    const vendorStatus = status as VendorStatusInput;

    const optionalFields = {
      email,
      phone,
      website,
      logo,
      description,
    };

    for (const [field, value] of Object.entries(optionalFields)) {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} must be a string.`,
          },
          { status: 400 }
        );
      }
    }

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid company email address.",
        },
        { status: 400 }
      );
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        id: true,
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found.",
        },
        { status: 404 }
      );
    }

    const duplicateSlug = await prisma.vendor.findFirst({
      where: {
        slug: vendorSlug,
        NOT: {
          id: vendorId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A vendor with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const vendor = await prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        name: vendorName,
        slug: vendorSlug,
        email: normalizedEmail || null,
        phone: typeof phone === "string" ? phone.trim() || null : null,
        website:
          typeof website === "string"
            ? website.trim() || null
            : null,
        logo: typeof logo === "string" ? logo.trim() || null : null,
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
        status: vendorStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully.",
      vendor,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Update vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update vendor.",
      },
      { status: 500 }
    );
  }
}
