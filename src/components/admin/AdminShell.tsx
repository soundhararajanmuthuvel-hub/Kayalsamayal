"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { fetchAdminSettings, saveAdminSettings } from "@/lib/admin-api";

interface AdminContextType {
  lastSynced: Date | null;
  isRefreshing: boolean;
  refreshData: () => Promise<void>;
  registerRefreshHandler: (fn: () => Promise<void>) => () => void;
  codEnabled: boolean;
  isTogglingCod: boolean;
  toggleCod: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType>({
  lastSynced: null,
  isRefreshing: false,
  refreshData: async () => {},
  registerRefreshHandler: () => () => {},
  codEnabled: true,
  isTogglingCod: false,
  toggleCod: async () => true,
});

export const useAdmin = () => useContext(AdminContext);

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AdminShell({ children, title = "Admin ERP", subtitle }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [isTogglingCod, setIsTogglingCod] = useState<boolean>(false);

  // Fetch initial COD setting from Sheet
  useEffect(() => {
    let active = true;
    fetchAdminSettings()
      .then((res) => {
        if (!active) return;
        if (res.success && res.settings) {
          const val = res.settings.cod_enabled;
          setCodEnabled(val === "true" || String(val).toLowerCase() === "true");
        }
      })
      .catch((err) => console.warn("Notice: Initial COD setting load", err));
    return () => {
      active = false;
    };
  }, []);

  const toggleCod = useCallback(async (): Promise<boolean> => {
    setIsTogglingCod(true);
    const nextState = !codEnabled;
    setCodEnabled(nextState);
    try {
      await saveAdminSettings({ cod_enabled: String(nextState) });
      return nextState;
    } catch (e) {
      console.error("Failed to toggle COD setting:", e);
      setCodEnabled(!nextState);
      return !nextState;
    } finally {
      setIsTogglingCod(false);
    }
  }, [codEnabled]);

  // Registry of page-specific refresh callbacks
  const [refreshHandlers, setRefreshHandlers] = useState<Array<() => Promise<void>>>([]);

  const registerRefreshHandler = useCallback((fn: () => Promise<void>) => {
    setRefreshHandlers((prev) => [...prev, fn]);
    return () => {
      setRefreshHandlers((prev) => prev.filter((h) => h !== fn));
    };
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (refreshHandlers.length > 0) {
        await Promise.allSettled(refreshHandlers.map((fn) => fn()));
      }
      setLastSynced(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHandlers]);

  // Auto-refresh timer (30 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshData]);

  return (
    <AdminContext.Provider
      value={{
        lastSynced,
        isRefreshing,
        refreshData,
        registerRefreshHandler,
        codEnabled,
        isTogglingCod,
        toggleCod,
      }}
    >
      <div className="min-h-screen bg-[#F8F6F0] text-neutral-900 font-sans">
        {/* Navigation Sidebar */}
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div
          className={`flex min-h-screen flex-col transition-all duration-300 ${
            collapsed ? "md:ml-16" : "md:ml-64"
          }`}
        >
          <AdminHeader
            title={title}
            subtitle={subtitle}
            onOpenMobile={() => setMobileOpen(true)}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
            lastSynced={lastSynced}
            autoRefreshEnabled={autoRefreshEnabled}
            onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            codEnabled={codEnabled}
            isTogglingCod={isTogglingCod}
            onToggleCod={toggleCod}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
