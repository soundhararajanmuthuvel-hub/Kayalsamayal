"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Tag, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/brand";

export interface ModalCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maximumDiscount?: number;
  minimumOrder: number;
  startDate?: string;
  expiryDate?: string;
  active: boolean;
}

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
  const [coupons, setCoupons] = useState<ModalCoupon[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch live public coupons when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadCoupons() {
      setLoading(true);
      try {
        const res = await fetch("/api/coupons/available");
        if (!res.ok) throw new Error("Failed to load coupons");
        const data = await res.json();
        if (!cancelled && data.coupons && Array.isArray(data.coupons)) {
          // Strictly exclude staff/private coupons like KAYAL100
          const publicOnly = data.coupons.filter(
            (c: ModalCoupon) => c.code !== "KAYAL100" && c.active !== false
          );
          setCoupons(publicOnly);
        }
      } catch (err) {
        console.warn("Could not load dynamic coupons, falling back:", err);
        if (!cancelled) {
          setCoupons([
            {
              code: "WELCOME10",
              discountType: "percentage",
              discountValue: 10,
              maximumDiscount: 100,
              minimumOrder: 299,
              active: true,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-secondary mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">Checking active offers...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <p className="text-sm font-semibold">No public coupons available at the moment.</p>
              <p className="text-xs">Check back soon for seasonal festive offers!</p>
            </div>
          ) : (
            coupons.map((coupon) => {
              const minOrder = coupon.minimumOrder || 0;
              const isEligible = currentSubtotal >= minOrder;
              const shortfall = minOrder - currentSubtotal;
              const isCopied = copiedCode === coupon.code;
              const isPercentage = coupon.discountType === "percentage";

              return (
                <div
                  key={coupon.code}
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
                          {isPercentage ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground pt-1">
                        {isPercentage
                          ? `Get ${coupon.discountValue}% off your order${
                              coupon.maximumDiscount ? ` (up to ${formatINR(coupon.maximumDiscount)})` : ""
                            }.`
                          : `Get flat ${formatINR(coupon.discountValue)} off your order.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                    <span>
                      {minOrder > 0
                        ? `Min. order: ${formatINR(minOrder)}`
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
            Coupons are server-verified at checkout • One coupon per order
          </p>
        </div>
      </div>
    </div>
  );
}
