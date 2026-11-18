import { NextResponse } from "next/server";
import { updateAdminOrderStatus } from "@/lib/admin-api";
import { getAdminSession } from "@/lib/admin-auth";

const ALLOWED_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
  "Refunded",
  "Paid",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAdminSession();
    const adminUser = session?.username || "admin";

    const resolved = await Promise.resolve(params);
    const orderId = resolved?.id?.trim();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes, trackingNumber, courier } = body || {};

    if (!status || typeof status !== "string") {
      return NextResponse.json({ success: false, error: "New status is required" }, { status: 400 });
    }

    const matchedStatus = ALLOWED_STATUSES.find(
      (s) => s.toLowerCase() === status.trim().toLowerCase()
    );

    if (!matchedStatus) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updateRes = await updateAdminOrderStatus(
      orderId,
      matchedStatus,
      adminUser,
      notes,
      trackingNumber,
      courier
    );

    if (!updateRes.success) {
      return NextResponse.json({ success: false, error: updateRes.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: updateRes.message || `Order status updated to ${matchedStatus}`,
      orderId,
      status: matchedStatus,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
