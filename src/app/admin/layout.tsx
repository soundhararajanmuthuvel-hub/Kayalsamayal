"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#092216] flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // Determine current page title for the header
  let title = "Dashboard";
  let subtitle = "Live Google Sheets Database & Orders Overview";

  if (pathname.startsWith("/admin/orders/")) {
    title = "Order Details";
    subtitle = "Order details, customer information & status workflow";
  } else if (pathname === "/admin/orders") {
    title = "Order Management";
    subtitle = "Live orders directly from Google Sheets Orders database";
  } else if (pathname === "/admin/products") {
    title = "Product Catalog";
    subtitle = "Product list, active states & pricing";
  } else if (pathname === "/admin/categories") {
    title = "Categories";
    subtitle = "Store categories & product distribution";
  } else if (pathname === "/admin/inventory") {
    title = "Inventory & Stock";
    subtitle = "Stock tracking, low-stock alerts & adjustments";
  } else if (pathname === "/admin/customers") {
    title = "Customer Intelligence";
    subtitle = "Aggregated customer spend, order history & contacts";
  } else if (pathname === "/admin/coupons") {
    title = "Coupon Management";
    subtitle = "Single Source of Truth: Canonical A-N Coupons Sheet";
  } else if (pathname === "/admin/payments") {
    title = "Payments & Transactions";
    subtitle = "Razorpay verification & COD payment tracking";
  } else if (pathname === "/admin/reviews") {
    title = "Customer Reviews";
    subtitle = "Google Reviews & customer testimonials";
  } else if (pathname === "/admin/reports") {
    title = "Reports & Analytics";
    subtitle = "Sales metrics, daily trends, bestsellers & coupon ROI";
  } else if (pathname === "/admin/settings") {
    title = "Store Settings";
    subtitle = "COD toggles, shipping thresholds & contact details";
  }

  return (
    <AdminShell title={title} subtitle={subtitle}>
      {children}
    </AdminShell>
  );
}
