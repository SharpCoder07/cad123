import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminPermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth-guards";

export const runtime = "nodejs";

type PageInput = {
  title?: unknown;
  slug?: unknown;
  description?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  seoImage?: unknown;
};

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, message: "A page with this slug already exists." }, { status: 409 });
  }
  console.error("Website pages API error:", error);
  return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
}

function optionalString(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`${name} must be a string of at most ${maxLength} characters.`);
  }
  return value.trim() || null;
}

// These routes already belong to the application and must not be overwritten by CMS pages.
const RESERVED_SLUGS = new Set([
  "admin", "api", "vendor", "login", "register", "auth", "_next", "products",
  "product", "categories", "brands", "blog", "contact", "about", "search",
]);

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("website_builder.view");
    const params = request.nextUrl.searchParams;
    const pageRaw = Number(params.get("page") ?? "1");
    const limitRaw = Number(params.get("limit") ?? "10");
    if (!Number.isSafeInteger(pageRaw) || pageRaw < 1 || !Number.isSafeInteger(limitRaw) || limitRaw < 1) {
      return NextResponse.json({ success: false, message: "Invalid pagination parameters." }, { status: 400 });
    }
    const page = pageRaw;
    const limit = Math.min(limitRaw, 100);
    const search = (params.get("search") ?? "").trim().slice(0, 120);
    const status = params.get("status");
    if (status && !["ACTIVE", "ARCHIVED", "published", "unpublished"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status filter." }, { status: 400 });
    }

    const where: Prisma.WebsitePageWhereInput = {
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ] } : {}),
      ...(status === "ACTIVE" || status === "ARCHIVED" ? { status } : {}),
      ...(status === "published" ? { publishedVersion: { not: null } } : {}),
      ...(status === "unpublished" ? { publishedVersion: null } : {}),
    };
    const [total, pages] = await prisma.$transaction([
      prisma.websitePage.count({ where }),
      prisma.websitePage.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, slug: true, title: true, description: true,
          status: true, publishedVersion: true, seoTitle: true,
          createdAt: true, updatedAt: true,
          _count: { select: { versions: true } },
        },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      success: true,
      data: pages,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminPermission("website_builder.create");
    let body: PageInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Request body must be an object." }, { status: 400 });
    }
    if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 150) {
      return NextResponse.json({ success: false, message: "Title must be 1–150 characters." }, { status: 400 });
    }
    if (typeof body.slug !== "string") {
      return NextResponse.json({ success: false, message: "Slug is required." }, { status: 400 });
    }
    const slug = body.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!slug || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ success: false, message: "Use a unique, non-reserved slug with lowercase letters, numbers and hyphens." }, { status: 400 });
    }

    let description: string | null;
    let seoTitle: string | null;
    let seoDescription: string | null;
    let seoImage: string | null;
    try {
      description = optionalString(body.description, "Description", 1000);
      seoTitle = optionalString(body.seoTitle, "SEO title", 160);
      seoDescription = optionalString(body.seoDescription, "SEO description", 320);
      seoImage = optionalString(body.seoImage, "SEO image", 2048);
      if (seoImage && !seoImage.startsWith("/") && !/^https:\/\//i.test(seoImage)) {
        throw new Error("SEO image must be an absolute HTTPS URL or an internal path.");
      }
    } catch (error) {
      return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 });
    }

    const created = await prisma.websitePage.create({
      data: {
        title: body.title.trim(), slug, description, seoTitle, seoDescription, seoImage,
        status: "ACTIVE",
        // No publishedVersion until an authorized publish action is performed.
        versions: { create: { version: 1, status: "DRAFT", createdById: admin.userId } },
      },
      include: { versions: { select: { id: true, version: true, status: true } } },
    });
    return NextResponse.json({ success: true, message: "Draft page created.", data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
