"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CouponInput } from "./CouponInput";
import { CouponBadge } from "./CouponBadge";
import { AvailableCouponsModal } from "./AvailableCouponsModal";
import { CouponToast, ToastMessage } from "./CouponToast";
import { DEFAULT_COUPONS } from "@/lib/coupons";
import { formatINR } from "@/lib/brand";

interface CouponSectionProps {
  variant?: "cart" | "checkout";
  compact?: boolean;
  className?: string;
}

export function CouponSection({
  variant = "cart",
  compact = false,
  className = "",
}: CouponSectionProps) {
  const {
    cart,
    cartSubtotal,
    customerDetails,
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon,
    couponError,
    setCouponError,
    couponLoading,
    setCouponLoading,
  } = useCart();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const userRemovedCouponRef = useRef(false);

  const handleApplyCoupon = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    // Check if the exact same coupon is already applied
    if (appliedCoupon && appliedCoupon.code.trim().toUpperCase() === code) {
      setToast({
        id: Date.now().toString(),
        type: "info",
        message: `${code} is already applied to your order.`,
      });
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          customerMobile: customerDetails?.mobile ? customerDetails.mobile.trim() : undefined,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        const errorMsg = data.error || data.message || "Invalid coupon code.";
        setCouponError(errorMsg);
        setToast({
          id: Date.now().toString(),
          type: "error",
          message: errorMsg,
        });
        return;
      }

      // Lookup minOrder from default catalog if available
      const catalogMatch = DEFAULT_COUPONS.find(
        (c) => c.code.toUpperCase() === code
      );
      const minOrder = catalogMatch ? catalogMatch.minimumOrderSubtotal : (data.minOrder ?? 0);
      const maxDiscount = data.maximumDiscount ?? catalogMatch?.maximumDiscount;
      const discountType = data.discountType || catalogMatch?.discountType || "percentage";
      const discountValue = data.discountValue ?? catalogMatch?.discountValue ?? 0;

      setAppliedCoupon({
        code: data.code || code,
        discountType,
        discountValue,
        discountAmount: data.discountAmount || 0,
        maxDiscount,
        minOrder,
        message: data.message,
        appliedAt: Date.now(),
      });

      setCouponError(null);
      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `✅ ${data.code || code} applied! Saved ${formatINR(data.discountAmount || 0)}.`,
      });
    } catch {
      const errMsg = "Unable to validate coupon. Please check your connection and try again.";
      setCouponError(errMsg);
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: errMsg,
      });
    } finally {
      setCouponLoading(false);
    }
  };

  // Auto-apply from URL query param if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlCoupon = new URLSearchParams(window.location.search).get("coupon");
    if (!urlCoupon || !urlCoupon.trim()) return;
    if (userRemovedCouponRef.current) return;

    const normalizedUrl = urlCoupon.trim().toUpperCase();

    // If this coupon is already active in CartContext, do nothing
    if (appliedCoupon && appliedCoupon.code.trim().toUpperCase() === normalizedUrl) {
      return;
    }

    const timer = setTimeout(() => {
      handleApplyCoupon(normalizedUrl);
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCoupon?.code]);

  const handleRemoveCoupon = () => {
    userRemovedCouponRef.current = true;
    const removedCode = appliedCoupon?.code;
    clearAppliedCoupon();
    setCouponError(null);

    // Strip ?coupon= from browser URL so it does not resurrect on page refresh
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("coupon")) {
          url.searchParams.delete("coupon");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      } catch { /* ignore */ }
    }

    if (removedCode) {
      setToast({
        id: Date.now().toString(),
        type: "info",
        message: `Coupon ${removedCode} removed.`,
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={appliedCoupon ? undefined : "coupon-code-input"}
          className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider"
        >
          <Tag className="h-3.5 w-3.5 text-secondary" />
          <span>Have a Coupon?</span>
        </label>

        {!appliedCoupon && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[0.7rem] font-bold text-secondary hover:underline cursor-pointer"
          >
            View Available
          </button>
        )}
      </div>

      {/* Applied Badge or Input Field */}
      {appliedCoupon ? (
        <CouponBadge
          coupon={appliedCoupon}
          onRemove={handleRemoveCoupon}
          onChangeCoupon={() => {
            clearAppliedCoupon();
            setIsModalOpen(true);
          }}
          compact={compact || variant === "checkout"}
        />
      ) : (
        <CouponInput
          onApply={handleApplyCoupon}
          onOpenAvailable={() => setIsModalOpen(true)}
          isLoading={couponLoading}
          errorMessage={couponError}
          compact={compact || variant === "checkout"}
        />
      )}

      {/* Available Coupons Modal */}
      <AvailableCouponsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyCoupon}
        currentSubtotal={cartSubtotal}
      />

      {/* Floating Toast Notification */}
      <CouponToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
