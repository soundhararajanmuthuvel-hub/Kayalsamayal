"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminCoupon, fetchAdminCoupons, saveAdminCoupon, deleteAdminCoupon } from "@/lib/admin-api";
import { useAdmin } from "@/components/admin/AdminShell";
import { Plus, Edit2, CheckCircle2, Loader2, Power, Trash2 } from "lucide-react";

export default function AdminCouponsPage() {
  const { registerRefreshHandler } = useAdmin();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maximumDiscount, setMaximumDiscount] = useState<number>(0);
  const [minimumOrder, setMinimumOrder] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await fetchAdminCoupons();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoupons();
    const unregister = registerRefreshHandler(fetchCoupons);
    return () => unregister();
  }, [fetchCoupons, registerRefreshHandler]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue(10);
    setMaximumDiscount(0);
    setMinimumOrder(0);
    setUsageLimit(0);
    setPerCustomerLimit(1);
    setStartDate("");
    setExpiryDate("");
    setActive(true);
    setMessage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: AdminCoupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || "");
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMaximumDiscount(c.maximumDiscount || 0);
    setMinimumOrder(c.minimumOrder || 0);
    setUsageLimit(c.usageLimit || 0);
    setPerCustomerLimit(c.perCustomerLimit || 1);
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : "");
    setExpiryDate(c.expiryDate ? c.expiryDate.slice(0, 10) : "");
    setActive(c.active);
    setMessage(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: Partial<AdminCoupon> = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        maximumDiscount: Number(maximumDiscount),
        minimumOrder: Number(minimumOrder),
        usageLimit: Number(usageLimit),
        perCustomerLimit: Number(perCustomerLimit),
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        active,
      };

      const data = await saveAdminCoupon(payload);

      if (!data.success) {
        setMessage({ type: "error", text: "Failed to save coupon" });
      } else {
        setMessage({ type: "success", text: "Coupon saved successfully in Google Sheets!" });
        setModalOpen(false);
        fetchCoupons();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving coupon";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: AdminCoupon) => {
    try {
      await saveAdminCoupon({
        ...c,
        active: !c.active,
      });
      fetchCoupons();
    } catch (err) {
      console.error("Failed to toggle coupon active state", err);
    }
  };

  const handleDelete = async (codeToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${codeToDelete}?`)) return;
    try {
      await deleteAdminCoupon(codeToDelete);
      fetchCoupons();
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
            Coupons Tab Single Source of Truth ({coupons.length})
          </h2>
          <p className="text-xs text-neutral-500">
            Real-time synchronization with Google Sheets &ldquo;Coupons&rdquo; tab (Canonical A–N schema)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-lg bg-[#0C2B1C] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] cursor-pointer"
        >
          <Plus size={14} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.text}
        </div>
      )}

      {/* Coupons Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Max Discount</th>
                <th className="px-4 py-3 text-center">Usage Limit</th>
                <th className="px-4 py-3 text-center">Used Count</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-sm text-[#0C2B1C] bg-[#FAF4ED] px-2 py-0.5 rounded border border-[#D4A373]/30">
                      {c.code}
                    </span>
                    {c.description && (
                      <p className="text-[10px] text-neutral-400 mt-1 max-w-[150px] truncate">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.minimumOrder ? `₹${c.minimumOrder}` : "None"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.maximumDiscount ? `₹${c.maximumDiscount}` : "No limit"}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    {c.usageLimit ? c.usageLimit : "∞"}
                  </td>
                  <td className="px-4 py-3 text-center font-bold font-mono text-[#8C5E28]">
                    {c.usedCount || 0}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {c.startDate || c.expiryDate
                      ? `${c.startDate || "Any"} → ${c.expiryDate || "Any"}`
                      : "Always Valid"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                        c.active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <Power size={10} />
                      <span>{c.active ? "Active" : "Inactive"}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="inline-flex items-center gap-1 rounded border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(c.code)}
                        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer"
                        title="Delete coupon from Google Sheets"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400">
                    No coupons found in Google Sheets Coupons tab
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <h3 className="font-serif text-base font-bold text-[#0C2B1C]">
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Saved directly into the Google Sheets Coupons tab (Columns A–N)
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    disabled={!!editingCoupon}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE20"
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs font-mono font-bold focus:border-[#D4A373] focus:outline-hidden disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-2.5 text-xs focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Rupee (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Value ({discountType === "percentage" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0 = No cap"
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Global Usage Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
                    placeholder="0 = Unlimited"
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Per Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={perCustomerLimit}
                    onChange={(e) => setPerCustomerLimit(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 10% off for festival season"
                  className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-[#0C2B1C]"
                />
                <label htmlFor="activeCheck" className="text-xs font-medium text-neutral-800">
                  Active (Ready for checkout use)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0C2B1C] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Save Coupon to Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
