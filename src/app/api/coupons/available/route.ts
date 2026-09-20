import { NextResponse } from "next/server";
import { fetchPublicCoupons } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveCoupons = await fetchPublicCoupons();

    if (liveCoupons && liveCoupons.length > 0) {
      return NextResponse.json({
        success: true,
        coupons: liveCoupons,
      });
    }

    // Default safe public fallback if sheet is empty or offline
    return NextResponse.json({
      success: true,
      coupons: [
        {
          code: "WELCOME10",
          discountType: "percentage",
          discountValue: 10,
          maximumDiscount: 100,
          minimumOrder: 299,
          active: true,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to fetch available coupons:", err);
    return NextResponse.json({
      success: true,
      coupons: [
        {
          code: "WELCOME10",
          discountType: "percentage",
          discountValue: 10,
          maximumDiscount: 100,
          minimumOrder: 299,
          active: true,
        },
      ],
    });
  }
}
