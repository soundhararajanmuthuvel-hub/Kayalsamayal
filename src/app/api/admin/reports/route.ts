import { NextResponse } from "next/server";
import { fetchAdminOrders } from "@/lib/admin-api";

export async function GET() {
  try {
    const res = await fetchAdminOrders();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    const orders = res.orders;

    // 1. Daily sales (last 14 days)
    const dailySalesMap: Record<string, { date: string; revenue: number; ordersCount: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailySalesMap[key] = { date: key, revenue: 0, ordersCount: 0 };
    }

    // 2. Monthly sales (current year)
    const monthlySalesMap: Record<string, { month: string; revenue: number; ordersCount: number }> = {};

    // 3. Product sales aggregation
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

    // 4. Coupon stats
    const couponStats: Record<string, { code: string; uses: number; totalDiscount: number }> = {};

    // 5. Payment breakdown
    const paymentBreakdown = {
      razorpay: { count: 0, amount: 0 },
      cod: { count: 0, amount: 0 },
      free: { count: 0, amount: 0 },
    };

    orders.forEach((o) => {
      const amt = o.finalAmount || o.amount || 0;
      const isPaid = o.paymentStatus === "Paid";
      const dateKey = o.timestamp ? o.timestamp.slice(0, 10) : "";
      const monthKey = o.timestamp ? o.timestamp.slice(0, 7) : "";

      if (dateKey && dailySalesMap[dateKey]) {
        dailySalesMap[dateKey].ordersCount++;
        if (isPaid) dailySalesMap[dateKey].revenue += amt;
      }

      if (monthKey) {
        if (!monthlySalesMap[monthKey]) {
          monthlySalesMap[monthKey] = { month: monthKey, revenue: 0, ordersCount: 0 };
        }
        monthlySalesMap[monthKey].ordersCount++;
        if (isPaid) monthlySalesMap[monthKey].revenue += amt;
      }

      // Products
      (o.items || []).forEach((item) => {
        const pName = item.name || "Item";
        if (!productStats[pName]) {
          productStats[pName] = { name: pName, quantity: 0, revenue: 0 };
        }
        productStats[pName].quantity += (item.quantity || 1);
        if (isPaid) {
          productStats[pName].revenue += (item.total || (item.unitPrice * (item.quantity || 1)));
        }
      });

      // Coupons
      if (o.couponCode) {
        const cCode = o.couponCode.toUpperCase();
        if (!couponStats[cCode]) {
          couponStats[cCode] = { code: cCode, uses: 0, totalDiscount: 0 };
        }
        couponStats[cCode].uses++;
        couponStats[cCode].totalDiscount += (o.discount || 0);
      }

      // Methods
      if (o.paymentMethod === "COD") {
        paymentBreakdown.cod.count++;
        paymentBreakdown.cod.amount += amt;
      } else if (o.paymentMethod === "Free Order") {
        paymentBreakdown.free.count++;
      } else {
        paymentBreakdown.razorpay.count++;
        if (isPaid) paymentBreakdown.razorpay.amount += amt;
      }
    });

    const dailySales = Object.values(dailySalesMap);
    const monthlySales = Object.values(monthlySalesMap).sort((a, b) => a.month.localeCompare(b.month));
    const bestsellingProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const topCoupons = Object.values(couponStats).sort((a, b) => b.uses - a.uses);

    return NextResponse.json({
      success: true,
      dailySales,
      monthlySales,
      bestsellingProducts,
      topCoupons,
      paymentBreakdown,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
