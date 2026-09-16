"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Trash2, Tag, RefreshCw, AlertTriangle } from "lucide-react";
import { AppliedCoupon } from "@/context/CartContext";
import { formatINR } from "@/lib/brand";
import { Button } from "@/components/ui/button";

interface CouponBadgeProps {
  coupon: AppliedCoupon;
  onRemove: () => void;
  onChangeCoupon?: () => void;
  compact?: boolean;
}

export function CouponBadge({
  coupon,
  onRemove,
  onChangeCoupon,
  compact = false,
}: CouponBadgeProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Close confirmation modal on Escape key
  useEffect(() => {
    if (!showConfirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal]);

  const discountDetail = (() => {
    if (coupon.discountType === "percentage") {
      const cap = coupon.maxDiscount ? ` (max ${formatINR(coupon.maxDiscount)})` : "";
      return `${coupon.discountValue}% off${cap}`;
    }
    return `Flat ${formatINR(coupon.discountValue)} off`;
  })();

  const handleConfirmRemove = () => {
    setShowConfirmModal(false);
    onRemove();
  };

  return (
    <>
      <div
        role="status"
        aria-label={`Coupon applied: ${coupon.code}, saving ${formatINR(coupon.discountAmount)}`}
        className={`rounded-2xl border border-leaf/40 border-l-4 border-l-leaf bg-leaf/10 p-3.5 sm:p-4 animate-in fade-in slide-in-from-top-1 duration-200 transition-all ${
          compact ? "text-xs" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-leaf shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs sm:text-sm tracking-wide text-leaf">
                  {coupon.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-leaf bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded-full">
                  <Tag className="h-3 w-3" />
                  Applied
                </span>
              </div>
              <p className="text-xs text-foreground font-semibold">
                {discountDetail} &bull;{" "}
                <span className="text-leaf font-bold">
                  Saves {formatINR(coupon.discountAmount)}
                </span>
              </p>
              {coupon.message && coupon.message !== `${coupon.code} applied!` && (
                <p className="text-[0.7rem] text-muted-foreground">{coupon.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onChangeCoupon && (
              <button
                type="button"
                onClick={onChangeCoupon}
                className="p-2 text-muted-foreground hover:text-secondary rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                title="Change coupon"
                aria-label="Change coupon"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title="Remove coupon"
              aria-label={`Remove coupon ${coupon.code}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-coupon-title"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-card rounded-3xl border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 id="remove-coupon-title" className="font-display font-bold text-lg text-primary">
                Remove Coupon?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You applied <strong className="text-foreground">{coupon.code}</strong>, saving{" "}
                <strong className="text-leaf">{formatINR(coupon.discountAmount)}</strong>. Are you sure
                you want to remove it?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="flex-1 font-bold text-xs"
                onClick={() => setShowConfirmModal(false)}
              >
                Keep Applied
              </Button>
              <Button
                type="button"
                variant="plum"
                size="touch"
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
                onClick={handleConfirmRemove}
              >
                Remove Coupon
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
