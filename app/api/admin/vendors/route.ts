
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

const VALID_STATUSES = ["PENDING", "ACTIVE"] as const;

type VendorStatusInput = (typeof VALID_STATUSES)[number];

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

export async function POST(request: Request) {
  try {
    // RBAC: Only admins with vendors.create can create vendors.
    await requireAdminPermission("vendors.create");

    const body = await request.json();

    const {
      name,
      slug,
      email,
      phone,
      website,
      logo,
      description,
      status,
      userName,
      userEmail,
      password,
    } = body;

    const vendorName = name?.trim();
    const vendorSlug = slug?.trim().toLowerCase();
    const vendorEmail = email?.trim().toLowerCase() || null;

    const loginName = userName?.trim();
    const loginEmail = userEmail?.trim().toLowerCase();

    const vendorStatus: VendorStatusInput = VALID_STATUSES.includes(status)
      ? status
      : "PENDING";

    if (!vendorName || !vendorSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor name and slug are required.",
        },
        { status: 400 }
      );
    }

    if (!loginName || !loginEmail || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor login name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 6 characters.",
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(loginEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid login email address.",
        },
        { status: 400 }
      );
    }

    const [existingVendor, existingUser] = await Promise.all([
      prisma.vendor.findUnique({
        where: {
          slug: vendorSlug,
        },
        select: {
          id: true,
        },
      }),

      prisma.user.findUnique({
        where: {
          email: loginEmail,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "A vendor with this slug already exists.",
        },
        { status: 409 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this login email already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name: vendorName,
          slug: vendorSlug,
          email: vendorEmail,
          phone: phone?.trim() || null,
          website: website?.trim() || null,
          logo: logo?.trim() || null,
          description: description?.trim() || null,
          status: vendorStatus,
        },
      });

      const user = await tx.user.create({
        data: {
          name: loginName,
          email: loginEmail,
          password: hashedPassword,
          role: "VENDOR",
          vendorId: vendor.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          vendorId: true,
          createdAt: true,
        },
      });

      return {
        vendor,
        user,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully.",
        vendor: result.vendor,
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create vendor.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // RBAC: Vendor managers and product editors can fetch vendors.
    const admin = await requireAdmin();

    const allowedPermissions = [
      "vendors.view",
      "products.edit",
      "products.create",
    ];

    const hasPermission = allowedPermissions.some((permission) =>
      admin.permissions.includes(permission)
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view vendors.",
        },
        { status: 403 }
      );
    }

    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Load vendors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load vendors.",
      },
      { status: 500 }
    );
  }
}
