import { NextResponse } from "next/server";
import { fetchAdminOrders } from "@/lib/admin-api";

function escapeCsv(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const res = await fetchAdminOrders();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    const headers = [
      "Order ID",
      "Order Date",
      "Customer Name",
      "Phone",
      "Email",
      "Delivery Address",
      "Order Items",
      "Subtotal",
      "Discount",
      "Coupon Code",
      "Final Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Payment ID",
      "Signature Verified",
      "Coupon Note",
    ];

    const rows = res.orders.map((o) => [
      escapeCsv(o.orderId),
      escapeCsv(o.timestamp),
      escapeCsv(o.customerName),
      escapeCsv(o.phone),
      escapeCsv(o.email),
      escapeCsv(o.address),
      escapeCsv(o.itemsNotes),
      escapeCsv(o.subtotal),
      escapeCsv(o.discount),
      escapeCsv(o.couponCode || ""),
      escapeCsv(o.finalAmount || o.amount),
      escapeCsv(o.paymentMethod),
      escapeCsv(o.paymentStatus),
      escapeCsv(o.status),
      escapeCsv(o.paymentId),
      escapeCsv(o.signatureVerified),
      escapeCsv(o.couponNote || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kayal_samayal_orders_${dateStr}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
