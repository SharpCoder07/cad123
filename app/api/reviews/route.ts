import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to submit a review.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const { productId, rating, title, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        {
          success: false,
          message: "Product and rating are required.",
        },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this product.",
        },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        title: title || null,
        comment: comment || null,
        userId: user.id,
        productId: product.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully.",
        review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Review creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit review.",
      },
      { status: 500 },
    );
  }
}
