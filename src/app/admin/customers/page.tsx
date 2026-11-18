"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminCustomer } from "@/lib/admin-api";
import { useAdmin } from "@/components/admin/AdminShell";
import { Search, ChevronRight } from "lucide-react";

export default function AdminCustomersPage() {
  const { registerRefreshHandler } = useAdmin();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers();
    const unregister = registerRefreshHandler(fetchCustomers);
    return () => unregister();
  }, [fetchCustomers, registerRefreshHandler]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Customer Intelligence ({customers.length} Customers)
        </h2>
        <p className="text-xs text-neutral-500">
          Aggregated purchase history and contacts from actual Google Sheet orders
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="relative rounded-xl border border-[#E8E2D8] bg-white p-3 shadow-2xs">
        <Search size={14} className="absolute left-6 top-5 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone number, or email..."
          className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Total Orders</th>
                <th className="px-4 py-3 text-right">Verified Spend</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-bold text-neutral-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600">
                    {c.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-neutral-800">
                    {c.totalOrders}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-800">
                    ₹{c.verifiedSpend.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {c.lastOrderDate ? c.lastOrderDate.slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="inline-flex items-center gap-1 rounded border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      <span>History ({c.orders.length})</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedCustomer.phone} • {selectedCustomer.email || "No email"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-800">
                  ₹{selectedCustomer.verifiedSpend.toLocaleString("en-IN")}
                </span>
                <p className="text-[10px] text-neutral-400">Total verified spend</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-neutral-700 mb-2">
                Order History ({selectedCustomer.orders.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {selectedCustomer.orders.map((ord) => (
                  <div key={ord.orderId} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-[#FAF8F5] text-xs">
                    <div>
                      <Link
                        href={`/admin/orders/${encodeURIComponent(ord.orderId)}`}
                        className="font-mono font-bold text-[#0C2B1C] hover:underline"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        {ord.orderId}
                      </Link>
                      <p className="text-[10px] text-neutral-400">{ord.date ? ord.date.slice(0, 10) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">₹{ord.amount}</p>
                      <span className="inline-block text-[10px] rounded px-1.5 bg-neutral-200/60 font-semibold text-neutral-700">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-[#0C2B1C] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#16452E]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
