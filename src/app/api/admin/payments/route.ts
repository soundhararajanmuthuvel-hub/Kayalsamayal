import { NextResponse } from "next/server";
import { fetchAdminOrders } from "@/lib/admin-api";

export async function GET() {
  try {
    const res = await fetchAdminOrders();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    const orders = res.orders;

    let razorpaySuccessCount = 0;
    let razorpaySuccessAmount = 0;
    let razorpayFailedCount = 0;
    let codOrdersCount = 0;
    let codOrdersAmount = 0;
    let pendingPaymentAmount = 0;
    let freeOrdersCount = 0;

    const transactions = orders.map((o) => {
      const amt = o.finalAmount || o.amount || 0;
      const isRzp = o.paymentMethod === "Razorpay Online";
      const isCod = o.paymentMethod === "COD";
      const isFree = o.paymentMethod === "Free Order";

      if (isRzp) {
        if (o.paymentStatus === "Paid") {
          razorpaySuccessCount++;
          razorpaySuccessAmount += amt;
        } else if (o.paymentStatus === "Failed") {
          razorpayFailedCount++;
        } else {
          pendingPaymentAmount += amt;
        }
      } else if (isCod) {
        codOrdersCount++;
        codOrdersAmount += amt;
      } else if (isFree) {
        freeOrdersCount++;
      }

      return {
        orderId: o.orderId,
        paymentId: o.paymentId,
        date: o.timestamp,
        customerName: o.customerName,
        phone: o.phone,
        method: o.paymentMethod,
        status: o.paymentStatus,
        signatureVerified: o.signatureVerified,
        amount: amt,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalTransactions: transactions.length,
        razorpaySuccessCount,
        razorpaySuccessAmount: Math.round(razorpaySuccessAmount),
        razorpayFailedCount,
        codOrdersCount,
        codOrdersAmount: Math.round(codOrdersAmount),
        pendingPaymentAmount: Math.round(pendingPaymentAmount),
        freeOrdersCount,
      },
      transactions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
