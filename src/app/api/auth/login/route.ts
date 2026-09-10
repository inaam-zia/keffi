import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieConfig, resolveAdminLoginRole } from "@/lib/auth";
import { getAdminRoleCookieConfig, ROLE_HOME } from "@/lib/admin-role";

export async function POST(request: Request) {
  const { password } = await request.json();
  const role = await resolveAdminLoginRole(String(password || ""));

  if (!role) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const session = getAdminCookieConfig();
  const roleCookie = getAdminRoleCookieConfig(role);
  cookies().set(session);
  cookies().set(roleCookie);

  return NextResponse.json({ ok: true, role, redirect: ROLE_HOME[role] });
}
