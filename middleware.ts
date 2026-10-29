import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: Request & { nextUrl: URL }) {
  const token = await getToken({
    req: req as any,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Not logged in
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in user but not an admin
  if (token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin is allowed
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};