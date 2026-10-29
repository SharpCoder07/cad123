// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authResult = await requireAdminApi(["users.manage"]);
  if (!authResult.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: "ok" });
}