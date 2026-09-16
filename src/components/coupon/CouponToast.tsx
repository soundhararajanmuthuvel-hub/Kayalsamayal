"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

interface CouponToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export function CouponToast({ toast, onClose, duration = 4000 }: CouponToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const config = {
    success: {
      bg: "bg-leaf text-white border-leaf/80 shadow-lg shadow-leaf/20",
      icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />,
      label: "Success",
    },
    error: {
      bg: "bg-destructive text-white border-destructive/80 shadow-lg shadow-destructive/20",
      icon: <AlertCircle className="h-5 w-5 shrink-0 text-white" />,
      label: "Error",
    },
    info: {
      bg: "bg-primary text-white border-primary/80 shadow-lg shadow-primary/20",
      icon: <Info className="h-5 w-5 shrink-0 text-gold" />,
      label: "Information",
    },
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div
        className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border ${config.bg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {config.icon}
          <div className="min-w-0">
            <span className="sr-only">{config.label}: </span>
            <p className="text-xs sm:text-sm font-bold leading-snug break-words">
              {toast.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {toast.actionText && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
              className="px-2 py-1 text-xs font-bold underline hover:opacity-90 cursor-pointer"
            >
              {toast.actionText}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
