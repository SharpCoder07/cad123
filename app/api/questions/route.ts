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
          message: "You must be logged in to ask a question.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { productId, question } = body;

    if (!productId || !question?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Product and question are required.",
        },
        { status: 400 }
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
        { status: 404 }
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
        { status: 404 }
      );
    }

    const newQuestion = await prisma.productQuestion.create({
      data: {
        question: question.trim(),
        userId: user.id,
        productId: product.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Question submitted successfully.",
        question: newQuestion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Question creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit question.",
      },
      { status: 500 }
    );
  }
}