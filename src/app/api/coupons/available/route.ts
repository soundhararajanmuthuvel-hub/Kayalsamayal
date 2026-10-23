import { NextResponse } from "next/server";
import { fetchPublicCoupons } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const liveCoupons = await fetchPublicCoupons();
    return NextResponse.json({
      success: true,
      coupons: Array.isArray(liveCoupons) ? liveCoupons : [],
    });
  } catch (err) {
    console.error("Failed to fetch available coupons from Google Sheets:", err);
    return NextResponse.json({
      success: false,
      coupons: [],
      error: "Unable to load coupons from sheet.",
    });
  }
}
