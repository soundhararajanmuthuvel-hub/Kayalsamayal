import { API_URL } from "@/lib/api";
import { getGasAdminToken } from "@/lib/admin-auth";
import { products as localProducts } from "@/data/products";

export interface AdminOrder {
  orderId: string;
  paymentId: string;
  timestamp: string;
  status: string;
  orderStatus: string;
  paymentStatus: "Paid" | "Pending" | "Failed";
  paymentMethod: "Razorpay Online" | "COD" | "Free Order";
  amount: number;
  currency: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  itemsNotes: string;
  customerNotes?: string;
  signatureVerified: string;
  couponCode?: string;
  subtotal: number;
  discount: number;
  finalAmount: number;
  couponNote?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    image?: string | null;
  }>;
}

export interface AdminCoupon {
  code: string;
  description?: string;
  type?: string;
  discountType: "percentage" | "fixed";
  value: number;
  discountValue: number;
  maximumDiscount?: number;
  minimumOrder?: number;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  startDate?: string;
  expiryDate?: string;
  active: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  gst?: number;
  stock: number;
  tier?: string;
  image?: string | null;
  active: boolean;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  verifiedSpend: number;
  lastOrderDate: string;
  orders: Array<{
    orderId: string;
    date: string;
    amount: number;
    status: string;
    paymentStatus: string;
  }>;
}

async function callGasAdmin(action: string, payload: Record<string, unknown> = {}) {
  if (!API_URL) {
    return { success: false, error: "NEXT_PUBLIC_KAYAL_API_URL is not configured" };
  }

  const token = getGasAdminToken();
  const requestBody = {
    action,
    adminToken: token,
    serverAuthToken: token,
    ...payload,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(requestBody),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON response from Google Apps Script", raw: text.slice(0, 200) };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ── GET ALL ORDERS ────────────────────────────────────────────────────────────

export async function fetchAdminOrders(): Promise<{ success: boolean; orders: AdminOrder[]; error?: string }> {
  if (!API_URL) {
    return {
      success: true,
      orders: [],
      error: "Google Apps Script Web App URL is not configured. Set NEXT_PUBLIC_KAYAL_API_URL in .env.local or Vercel to sync live Google Sheets records.",
    };
  }
  const res = await callGasAdmin("admin_get_orders");
  if (res && res.success && Array.isArray(res.orders)) {
    // Enrich item images from local product catalog
    const productImgMap: Record<string, string | null> = {};
    localProducts.forEach((p) => {
      productImgMap[p.name.toLowerCase().trim()] = p.image;
      productImgMap[p.id.toLowerCase().trim()] = p.image;
    });

    const enrichedOrders: AdminOrder[] = res.orders.map((o: AdminOrder) => {
      const items = (o.items || []).map((it) => {
        const cleanName = it.name.toLowerCase().trim();
        let matchedImg = productImgMap[cleanName] || null;
        if (!matchedImg) {
          // Partial match
          const foundKey = Object.keys(productImgMap).find((k) => cleanName.includes(k) || k.includes(cleanName));
          if (foundKey) matchedImg = productImgMap[foundKey];
        }
        return {
          ...it,
          image: matchedImg,
        };
      });
      return {
        ...o,
        items,
      };
    });

    return { success: true, orders: enrichedOrders };
  }
  return { success: false, orders: [], error: res?.error || "Failed to load orders from Google Sheets" };
}

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────

export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: string,
  adminUser = "admin",
  notes?: string,
  trackingNumber?: string,
  courier?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await callGasAdmin("admin_update_order_status", {
    orderId,
    newStatus,
    adminUser,
    notes,
    trackingNumber,
    courier,
  });
}

// ── GET COUPONS ───────────────────────────────────────────────────────────────

export async function fetchAdminCoupons(): Promise<{ success: boolean; coupons: AdminCoupon[]; error?: string }> {
  const res = await callGasAdmin("admin_get_coupons");
  if (res && res.success && Array.isArray(res.coupons)) {
    return { success: true, coupons: res.coupons };
  }
  return { success: false, coupons: [], error: res?.error || "Failed to load coupons" };
}

// ── SAVE COUPON ───────────────────────────────────────────────────────────────

export async function saveAdminCoupon(
  coupon: Partial<AdminCoupon>
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await callGasAdmin("admin_save_coupon", coupon as Record<string, unknown>);
}

// ── DELETE COUPON ─────────────────────────────────────────────────────────────

export async function deleteAdminCoupon(
  code: string,
  hardDelete = false
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await callGasAdmin("admin_delete_coupon", { code, hardDelete });
}

// ── GET INVENTORY ─────────────────────────────────────────────────────────────

export async function fetchAdminInventory(): Promise<{ success: boolean; products: AdminProduct[]; error?: string }> {
  const res = await callGasAdmin("admin_get_inventory");
  if (res && res.success && Array.isArray(res.products) && res.products.length > 0) {
    const mapped: AdminProduct[] = res.products.map((p: Record<string, unknown>) => ({
      id: String(p["Product ID"] || p["id"] || ""),
      name: String(p["Product Name"] || p["name"] || ""),
      category: String(p["Category"] || p["category"] || "Traditional Masalas"),
      price: Number(p["Price"] || p["price"] || 0),
      mrp: Number(p["MRP"] || p["mrp"] || 0),
      gst: Number(p["GST"] || p["gst"] || 0.05),
      stock: Number(p["Stock"] || p["stock"] || 0),
      tier: String(p["Tier"] || p["tier"] || "regular"),
      image: (p["Image"] || p["image"] || null) as string | null,
      active: p["Active"] !== false && String(p["Active"]).toLowerCase() !== "false",
    }));
    return { success: true, products: mapped };
  }

  // Fallback to local catalog with default stock
  const catalogMapped: AdminProduct[] = localProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price || 180,
    mrp: p.mrp || 220,
    gst: p.gst || 0.05,
    stock: p.stock !== undefined ? p.stock : 50,
    tier: p.tier,
    image: p.image,
    active: p.active !== false,
  }));
  return { success: true, products: catalogMapped };
}

