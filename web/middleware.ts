import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidAdminCookieValue } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await isValidAdminCookieValue(cookie);

  if (!authed && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (authed && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
