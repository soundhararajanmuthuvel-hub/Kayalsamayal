import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams?.orderId;

    if (!orderId || !orderId.trim()) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const orderResult = await getOrder(orderId.trim());

    if (!orderResult || !orderResult.success || !orderResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: orderResult?.message || "Order not found in database.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orderResult.data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error retrieving order.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
