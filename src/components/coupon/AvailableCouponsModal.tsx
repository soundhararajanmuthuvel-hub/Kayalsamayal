"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_COUPONS } from "@/lib/coupons";
import { formatINR } from "@/lib/brand";

interface AvailableCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (code: string) => Promise<void> | void;
  currentSubtotal: number;
}

export function AvailableCouponsModal({
  isOpen,
  onClose,
  onApply,
  currentSubtotal,
}: AvailableCouponsModalProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter for ACTIVE and strictly PUBLIC coupons (exclude KAYAL100 & private coupons)
  const publicCoupons = DEFAULT_COUPONS.filter((c) => {
    const isPrivate = c.code === "KAYAL100" || (c as unknown as { isPrivate?: boolean }).isPrivate === true;
    return c.active && !isPrivate;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-coupon-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-secondary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-coupon-title"
                className="font-display font-bold text-lg text-primary leading-tight"
              >
                Available Coupons
              </h2>
              <p className="text-xs text-muted-foreground">
                Apply a promo code to save on your authentic order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {publicCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <p className="text-sm font-semibold">No public coupons available at the moment.</p>
              <p className="text-xs">Check back soon for seasonal festive offers!</p>
            </div>
          ) : (
            publicCoupons.map((coupon) => {
              const isEligible = currentSubtotal >= coupon.minimumOrderSubtotal;
              const shortfall = coupon.minimumOrderSubtotal - currentSubtotal;
              const isCopied = copiedCode === coupon.code;

              return (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 space-y-3 hover:border-secondary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider text-primary px-2.5 py-1 rounded-lg bg-accent border border-border">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-bold text-leaf bg-leaf/10 border border-leaf/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {coupon.discountValue}% OFF
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground pt-1">
                        Get {coupon.discountValue}% off your order
                        {coupon.maximumDiscount ? ` (up to ${formatINR(coupon.maximumDiscount)})` : ""}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                    <span>
                      {coupon.minimumOrderSubtotal > 0
                        ? `Min. order: ${formatINR(coupon.minimumOrderSubtotal)}`
                        : "No minimum order requirement"}
                    </span>
                    {!isEligible && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Add {formatINR(shortfall)} more to qualify
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className="flex-1 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-accent text-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-leaf" />
                          <span className="text-leaf">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <Button
                      type="button"
                      variant="plum"
                      size="sm"
                      className="flex-1 min-h-[44px] font-bold text-xs rounded-xl"
                      onClick={() => {
                        onApply(coupon.code);
                        onClose();
                      }}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/40 border-t border-border text-center">
          <p className="text-[0.7rem] text-muted-foreground">
            Coupons are one-time use per customer • Server-verified at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
