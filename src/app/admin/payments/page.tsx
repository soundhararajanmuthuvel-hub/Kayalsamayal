"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminShell";
import { fetchAdminOrders, AdminOrder } from "@/lib/admin-api";
import { CreditCard, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";

interface PaymentSummary {
  totalTransactions: number;
  razorpaySuccessCount: number;
  razorpaySuccessAmount: number;
  razorpayFailedCount: number;
  codOrdersCount: number;
  codOrdersAmount: number;
  pendingPaymentAmount: number;
  freeOrdersCount: number;
}

interface Transaction {
  orderId: string;
  paymentId: string;
  date: string;
  customerName: string;
  phone: string;
  method: string;
  status: string;
  signatureVerified: string;
  amount: number;
}

export default function AdminPaymentsPage() {
  const { registerRefreshHandler } = useAdmin();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await fetchAdminOrders();
      if (data.success && Array.isArray(data.orders)) {
        const orders: AdminOrder[] = data.orders;
        let razorpaySuccessCount = 0;
        let razorpaySuccessAmount = 0;
        let razorpayFailedCount = 0;
        let codOrdersCount = 0;
        let codOrdersAmount = 0;
        let pendingPaymentAmount = 0;
        let freeOrdersCount = 0;

        orders.forEach((o) => {
          const amt = o.finalAmount || o.amount || 0;
          if (o.paymentMethod === "Razorpay Online") {
            if (o.paymentStatus === "Paid") {
              razorpaySuccessCount++;
              razorpaySuccessAmount += amt;
            } else if (o.paymentStatus === "Failed") {
              razorpayFailedCount++;
            } else {
              pendingPaymentAmount += amt;
            }
          } else if (o.paymentMethod === "COD") {
            codOrdersCount++;
            codOrdersAmount += amt;
          } else {
            freeOrdersCount++;
          }
        });

        setSummary({
          totalTransactions: orders.length,
          razorpaySuccessCount,
          razorpaySuccessAmount,
          razorpayFailedCount,
          codOrdersCount,
          codOrdersAmount,
          pendingPaymentAmount,
          freeOrdersCount,
        });

        const txList: Transaction[] = orders.map((o) => ({
          orderId: o.orderId,
          paymentId: o.paymentId,
          date: o.timestamp,
          customerName: o.customerName,
          phone: o.phone,
          method: o.paymentMethod,
          status: o.paymentStatus,
          signatureVerified: o.signatureVerified,
          amount: o.finalAmount || o.amount,
        }));
        setTransactions(txList);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayments();
    const unregister = registerRefreshHandler(fetchPayments);
    return () => unregister();
  }, [fetchPayments, registerRefreshHandler]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Payment Reconciliation & Ledger
        </h2>
        <p className="text-xs text-neutral-500">
          Reconciliation of Razorpay online signatures and COD collection states
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Razorpay Verified */}
        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Razorpay Verified (Paid)</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            ₹{(summary?.razorpaySuccessAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {summary?.razorpaySuccessCount || 0} successful transactions
          </p>
        </div>

        {/* Cash on Delivery */}
        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">COD Orders (Pending Collection)</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            ₹{(summary?.codOrdersAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {summary?.codOrdersCount || 0} COD orders to be collected
          </p>
        </div>

        {/* Failed / Pending Payments */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">Pending Online Payments</span>
            <AlertCircle size={16} className="text-neutral-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-800 mt-2">
            ₹{(summary?.pendingPaymentAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {summary?.razorpayFailedCount || 0} failed / unverified attempts
          </p>
        </div>

        {/* Free Promotional Orders */}
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">Free / Promo Orders</span>
            <CreditCard size={16} className="text-[#D4A373]" />
          </div>
          <p className="text-2xl font-bold text-[#0C2B1C] mt-2">
            {summary?.freeOrdersCount || 0}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Zero-total promotional orders
          </p>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#E8E2D8] px-5 py-4">
          <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
            Payment Ledger ({transactions.length} Records)
          </h3>
          <p className="text-xs text-neutral-500">
            Audit of payment gateway signatures and verification status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Signature Verification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {transactions.map((t, idx) => {
                const isVerified = t.signatureVerified === "Yes" || t.signatureVerified.includes("Verified");
                return (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0C2B1C]">
                      <Link href={`/admin/orders/${encodeURIComponent(t.orderId)}`} className="hover:underline">
                        {t.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600 max-w-[150px] truncate" title={t.paymentId}>
                      {t.paymentId || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {t.date ? t.date.slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {t.customerName || "Customer"}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {t.method}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {isVerified && <CheckCircle2 size={11} />}
                        <span>{t.signatureVerified}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                          t.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-neutral-900">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                    No transactions recorded
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
