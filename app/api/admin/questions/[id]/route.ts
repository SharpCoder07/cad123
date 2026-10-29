import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const questionId = Number(id);

    if (Number.isNaN(questionId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid question ID.",
        },
        { status: 400 }
      );
    }

    const question = await prisma.productQuestion.findUnique({
      where: {
        id: questionId,
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

    await prisma.$transaction([
      prisma.productAnswer.deleteMany({
        where: {
          questionId,
        },
      }),

      prisma.productQuestion.delete({
        where: {
          id: questionId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Delete question error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete question.",
      },
      { status: 500 }
    );
  }
}