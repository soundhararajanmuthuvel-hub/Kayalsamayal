import { NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createSessionToken,
  setAdminSessionCookie,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const isValid = verifyAdminCredentials(String(username), String(password));
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(String(username));
    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      user: { username: String(username), role: "admin" },
    });

    setAdminSessionCookie(response, token);
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
