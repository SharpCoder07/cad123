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
          message: "You must be logged in to answer a question.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { questionId, answer } = body;

    if (!questionId || !answer?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Question and answer are required.",
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

    const question = await prisma.productQuestion.findUnique({
      where: {
        id: Number(questionId),
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    const newAnswer = await prisma.productAnswer.create({
      data: {
        answer: answer.trim(),
        userId: user.id,
        questionId: question.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Answer submitted successfully.",
        answer: newAnswer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Answer creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit answer.",
      },
      { status: 500 }
    );
  }
}