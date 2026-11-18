"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [shippingCharge, setShippingCharge] = useState(60);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500);
  const [businessName, setBusinessName] = useState("Kayal Samayal");
  const [whatsappNumber, setWhatsappNumber] = useState("+91 9003860616");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          setCodEnabled(s.cod_enabled === "true" || s.cod_enabled === true);
          setShippingCharge(Number(s.shipping_charge) || 60);
          setFreeShippingThreshold(Number(s.free_shipping_threshold) || 500);
          if (s.business_name) setBusinessName(s.business_name);
          if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        settings: {
          cod_enabled: String(codEnabled),
          shipping_charge: String(shippingCharge),
          free_shipping_threshold: String(freeShippingThreshold),
          business_name: businessName,
          whatsapp_number: whatsappNumber,
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Failed to update settings" });
      } else {
        setMessage({ type: "success", text: "Settings saved successfully to Google Sheets!" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving settings";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#0C2B1C]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Store & Checkout Settings
        </h2>
        <p className="text-xs text-neutral-500">
          Configure payment options, shipping costs, and customer support channels
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-xl border border-[#E8E2D8] bg-white p-6 shadow-xs space-y-5">
        {/* COD Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <p className="text-xs font-bold text-neutral-900">Enable Cash on Delivery (COD)</p>
            <p className="text-[11px] text-neutral-500">
              When disabled, customers can only pay online via Razorpay.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0C2B1C]" />
          </label>
        </div>

        {/* Shipping Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Standard Shipping Charge (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={shippingCharge}
              onChange={(e) => setShippingCharge(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs font-semibold text-neutral-900 focus:border-[#D4A373] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Free Shipping Threshold (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs font-semibold text-neutral-900 focus:border-[#D4A373] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Brand & Support Contact */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Store Brand Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Official WhatsApp Support Number
            </label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-2 px-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#0C2B1C] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#16452E] active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Settings to Sheet</span>
          </button>
        </div>
      </form>
    </div>
  );
}
