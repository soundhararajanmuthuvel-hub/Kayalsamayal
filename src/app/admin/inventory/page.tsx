"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminProduct, fetchAdminInventory, updateAdminStock } from "@/lib/admin-api";
import { useAdmin } from "@/components/admin/AdminShell";
import { AlertTriangle, CheckCircle2, Edit2, Loader2, Search } from "lucide-react";

export default function AdminInventoryPage() {
  const { registerRefreshHandler } = useAdmin();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit stock modal state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await fetchAdminInventory();
      if (data.success) {
        setItems(data.products || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInventory();
    const unregister = registerRefreshHandler(fetchInventory);
    return () => unregister();
  }, [fetchInventory, registerRefreshHandler]);

  const handleOpenEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setNewStockVal(p.stock);
    setUpdateReason("");
    setMessage(null);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUpdating(true);
    setMessage(null);

    try {
      const data = await updateAdminStock(
        editingProduct.id,
        newStockVal,
        updateReason
      );

      if (!data.success) {
        setMessage({ type: "error", text: "Failed to update stock" });
      } else {
        setMessage({ type: "success", text: "Stock updated successfully in Google Sheets!" });
        setEditingProduct(null);
        fetchInventory();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating stock";
      setMessage({ type: "error", text: msg });
    } finally {
      setUpdating(false);
    }
  };

  const lowStockCount = items.filter((i) => i.stock < 10 && i.stock > 0).length;
  const outOfStockCount = items.filter((i) => i.stock <= 0).length;

  const filtered = items.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-2xs">
          <p className="text-xs text-neutral-500 font-medium">Total Tracked Products</p>
          <p className="text-2xl font-bold text-[#0C2B1C] mt-1">{items.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-800 font-medium">Low Stock Warning (&lt; 10)</p>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">{lowStockCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-rose-800 font-medium">Out of Stock</p>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-800 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 rounded-xl border border-[#E8E2D8] bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by product name..."
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 pl-8 pr-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filtered.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock < 10;

                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-neutral-900">{p.name}</p>
                      <p className="font-mono text-[10px] text-neutral-400">{p.id}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 font-medium">{p.category}</td>
                    <td className="px-4 py-3 font-mono font-bold text-sm text-neutral-900">
                      {p.stock} units
                    </td>
                    <td className="px-4 py-3">
                      {isOutOfStock ? (
                        <span className="inline-flex rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Low Stock Warning
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Healthy ({p.stock})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 rounded border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    <Loader2 size={16} className="inline-block animate-spin mr-2 text-[#0C2B1C]" />
                    <span>Loading inventory from sheet...</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
              Adjust Stock: {editingProduct.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Current stock: <span className="font-bold">{editingProduct.stock} units</span>
            </p>

            <form onSubmit={handleSaveStock} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  New Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-sm font-bold text-neutral-900 focus:border-[#D4A373] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reason for Adjustment (Recorded in Audit Log)
                </label>
                <input
                  type="text"
                  required
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="e.g. New stock batch arrival, physical audit"
                  className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0C2B1C] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] disabled:opacity-60 cursor-pointer"
                >
                  {updating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Save to Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
