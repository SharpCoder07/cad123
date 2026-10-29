import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export const runtime = "nodejs";

const PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 },
    );
  }

  console.error("Admin activity API error:", error);

  return NextResponse.json(
    { success: false, message: "Internal server error." },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const searchParams = request.nextUrl.searchParams;

    const pageParam = searchParams.get("page") ?? "1";
    const limitParam = searchParams.get("limit") ?? String(PAGE_SIZE);

    if (!/^[1-9]\d*$/.test(pageParam) || !/^[1-9]\d*$/.test(limitParam)) {
      return NextResponse.json(
        {
          success: false,
          message: "Page and limit must be positive integers.",
        },
        { status: 400 },
      );
    }

    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(limit) ||
      limit > MAX_PAGE_SIZE ||
      (page - 1) * limit > Number.MAX_SAFE_INTEGER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pagination parameters.",
        },
        { status: 400 },
      );
    }

    const where = {
      userId: admin.userId,
    };

    const [activities, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          description: true,
          status: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
