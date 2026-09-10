import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRole, roleCanAccessPath } from "@/lib/admin-role";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get("cafe_admin_session");
  if (session?.value !== "authenticated") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const roleCookie = request.cookies.get("cafe_admin_role")?.value;
  const role = isAdminRole(roleCookie) ? roleCookie : "owner";
  if (!roleCanAccessPath(role, pathname)) {
    const home = role === "kitchen" ? "/admin/kitchen" : "/admin/orders";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