// ── UPDATE PRODUCT STOCK ──────────────────────────────────────────────────────

export async function updateAdminStock(
  productId: string,
  stock: number,
  reason?: string,
  adminUser = "admin"
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await callGasAdmin("admin_update_stock", { productId, stock, reason, adminUser });
}

// ── GET CUSTOMERS ─────────────────────────────────────────────────────────────

export async function fetchAdminCustomers(): Promise<{ success: boolean; customers: AdminCustomer[]; error?: string }> {
  const res = await callGasAdmin("admin_get_customers");
  if (res && res.success && Array.isArray(res.customers)) {
    return { success: true, customers: res.customers };
  }

  // Fallback: derive from orders
  const ordersRes = await fetchAdminOrders();
  if (ordersRes.success) {
    const custMap: Record<string, AdminCustomer> = {};
    ordersRes.orders.forEach((o) => {
      const phone = (o.phone || "").replace(/[^\d]/g, "").slice(-10);
      const email = (o.email || "").trim().toLowerCase();
      const key = phone || email || o.customerName || "guest";

      if (!custMap[key]) {
        custMap[key] = {
          id: `CUST-${phone || email || Math.random().toString(36).slice(2, 7)}`,
          name: o.customerName || "Customer",
          phone: o.phone || "",
          email: o.email || "",
          address: o.address || "",
          totalOrders: 0,
          verifiedSpend: 0,
          lastOrderDate: o.timestamp,
          orders: [],
        };
      }
      custMap[key].totalOrders += 1;
      if (o.paymentStatus === "Paid") {
        custMap[key].verifiedSpend += (o.finalAmount || o.amount || 0);
      }
      if (new Date(o.timestamp) > new Date(custMap[key].lastOrderDate)) {
        custMap[key].lastOrderDate = o.timestamp;
      }
      custMap[key].orders.push({
        orderId: o.orderId,
        date: o.timestamp,
        amount: o.finalAmount || o.amount,
        status: o.status,
        paymentStatus: o.paymentStatus,
      });
    });

    const list = Object.values(custMap).sort((a, b) => b.verifiedSpend - a.verifiedSpend);
    return { success: true, customers: list };
  }

  return { success: false, customers: [], error: res?.error || "Failed to load customers" };
}

// ── GET SETTINGS ──────────────────────────────────────────────────────────────

export async function fetchAdminSettings(): Promise<{ success: boolean; settings: Record<string, string>; error?: string }> {
  const res = await callGasAdmin("admin_get_settings");
  if (res && res.success && res.settings) {
    return { success: true, settings: res.settings };
  }
  return {
    success: true,
    settings: {
      cod_enabled: "true",
      shipping_charge: "60",
      free_shipping_threshold: "500",
      business_name: "Kayal Samayal",
      whatsapp_number: "+91 9003860616",
    },
  };
}

// ── SAVE SETTINGS ─────────────────────────────────────────────────────────────

export async function saveAdminSettings(
  settings: Record<string, string>
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await callGasAdmin("admin_save_settings", { settings });
}
