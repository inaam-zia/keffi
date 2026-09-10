import { NextResponse } from "next/server";
import { getAdminRole, isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ role: getAdminRole() });
}
