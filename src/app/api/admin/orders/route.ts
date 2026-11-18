import { NextResponse } from "next/server";
import { fetchAdminOrders, AdminOrder } from "@/lib/admin-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase().trim() || "all";
    const paymentStatusFilter = searchParams.get("paymentStatus")?.toLowerCase().trim() || "all";
    const paymentMethodFilter = searchParams.get("paymentMethod")?.toLowerCase().trim() || "all";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));

    const result = await fetchAdminOrders();
    if (!result.success && result.orders.length === 0 && !result.error?.includes("not configured")) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch orders" },
        { status: 502 }
      );
    }

    const allOrders = result.orders;

    // ── COMPUTE SUMMARY STATISTICS (Always from 100% of live sheet orders) ──
    const todayStr = new Date().toISOString().slice(0, 10);
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let todayOrdersCount = 0;
    let codOrdersCount = 0;
    let razorpayOrdersCount = 0;

    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    allOrders.forEach((o) => {
      const orderDateStr = o.timestamp ? o.timestamp.slice(0, 10) : "";
      if (orderDateStr === todayStr) {
        todayOrdersCount++;
      }

      const st = (o.status || o.orderStatus || "").toLowerCase();
      if (st.includes("pending")) statusCounts.pending++;
      else if (st.includes("confirm")) statusCounts.confirmed++;
      else if (st.includes("process")) statusCounts.processing++;
      else if (st.includes("pack")) statusCounts.packed++;
      else if (st.includes("ship")) statusCounts.shipped++;
      else if (st.includes("deliver")) statusCounts.delivered++;
      else if (st.includes("cancel")) statusCounts.cancelled++;
      else statusCounts.pending++;

      if (o.paymentMethod === "COD") {
        codOrdersCount++;
      } else {
        razorpayOrdersCount++;
      }

      const amountVal = o.finalAmount || o.amount || 0;
      if (o.paymentStatus === "Paid") {
        totalRevenue += amountVal;
      } else if (o.paymentStatus === "Pending") {
        pendingRevenue += amountVal;
      }
    });

    // ── APPLY USER FILTERS ──────────────────────────────────────────────────
    let filtered: AdminOrder[] = allOrders.filter((o) => {
      // 1. Text Search
      if (search) {
        const matchesId = (o.orderId || "").toLowerCase().includes(search);
        const matchesName = (o.customerName || "").toLowerCase().includes(search);
        const matchesPhone = (o.phone || "").toLowerCase().includes(search);
        const matchesPaymentId = (o.paymentId || "").toLowerCase().includes(search);
        if (!matchesId && !matchesName && !matchesPhone && !matchesPaymentId) {
          return false;
        }
      }

      // 2. Quick Status filter
      if (statusFilter && statusFilter !== "all") {
        const st = (o.status || o.orderStatus || "").toLowerCase();
        if (!st.includes(statusFilter)) return false;
      }

      // 3. Payment Status filter
      if (paymentStatusFilter && paymentStatusFilter !== "all") {
        if (o.paymentStatus.toLowerCase() !== paymentStatusFilter) return false;
      }

      // 4. Payment Method filter
      if (paymentMethodFilter && paymentMethodFilter !== "all") {
        if (!o.paymentMethod.toLowerCase().includes(paymentMethodFilter)) return false;
      }

      // 5. Date Range
      if (startDate && o.timestamp) {
        if (o.timestamp.slice(0, 10) < startDate) return false;
      }
      if (endDate && o.timestamp) {
        if (o.timestamp.slice(0, 10) > endDate) return false;
      }

      return true;
    });

    // ── SORTING ─────────────────────────────────────────────────────────────
    filtered = [...filtered].sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sort === "amount_high") {
        return (b.finalAmount || b.amount) - (a.finalAmount || a.amount);
      }
      if (sort === "amount_low") {
        return (a.finalAmount || a.amount) - (b.finalAmount || b.amount);
      }
      // default: newest first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // ── PAGINATION ──────────────────────────────────────────────────────────
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedOrders = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders: allOrders.length,
        todayOrders: todayOrdersCount,
        pendingOrders: statusCounts.pending,
        confirmedOrders: statusCounts.confirmed,
        processingOrders: statusCounts.processing,
        packedOrders: statusCounts.packed,
        shippedOrders: statusCounts.shipped,
        deliveredOrders: statusCounts.delivered,
        cancelledOrders: statusCounts.cancelled,
        totalRevenue: Math.round(totalRevenue),
        pendingRevenue: Math.round(pendingRevenue),
        codOrders: codOrdersCount,
        razorpayOrders: razorpayOrdersCount,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      orders: paginatedOrders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
