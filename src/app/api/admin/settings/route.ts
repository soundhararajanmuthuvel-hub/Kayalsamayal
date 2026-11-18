import { NextResponse } from "next/server";
import { fetchAdminSettings, saveAdminSettings } from "@/lib/admin-api";

export async function GET() {
  try {
    const res = await fetchAdminSettings();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const settings = body?.settings || body;
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ success: false, error: "Settings object is required" }, { status: 400 });
    }

    const res = await saveAdminSettings(settings);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
