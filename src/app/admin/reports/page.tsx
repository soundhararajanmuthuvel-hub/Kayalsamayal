"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { Tag, Package, Loader2 } from "lucide-react";

interface ReportPayload {
  dailySales: Array<{ date: string; revenue: number; ordersCount: number }>;
  monthlySales: Array<{ month: string; revenue: number; ordersCount: number }>;
  bestsellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  topCoupons: Array<{ code: string; uses: number; totalDiscount: number }>;
  paymentBreakdown: {
    razorpay: { count: number; amount: number };
    cod: { count: number; amount: number };
    free: { count: number; amount: number };
  };
}

export default function AdminReportsPage() {
  const { registerRefreshHandler } = useAdmin();
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
    const unregister = registerRefreshHandler(fetchReports);
    return () => unregister();
  }, [fetchReports, registerRefreshHandler]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#0C2B1C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Sales & Financial Reports
        </h2>
        <p className="text-xs text-neutral-500">
          Generated from Google Sheets Orders data. Only verified paid payments count toward revenue.
        </p>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500">14-Day Sales Revenue</span>
          <p className="font-serif text-2xl font-bold text-[#0C2B1C] mt-2">
            ₹{(data?.dailySales.reduce((acc, d) => acc + d.revenue, 0) || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Verified online payments</p>
        </div>

        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500">14-Day Order Volume</span>
          <p className="font-serif text-2xl font-bold text-[#0C2B1C] mt-2">
            {data?.dailySales.reduce((acc, d) => acc + d.ordersCount, 0) || 0} orders
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Total placed across all methods</p>
        </div>

        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500">COD Total Recorded</span>
          <p className="font-serif text-2xl font-bold text-amber-800 mt-2">
            ₹{(data?.paymentBreakdown.cod.amount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {data?.paymentBreakdown.cod.count || 0} Cash on Delivery orders
          </p>
        </div>
      </div>

      {/* Daily Sales Breakdown Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#E8E2D8] px-5 py-4">
          <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
            Daily Sales Activity (Last 14 Days)
          </h3>
          <p className="text-xs text-neutral-500">
            Day-by-day sales volume and revenue
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Orders Placed</th>
                <th className="px-4 py-3 text-right">Verified Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {(data?.dailySales || []).map((d) => (
                <tr key={d.date} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5 font-medium text-neutral-900">{d.date}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-neutral-800">{d.ordersCount}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-[#0C2B1C]">
                    ₹{d.revenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Bestselling Products & Coupon Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestselling Products */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-[#8C5E28]" />
            <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
              Bestselling Products
            </h3>
          </div>
          <div className="space-y-2">
            {(data?.bestsellingProducts || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] text-xs">
                <div>
                  <p className="font-bold text-neutral-900">{p.name}</p>
                  <p className="text-[10px] text-neutral-500">{p.quantity} units sold</p>
                </div>
                <span className="font-bold text-emerald-800">
                  ₹{p.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            {(!data?.bestsellingProducts || data.bestsellingProducts.length === 0) && (
              <p className="text-xs text-neutral-400">No product sales yet</p>
            )}
          </div>
        </div>

        {/* Coupon Performance */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-[#8C5E28]" />
            <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
              Coupon Performance (ROI)
            </h3>
          </div>
          <div className="space-y-2">
            {(data?.topCoupons || []).map((c) => (
              <div key={c.code} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] text-xs">
                <div>
                  <span className="font-mono font-bold text-[#0C2B1C] bg-[#FAF4ED] px-2 py-0.5 rounded border border-[#D4A373]/30">
                    {c.code}
                  </span>
                  <p className="text-[10px] text-neutral-500 mt-1">{c.uses} orders applied</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-700">-₹{c.totalDiscount.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-neutral-400">Total customer savings</p>
                </div>
              </div>
            ))}
            {(!data?.topCoupons || data.topCoupons.length === 0) && (
              <p className="text-xs text-neutral-400">No coupon usage recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
