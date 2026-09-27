import { NextResponse } from "next/server";
import { getSettings } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const res = await getSettings();
    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      {
        success: false,
        settings: {
          cod_enabled: false,
          shipping_charge: 60,
          free_shipping_threshold: 500,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}
