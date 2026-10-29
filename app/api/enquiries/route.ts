import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      productId,
      name,
      email,
      phone,
      message,
    } = body;

    if (!productId || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Product, name and email are required.",
        },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        productId,
        name,
        email,
        phone: phone || null,
        message: message || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry submitted successfully.",
        enquiryId: enquiry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enquiry creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit enquiry.",
      },
      { status: 500 }
    );
  }
}