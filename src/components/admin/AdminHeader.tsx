"use client";

import React from "react";
import { Menu, RefreshCw, CheckCircle2, Sheet } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastSynced?: Date | null;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
}

export function AdminHeader({
  title,
  subtitle,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  lastSynced,
  autoRefreshEnabled,
  onToggleAutoRefresh,
}: AdminHeaderProps) {
  const formattedSyncTime = lastSynced
    ? lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Just now";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#E8E2D8] bg-[#FDFBF7]/95 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile hamburger & Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E2D8] text-neutral-700 hover:bg-neutral-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="font-serif text-lg font-bold text-[#0C2B1C] md:text-xl leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-neutral-500 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Sync Status & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Google Sheet Live Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
          <Sheet size={13} className="text-emerald-600" />
          <span>Google Sheets</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        </div>

        {/* Last Synced Indicator */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>Synced: {formattedSyncTime}</span>
        </div>

        {/* Auto Refresh Toggle */}
        {onToggleAutoRefresh && (
          <button
            onClick={onToggleAutoRefresh}
            className={`hidden md:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              autoRefreshEnabled
                ? "border-[#D4A373] bg-[#FAF4ED] text-[#8C5E28]"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
            }`}
            title="Auto sync every 30 seconds"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefreshEnabled ? "bg-amber-600 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>Auto-Sync {autoRefreshEnabled ? "ON (30s)" : "OFF"}</span>
          </button>
        )}

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-[#0C2B1C] bg-[#0C2B1C] px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#16452E] active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={`${isRefreshing ? "animate-spin text-[#D4A373]" : "text-white"}`}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Syncing..." : "Sync Sheet"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
