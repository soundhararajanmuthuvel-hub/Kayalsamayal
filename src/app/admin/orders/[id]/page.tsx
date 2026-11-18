"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminOrder, fetchAdminOrders, updateAdminOrderStatus } from "@/lib/admin-api";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  User,
  Loader2,
} from "lucide-react";

const ORDER_STATUS_FLOW = [
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
];

export default function AdminOrderDetailPage() {
  const routeParams = useParams();
  const orderId = String(routeParams?.id || "");

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminOrders()
      .then((data) => {
        if (!active) return;
        if (data.success && Array.isArray(data.orders)) {
          const found = data.orders.find(
            (o) => o.orderId.toLowerCase() === decodeURIComponent(orderId).toLowerCase()
          );
          if (found) {
            setOrder(found);
            setSelectedStatus(found.status);
          } else {
            setError("Order not found in Google Sheets");
          }
        } else {
          setError(data.error || "Order not found");
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error fetching order");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setUpdating(true);
    setStatusMessage(null);

    try {
      const data = await updateAdminOrderStatus(
        order.orderId,
        selectedStatus,
        "admin",
        adminNotes,
        trackingNumber,
        courier
      );

      if (!data.success) {
        setStatusMessage({ type: "error", text: data.error || "Failed to update order status" });
      } else {
        setStatusMessage({ type: "success", text: data.message || "Order status updated successfully!" });
        setOrder((prev) => (prev ? { ...prev, status: selectedStatus, orderStatus: selectedStatus } : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#0C2B1C]" />
        <p className="text-sm font-medium">Fetching order details from Google Sheets...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft size={14} />
          <span>Back to All Orders</span>
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle size={32} className="mx-auto mb-2 text-rose-600" />
          <h3 className="font-bold text-base">Order Not Found</h3>
          <p className="text-xs text-rose-700 mt-1">{error || "Could not locate this order in the Google Sheet."}</p>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "Paid";
  const isCod = order.paymentMethod === "COD";

  return (
    <div className="space-y-6">
      {/* ── TOP ACTIONS & NAVIGATION (Hidden on Print) ──────────────────────── */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft size={14} />
          <span>Back to Orders</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-[#E8E2D8] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* ── INVOICE HEADER (Visible on Print and Screen) ────────────────────── */}
      <div className="rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-[#0C2B1C]">
                {order.orderId}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  order.status.toLowerCase().includes("delivered")
                    ? "bg-emerald-100 text-emerald-800"
                    : order.status.toLowerCase().includes("cancel")
                    ? "bg-rose-100 text-rose-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Placed on {order.timestamp ? new Date(order.timestamp).toLocaleString("en-IN") : "—"}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-neutral-500">Payable Amount</p>
            <p className="font-serif text-2xl font-bold text-[#0C2B1C]">
              ₹{(order.finalAmount || order.amount).toLocaleString("en-IN")}
            </p>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold mt-1 ${
                isPaid
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : isCod
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200"
              }`}
            >
              {order.paymentMethod} • {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* ── ORDER DETAILS GRID ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Customer Details Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C5E28]">
              <User size={14} />
              <span>Customer Information</span>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-[#FAF8F5] p-3 text-xs space-y-1.5 text-neutral-800">
              <p className="font-bold text-sm text-neutral-900">{order.customerName || "Customer"}</p>
              <p><span className="text-neutral-500">Phone:</span> {order.phone || "—"}</p>
              <p><span className="text-neutral-500">Email:</span> {order.email || "—"}</p>
              <div className="pt-1 border-t border-neutral-200/60">
                <p className="font-semibold text-neutral-600 mb-0.5">Shipping Address:</p>
                <p className="whitespace-pre-line text-neutral-700">{order.address || "No address provided"}</p>
              </div>
              {order.customerNotes && (
                <div className="pt-1 border-t border-neutral-200/60 text-amber-900 bg-amber-50/60 p-1.5 rounded">
                  <p className="font-semibold text-[10px] uppercase tracking-wide">Customer Notes:</p>
                  <p className="italic">{order.customerNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C5E28]">
              <CreditCard size={14} />
              <span>Payment Details</span>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-[#FAF8F5] p-3 text-xs space-y-1.5 text-neutral-800">
              <p><span className="text-neutral-500">Method:</span> <span className="font-semibold">{order.paymentMethod}</span></p>
              <p><span className="text-neutral-500">Status:</span> <span className="font-bold">{order.paymentStatus}</span></p>
              <p className="font-mono text-[11px] truncate" title={order.paymentId}>
                <span className="text-neutral-500">Payment ID:</span> {order.paymentId || "—"}
              </p>
              <p className="text-[11px]">
                <span className="text-neutral-500">Signature Verified:</span>{" "}
                <span className={`font-semibold ${order.signatureVerified === "Yes" ? "text-emerald-700" : "text-neutral-700"}`}>
                  {order.signatureVerified}
                </span>
              </p>
              {order.couponCode && (
                <div className="pt-1 border-t border-neutral-200/60">
                  <p className="font-semibold text-neutral-700">Coupon Applied:</p>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="font-mono font-bold text-[#8C5E28] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {order.couponCode}
                    </span>
                    <span className="text-rose-700 font-semibold">-₹{order.discount}</span>
                  </div>
                  {order.couponNote && (
                    <p className="text-[10px] text-neutral-500 mt-1 italic">{order.couponNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Tracking Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C5E28]">
              <Truck size={14} />
              <span>Delivery & Shipping</span>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-[#FAF8F5] p-3 text-xs space-y-1.5 text-neutral-800">
              <p><span className="text-neutral-500">Order Status:</span> <span className="font-bold">{order.status}</span></p>
              <p><span className="text-neutral-500">Courier:</span> {courier || "Standard Surface Shipping"}</p>
              {trackingNumber && (
                <p><span className="text-neutral-500">Tracking #:</span> <span className="font-mono font-semibold">{trackingNumber}</span></p>
              )}
              <div className="pt-1 border-t border-neutral-200/60 text-[11px] text-neutral-500">
                Single Source of Truth: Google Sheets &ldquo;Orders&rdquo; tab
              </div>
            </div>
          </div>
        </div>

        {/* ── ORDER LINE ITEMS TABLE ─────────────────────────────────────────── */}
        <div className="mt-8">
          <h3 className="font-serif text-sm font-bold text-[#0C2B1C] mb-3">
            Ordered Products ({order.items?.length || 0})
          </h3>
          <div className="rounded-xl border border-[#E8E2D8] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-neutral-600 font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <span className="font-medium text-neutral-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-neutral-800">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-600">
                      ₹{item.unitPrice}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      ₹{item.total > 0 ? item.total : item.unitPrice * item.quantity}
                    </td>
                  </tr>
                ))}
                {(!order.items || order.items.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-neutral-600">
                      {order.itemsNotes || "Standard Package"}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-[#FAF8F5] border-t border-[#E8E2D8] font-medium text-neutral-700">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right">Subtotal:</td>
                  <td className="px-4 py-2 text-right">₹{order.subtotal || order.amount}</td>
                </tr>
                {order.discount > 0 && (
                  <tr className="text-rose-700 font-semibold">
                    <td colSpan={3} className="px-4 py-1 text-right">Discount ({order.couponCode || "Coupon"}):</td>
                    <td className="px-4 py-1 text-right">-₹{order.discount}</td>
                  </tr>
                )}
                <tr className="font-bold text-base text-[#0C2B1C]">
                  <td colSpan={3} className="px-4 py-3 text-right">Grand Total:</td>
                  <td className="px-4 py-3 text-right">₹{order.finalAmount || order.amount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ── ORDER STATUS MANAGEMENT WORKFLOW CARD (Hidden on Print) ─────────── */}
      <div className="rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-xs print:hidden">
        <h3 className="font-serif text-base font-bold text-[#0C2B1C] mb-1">
          Update Order Status & Delivery Notes
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Changes will immediately sync back to Google Sheets &ldquo;Orders&rdquo; and create an activity audit record.
        </p>

        {statusMessage && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                New Order Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs font-medium text-neutral-800 focus:border-[#D4A373] focus:outline-hidden"
              >
                {ORDER_STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Courier / Delivery Partner
              </label>
              <input
                type="text"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="e.g. DTDC, India Post, Delhivery"
                className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK12345678"
                className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Admin Activity Note (Recorded in Audit Log)
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Dispatched via evening courier collection"
              className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-1.5 rounded-lg bg-[#0C2B1C] py-2 px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] active:scale-98 disabled:opacity-60 transition-all cursor-pointer"
            >
              {updating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#D4A373]" />
                  <span>Updating Google Sheet...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save Status Change</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
