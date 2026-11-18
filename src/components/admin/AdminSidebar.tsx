"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Boxes,
  Users,
  Tag,
  CreditCard,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Coupons", href: "/admin/coupons", icon: Tag },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0C2B1C] text-neutral-100 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#1B432E] px-4">
        <Link
          href="/admin"
          className="flex items-center gap-3 overflow-hidden"
          onClick={onCloseMobile}
        >
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-[#D4A373]/40 bg-white/10">
            <Image
              src="/assets/logo.jpg"
              alt="Kayal Samayal"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block font-serif text-base font-bold tracking-tight text-[#F7E7CE] truncate">
                Kayal Samayal
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#D4A373]">
                Admin ERP
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-[#1B432E] text-neutral-300 hover:bg-[#16452E] hover:text-white transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#16452E] text-[#F7E7CE] shadow-sm border border-[#D4A373]/30 font-semibold"
                  : "text-neutral-300 hover:bg-[#123824] hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-[#D4A373]" : "text-neutral-400"}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Storefront Link & Admin Profile Footer */}
      <div className="border-t border-[#1B432E] p-3 space-y-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-[#123824] hover:text-[#F7E7CE] transition-colors"
          title={collapsed ? "View Live Store" : undefined}
        >
          <ExternalLink size={14} className="text-[#D4A373]" />
          {!collapsed && <span>View Storefront</span>}
        </Link>

        <div className="flex items-center justify-between rounded-lg bg-[#092216] p-2 border border-[#1B432E]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#16452E] text-xs font-bold text-[#D4A373] border border-[#D4A373]/30">
              KS
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-[#0C2B1C]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">Admin</p>
                <p className="truncate text-[10px] text-neutral-400">Owner Access</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-[#16452E] hover:text-rose-400 transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
