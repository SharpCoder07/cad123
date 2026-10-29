import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth-guards";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    const { vendorId } = await requireVendor();

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        website: true,
        logo: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor profile GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load company profile.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { vendorId } = await requireVendor();

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const website =
      typeof body.website === "string"
        ? body.website.trim()
        : "";

    const logo =
      typeof body.logo === "string"
        ? body.logo.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Company name is required.",
        },
        { status: 400 },
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (website) {
      try {
        const parsedUrl = new URL(website);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              "Website must be a valid http or https URL.",
          },
          { status: 400 },
        );
      }
    }

    if (logo) {
      try {
        const parsedUrl = new URL(logo);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              "Logo must be a valid http or https URL.",
          },
          { status: 400 },
        );
      }
    }

    const vendor = await prisma.vendor.update({
      where: {
        id: vendorId,
      },

      data: {
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        logo: logo || null,
        description: description || null,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        website: true,
        logo: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully.",
      vendor,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Vendor profile PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update company profile.",
      },
      { status: 500 },
    );
  }
}