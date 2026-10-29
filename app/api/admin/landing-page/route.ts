import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";

const landingPages = [
  { permission: "dashboard.view", href: "/admin" },
  { permission: "products.view", href: "/admin/products" },
  { permission: "features.view", href: "/admin/features" },
  {
    permission: "specifications.view",
    href: "/admin/specifications",
  },
  { permission: "brands.view", href: "/admin/brands" },
  { permission: "categories.view", href: "/admin/categories" },
  { permission: "reviews.view", href: "/admin/reviews" },
  { permission: "questions.view", href: "/admin/questions" },
  { permission: "enquiries.view", href: "/admin/enquiries" },
  {
    permission: "contact_messages.view",
    href: "/admin/contact-messages",
  },
  { permission: "blog_posts.view", href: "/admin/blog-posts" },
  { permission: "users.view", href: "/admin/users" },
  { permission: "vendors.view", href: "/admin/vendors" },
  {
    permission: "website_design.view",
    href: "/admin/website-design",
  },
  { permission: "roles.view", href: "/admin/roles" },
];

export async function GET() {
  try {
    const admin = await requireAdmin();
    const permissions = new Set(admin.permissions);

    const landingPage = landingPages.find((page) =>
      permissions.has(page.permission),
    );

    return NextResponse.json(
      {
        success: true,
        redirectUrl: landingPage?.href ?? null,
        permissions: [...admin.permissions].sort(),
        adminRoleName: admin.adminRole.name,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    console.error("Admin landing page error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
