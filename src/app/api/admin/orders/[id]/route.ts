import { NextResponse } from "next/server";
import { fetchAdminOrders } from "@/lib/admin-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const orderId = resolved?.id?.trim();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const res = await fetchAdminOrders();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    const order = res.orders.find(
      (o) =>
        o.orderId.toLowerCase() === orderId.toLowerCase() ||
        o.paymentId.toLowerCase() === orderId.toLowerCase()
    );

    if (!order) {
      return NextResponse.json({ success: false, error: `Order ${orderId} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
