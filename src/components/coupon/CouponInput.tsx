"use client";

import React, { useState } from "react";
import { Loader2, Tag, AlertCircle, Clock, Ban, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CouponInputProps {
  onApply: (code: string) => Promise<void> | void;
  onOpenAvailable?: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
  compact?: boolean;
}

export function CouponInput({
  onApply,
  onOpenAvailable,
  isLoading,
  errorMessage,
  compact = false,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);

  const cleanCode = code.trim().toUpperCase();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    setFormatError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanCode) {
      setFormatError("Please enter a coupon code.");
      return;
    }

    // Basic format check (alphanumeric, 1-30 characters)
    if (!/^[A-Z0-9_-]{1,30}$/.test(cleanCode)) {
      setFormatError("Coupon code should only contain letters and numbers.");
      return;
    }

    setFormatError(null);
    await onApply(cleanCode);
  };

  const displayError = formatError || errorMessage;

  // Contextual icon based on error message content
  const getErrorIcon = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("expired")) return <Clock className="h-4 w-4 shrink-0 text-destructive" />;
    if (lower.includes("inactive") || lower.includes("not yet active"))
      return <Ban className="h-4 w-4 shrink-0 text-destructive" />;
    if (lower.includes("minimum"))
      return <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />;
    if (lower.includes("already used") || lower.includes("once"))
      return <HelpCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />;
    return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Input field */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Tag className="h-4 w-4" />
            </div>
            <input
              id="coupon-code-input"
              name="couponCode"
              type="text"
              value={code}
              onChange={handleInputChange}
              disabled={isLoading}
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="e.g. WELCOME10, HI"
              aria-label="Enter coupon code"
              aria-invalid={!!displayError}
              aria-describedby={displayError ? "coupon-error-desc" : undefined}
              className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-foreground placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground bg-surface transition-all focus:outline-none ${
                displayError
                  ? "border-destructive bg-destructive/5 focus:ring-2 focus:ring-destructive/30 animate-in shake"
                  : "border-border focus:border-secondary focus:ring-2 focus:ring-secondary/30"
              }`}
            />
            {cleanCode.length >= 2 && !displayError && (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-leaf">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="submit"
              variant="plum"
              size={compact ? "sm" : "touch"}
              disabled={isLoading || !cleanCode}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 font-bold text-xs rounded-xl shadow-xs"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Validating...</span>
                </span>
              ) : (
                "Apply Coupon"
              )}
            </Button>

            {onOpenAvailable && (
              <Button
                type="button"
                variant="outline"
                size={compact ? "sm" : "touch"}
                onClick={onOpenAvailable}
                disabled={isLoading}
                className="min-h-[44px] px-3.5 font-bold text-xs rounded-xl border-secondary text-secondary hover:bg-secondary/10"
              >
                View Available
              </Button>
            )}
          </div>
        </div>

        {/* Inline Error Message */}
        {displayError && (
          <div
            id="coupon-error-desc"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive animate-in fade-in duration-200"
          >
            {getErrorIcon(displayError)}
            <div className="flex-1 min-w-0">
              <p>{displayError}</p>
              {displayError.toLowerCase().includes("not found") && onOpenAvailable && (
                <button
                  type="button"
                  onClick={onOpenAvailable}
                  className="mt-1 text-[0.7rem] font-bold underline hover:opacity-80 block cursor-pointer"
                >
                  Click here to view verified available coupons →
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
