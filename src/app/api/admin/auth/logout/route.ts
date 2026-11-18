import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session cleared",
  });
  clearAdminSessionCookie(response);
  return response;
}
