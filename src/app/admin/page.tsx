"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminShell";
import { AdminOrder } from "@/lib/admin-api";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CreditCard,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  codOrders: number;
  razorpayOrders: number;
}

interface ReportData {
  dailySales: Array<{ date: string; revenue: number; ordersCount: number }>;
  bestsellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  paymentBreakdown: {
    razorpay: { count: number; amount: number };
    cod: { count: number; amount: number };
    free: { count: number; amount: number };
  };
}

export default function AdminDashboardPage() {
  const { registerRefreshHandler } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [ordersRes, reportsRes] = await Promise.all([
      fetch("/api/admin/orders?limit=8"),
      fetch("/api/admin/reports"),
    ]);

    const ordersData = await ordersRes.json();
    const reportsData = await reportsRes.json();

    if (ordersData.success) {
      setStats(ordersData.stats);
      setRecentOrders(ordersData.orders || []);
    } else {
      setError(ordersData.error || "Failed to load order statistics");
    }

    if (reportsData.success) {
      setReport(reportsData);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/orders?limit=8").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
    ])
      .then(([ordersData, reportsData]) => {
        if (!active) return;
        if (ordersData.success) {
          setStats(ordersData.stats);
          setRecentOrders(ordersData.orders || []);
        } else {
          setError(ordersData.error || "Failed to load order statistics");
        }
        if (reportsData.success) {
          setReport(reportsData);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error connecting to database");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unregister = registerRefreshHandler(loadData);
    return () => {
      active = false;
      unregister();
    };
  }, [loadData, registerRefreshHandler]);

  if (loading && !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#0C2B1C]" />
        <p className="text-sm font-medium">Syncing live records from Google Sheets...</p>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(
    1,
    ...(report?.dailySales?.map((d) => d.revenue) || [1000])
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── TOP KPI METRIC CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Verified Paid Revenue */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Verified Paid Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#0C2B1C]">
              ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">
            From verified successful payments only
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#8C5E28]">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#0C2B1C]">
              {stats?.totalOrders || 0}
            </span>
            <span className="text-xs font-medium text-neutral-500">
              ({stats?.todayOrders || 0} today)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Recorded in Google Sheets &ldquo;Orders&rdquo;
          </p>
        </div>

        {/* Pending Orders / Action Needed */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Pending Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-700">
              {stats?.pendingOrders || 0}
            </span>
            <span className="text-xs font-medium text-neutral-500">
              + {stats?.confirmedOrders || 0} confirmed
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Awaiting processing or shipment
          </p>
        </div>

        {/* COD Orders & Pending Payment */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">COD & Pending Amount</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-blue-900">
              ₹{(stats?.pendingRevenue || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {stats?.codOrders || 0} Cash on Delivery orders
          </p>
        </div>
      </div>

      {/* ── ORDER STATUS LIFECYCLE PILLS ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Processing</p>
          <p className="text-lg font-bold text-sky-800">{stats?.processingOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Packed</p>
          <p className="text-lg font-bold text-indigo-800">{stats?.packedOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Shipped</p>
          <p className="text-lg font-bold text-amber-800">{stats?.shippedOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Delivered</p>
          <p className="text-lg font-bold text-emerald-800">{stats?.deliveredOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Cancelled</p>
          <p className="text-lg font-bold text-rose-800">{stats?.cancelledOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-[#E8E2D8] bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-neutral-500">Razorpay Online</p>
          <p className="text-lg font-bold text-[#0C2B1C]">{stats?.razorpayOrders || 0}</p>
        </div>
      </div>

      {/* ── SALES OVERVIEW & PAYMENT BREAKDOWN ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Overview Chart (14 Days) */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-base font-bold text-[#0C2B1C]">
                Sales Overview (Last 14 Days)
              </h2>
              <p className="text-xs text-neutral-500">
                Daily verified revenue from actual Google Sheet orders
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-1 text-xs font-semibold text-[#8C5E28] hover:underline"
            >
              <span>Full Analytics</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4">
            <div className="flex h-44 items-end gap-1.5 sm:gap-2">
              {(report?.dailySales || []).map((day, idx) => {
                const heightPercent = Math.max(8, Math.round((day.revenue / maxDailyRevenue) * 100));
                const dayLabel = day.date.slice(8); // dd
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 hidden group-hover:flex z-10 flex-col items-center rounded bg-[#0C2B1C] px-2 py-1 text-[10px] text-white shadow-lg whitespace-nowrap">
                      <span>{day.date}</span>
                      <span className="font-bold">₹{day.revenue.toLocaleString("en-IN")} ({day.ordersCount} orders)</span>
                    </div>

                    <div className="w-full flex items-end justify-center h-36">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[24px] rounded-t-sm transition-all duration-300 ${
                          day.revenue > 0
                            ? "bg-[#0C2B1C] group-hover:bg-[#16452E]"
                            : "bg-neutral-200"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown & Popular Products */}
        <div className="space-y-6">
          {/* Payment Method Card */}
          <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
            <h2 className="font-serif text-base font-bold text-[#0C2B1C] mb-3">
              Payment Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0C2B1C]" />
                  Razorpay Online
                </span>
                <span className="font-semibold text-neutral-900">
                  {report?.paymentBreakdown.razorpay.count || 0} orders (₹
                  {(report?.paymentBreakdown.razorpay.amount || 0).toLocaleString("en-IN")})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                  Cash on Delivery
                </span>
                <span className="font-semibold text-neutral-900">
                  {report?.paymentBreakdown.cod.count || 0} orders (₹
                  {(report?.paymentBreakdown.cod.amount || 0).toLocaleString("en-IN")})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" />
                  Free / Promo Orders
                </span>
                <span className="font-semibold text-neutral-900">
                  {report?.paymentBreakdown.free.count || 0} orders
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
            <h2 className="font-serif text-base font-bold text-[#0C2B1C] mb-3">
              Popular Products
            </h2>
            <div className="space-y-2">
              {(report?.bestsellingProducts || []).slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-none">
                  <span className="truncate max-w-[180px] font-medium text-neutral-800">
                    {p.name}
                  </span>
                  <span className="font-semibold text-[#8C5E28]">
                    {p.quantity} units
                  </span>
                </div>
              ))}
              {(!report?.bestsellingProducts || report.bestsellingProducts.length === 0) && (
                <p className="text-xs text-neutral-400">No product sales yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ORDERS TABLE ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] px-5 py-4">
          <div>
            <h2 className="font-serif text-base font-bold text-[#0C2B1C]">
              Recent Orders
            </h2>
            <p className="text-xs text-neutral-500">
              Live orders recorded in Google Sheets
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 rounded-lg border border-[#E8E2D8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0C2B1C] hover:bg-neutral-50 transition-colors"
          >
            <span>View All Orders</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-600 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {recentOrders.map((order) => {
                const isPaid = order.paymentStatus === "Paid";
                const isCod = order.paymentMethod === "COD";

                return (
                  <tr key={order.orderId} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.orderId)}`}
                        className="text-[#0C2B1C] hover:underline font-bold"
                      >
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {order.timestamp ? order.timestamp.slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{order.customerName || "Customer"}</p>
                      <p className="text-[11px] text-neutral-400">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-neutral-600" title={order.itemsNotes}>
                      {order.itemsNotes || "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-900">
                      ₹{(order.finalAmount || order.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isCod
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                        }`}
                      >
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          order.status.toLowerCase().includes("delivered")
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status.toLowerCase().includes("cancel")
                            ? "bg-rose-100 text-rose-800"
                            : order.status.toLowerCase().includes("ship")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.orderId)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                      >
                        <span>Details</span>
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                    No orders found in Google Sheets database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
