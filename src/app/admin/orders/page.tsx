"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminShell";
import { AdminOrder, fetchAdminOrders, exportOrdersToCsv } from "@/lib/admin-api";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

const QUICK_TABS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const { registerRefreshHandler, codEnabled, isTogglingCod, toggleCod } = useAdmin();
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetchAdminOrders();
      if (res.success) {
        setAllOrders(res.orders || []);
      } else {
        setError(res.error || "Failed to load orders from Google Sheets");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error reading orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminOrders()
      .then((res) => {
        if (!active) return;
        if (res.success) {
          setAllOrders(res.orders || []);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error loading orders");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unregister = registerRefreshHandler(loadOrders);
    return () => {
      active = false;
      unregister();
    };
  }, [loadOrders, registerRefreshHandler]);

  // Client-side filtering & sorting
  const filteredOrders = useMemo(() => {
    return allOrders
      .filter((o) => {
        // 1. Text search
        if (search) {
          const q = search.toLowerCase();
          const matchesId = (o.orderId || "").toLowerCase().includes(q);
          const matchesName = (o.customerName || "").toLowerCase().includes(q);
          const matchesPhone = (o.phone || "").toLowerCase().includes(q);
          const matchesPayId = (o.paymentId || "").toLowerCase().includes(q);
          if (!matchesId && !matchesName && !matchesPhone && !matchesPayId) return false;
        }

        // 2. Tab filter
        if (activeTab !== "all") {
          const st = (o.status || o.orderStatus || "").toLowerCase();
          if (!st.includes(activeTab)) return false;
        }

        // 3. Payment Status filter
        if (paymentStatus !== "all") {
          if (o.paymentStatus.toLowerCase() !== paymentStatus) return false;
        }

        // 4. Payment Method filter
        if (paymentMethod !== "all") {
          if (!o.paymentMethod.toLowerCase().includes(paymentMethod)) return false;
        }

        // 5. Date filters
        if (startDate && o.timestamp && o.timestamp.slice(0, 10) < startDate) return false;
        if (endDate && o.timestamp && o.timestamp.slice(0, 10) > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sort === "oldest") {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (sort === "amount_high") {
          return (b.finalAmount || b.amount) - (a.finalAmount || a.amount);
        }
        if (sort === "amount_low") {
          return (a.finalAmount || a.amount) - (b.finalAmount || b.amount);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [allOrders, search, activeTab, paymentStatus, paymentMethod, startDate, endDate, sort]);

  const totalPages = Math.ceil(filteredOrders.length / limit) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredOrders.slice(start, start + limit);
  }, [filteredOrders, page, limit]);

  const handleExportCsv = () => {
    exportOrdersToCsv(filteredOrders);
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER ACTIONS & EXPORT ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
            Live Orders ({filteredOrders.length})
          </h2>
          <p className="text-xs text-neutral-500">
            Real-time synchronization with Google Sheets &ldquo;Orders&rdquo;
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Cash on Delivery (COD) On/Off Toggle Button */}
          <button
            onClick={toggleCod}
            disabled={isTogglingCod}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              codEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
            title={`Cash on Delivery is currently ${codEnabled ? "ACTIVE (ON)" : "DISABLED (OFF)"} on checkout. Click to toggle.`}
          >
            <span className="text-[11px] text-neutral-600">Cash on Delivery:</span>
            <span
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                codEnabled ? "bg-emerald-600" : "bg-rose-500"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${
                  codEnabled ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className="font-bold">
              {isTogglingCod ? "Updating..." : codEnabled ? "COD ON" : "COD OFF"}
            </span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#0C2B1C] bg-[#0C2B1C] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── QUICK FILTER TABS ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E8E2D8] pb-1 scrollbar-none">
        {QUICK_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                isActive
                  ? "border-b-2 border-[#0C2B1C] text-[#0C2B1C] bg-white"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── ADVANCED FILTERS TOOLBAR ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#E8E2D8] bg-white p-3 shadow-2xs sm:grid-cols-2 lg:grid-cols-6">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order ID, name, phone..."
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 pl-8 pr-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
          />
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-2.5 text-xs text-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="razorpay">Razorpay Online</option>
            <option value="cod">Cash on Delivery</option>
            <option value="free">Free Order</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-2.5 text-xs text-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Date From & To */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-2 text-[11px] text-neutral-700 focus:outline-hidden"
            title="Start Date"
          />
          <span className="text-neutral-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-2 text-[11px] text-neutral-700 focus:outline-hidden"
            title="End Date"
          />
        </div>

        {/* Sort & Limit */}
        <div className="flex items-center gap-1">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-2 text-xs text-neutral-700 focus:outline-hidden"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="amount_high">Amount (High)</option>
            <option value="amount_low">Amount (Low)</option>
          </select>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-16 rounded-lg border border-[#E8E2D8] bg-[#FDFBF7] py-1.5 px-1.5 text-xs text-neutral-700 focus:outline-hidden"
            title="Rows per page"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* ── COMPLETE ORDERS TABLE ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-3 py-3">Order ID</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Products & Qty</th>
                <th className="px-3 py-3">Subtotal</th>
                <th className="px-3 py-3">Discount</th>
                <th className="px-3 py-3">Coupon</th>
                <th className="px-3 py-3">Final Amount</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {paginatedOrders.map((o) => {
                const totalQty = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
                const isPaid = o.paymentStatus === "Paid";
                const isCod = o.paymentMethod === "COD";

                return (
                  <tr key={o.orderId} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-3 py-3 font-mono font-bold text-[#0C2B1C]">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(o.orderId)}`}
                        className="hover:underline"
                      >
                        {o.orderId}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-neutral-500 whitespace-nowrap">
                      {o.timestamp ? o.timestamp.slice(0, 10) : "—"}
                    </td>
                    <td className="px-3 py-3 font-medium text-neutral-900">
                      {o.customerName || "Customer"}
                    </td>
                    <td className="px-3 py-3 text-neutral-600 font-mono">
                      {o.phone || "—"}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]" title={o.itemsNotes}>
                      <p className="truncate text-neutral-800 font-medium">
                        {o.itemsNotes || "—"}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Total items: {totalQty > 0 ? totalQty : 1}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      ₹{(o.subtotal || o.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-rose-700">
                      {o.discount > 0 ? `-₹${o.discount}` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {o.couponCode ? (
                        <span className="inline-flex rounded bg-[#FAF4ED] px-1.5 py-0.5 text-[10px] font-bold text-[#8C5E28] border border-[#D4A373]/40">
                          {o.couponCode}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-bold text-neutral-950 whitespace-nowrap">
                      ₹{(o.finalAmount || o.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isCod
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                          o.status.toLowerCase().includes("delivered")
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status.toLowerCase().includes("cancel")
                            ? "bg-rose-100 text-rose-800"
                            : o.status.toLowerCase().includes("ship")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(o.orderId)}`}
                        className="inline-flex items-center gap-1 rounded border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-neutral-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-neutral-500">
                    <Loader2 size={20} className="animate-spin inline-block mr-2 text-[#0C2B1C]" />
                    <span>Loading orders from Google Sheets...</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-[#E8E2D8] bg-[#FAF8F5] px-4 py-3">
          <div className="text-xs text-neutral-500">
            Showing Page <span className="font-semibold text-neutral-900">{page}</span> of{" "}
            <span className="font-semibold text-neutral-900">{totalPages}</span> ({filteredOrders.length} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-[#E8E2D8] bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-lg border border-[#E8E2D8] bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
