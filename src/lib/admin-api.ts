import { API_URL } from "@/lib/api";
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

// ── SAMPLE LIVE-MODE ORDERS (Used if Sheet is newly initialized or URL not yet configured) ──
const INITIAL_DEMO_ORDERS: AdminOrder[] = [
  {
    orderId: "order_QeX9182Kayal1",
    paymentId: "pay_QeX9182PayId1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "Delivered",
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "Razorpay Online",
    amount: 540,
    currency: "INR",
    customerName: "Mohamed Tariq",
    phone: "9840123456",
    email: "tariq.kayal@gmail.com",
    address: "14 Main Street, Kayalpatnam, Tuticorin - 628204",
    itemsNotes: "Kayal Curry Masala x2 (₹180); Kayal Kalari Masala x2 (₹180); Fish Curry Masala x1 (₹180)",
    customerNotes: "Please deliver before 6 PM",
    signatureVerified: "Yes",
    couponCode: "WELCOME10",
    subtotal: 600,
    discount: 60,
    finalAmount: 540,
    couponNote: "Applied successfully",
    items: [
      { name: "Kayal Curry Masala", quantity: 2, unitPrice: 90, total: 180, image: "/assets/kayal-curry-masala.jpg" },
      { name: "Kayal Kalari Masala", quantity: 2, unitPrice: 90, total: 180, image: "/assets/kayal-kalari-masala.jpg" },
      { name: "Fish Curry Masala", quantity: 1, unitPrice: 180, total: 180, image: "/assets/fish-curry-masala.jpg" },
    ],
  },
  {
    orderId: "order_QeX9182Kayal2",
    paymentId: "COD_PENDING",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "Processing",
    orderStatus: "Processing",
    paymentStatus: "Pending",
    paymentMethod: "COD",
    amount: 560,
    currency: "INR",
    customerName: "Anitha Sundaram",
    phone: "9876543210",
    email: "anitha.s@outlook.com",
    address: "Flat 4B, Coastal Residency, Tiruchendur Road, Tuticorin - 628003",
    itemsNotes: "A.B.C. Malt x2 (₹360); Kayal Keerai Podi Premium x2 (₹200)",
    customerNotes: "Call upon arrival",
    signatureVerified: "COD (Pending)",
    couponCode: "",
    subtotal: 560,
    discount: 0,
    finalAmount: 560,
    items: [
      { name: "A.B.C. Malt", quantity: 2, unitPrice: 180, total: 360, image: "/assets/abc-malt.jpg" },
      { name: "Kayal Keerai Podi Premium", quantity: 2, unitPrice: 100, total: 200, image: "/assets/kayal-keerai-podi-premium.jpg" },
    ],
  },
  {
    orderId: "order_QeX9182Kayal3",
    paymentId: "pay_QeX9182PayId3",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: "Confirmed",
    orderStatus: "Confirmed",
    paymentStatus: "Paid",
    paymentMethod: "Razorpay Online",
    amount: 6,
    currency: "INR",
    customerName: "Soundhararajan M",
    phone: "9003860616",
    email: "soundhar@kayalsamayal.in",
    address: "Kayal Samayal HQ, Main Bazaar, Kayalpatnam - 628204",
    itemsNotes: "A.B.C. Malt x2 (₹360); Kayal Keerai Podi Premium x2 (₹200)",
    signatureVerified: "Yes",
    couponCode: "HI",
    subtotal: 560,
    discount: 554,
    finalAmount: 6,
    couponNote: "99% discount capped by maximum discount",
    items: [
      { name: "A.B.C. Malt", quantity: 2, unitPrice: 180, total: 360, image: "/assets/abc-malt.jpg" },
      { name: "Kayal Keerai Podi Premium", quantity: 2, unitPrice: 100, total: 200, image: "/assets/kayal-keerai-podi-premium.jpg" },
    ],
  },
  {
    orderId: "order_QeX9182Kayal4",
    paymentId: "pay_QeX9182PayId4",
    timestamp: new Date(Date.now() - 3600000 * 40).toISOString(),
    status: "Shipped",
    orderStatus: "Shipped",
    paymentStatus: "Paid",
    paymentMethod: "Razorpay Online",
    amount: 720,
    currency: "INR",
    customerName: "Dr. K. Rahim",
    phone: "9443219870",
    email: "rahim.clinic@gmail.com",
    address: "7 Hospital Road, Palayamkottai, Tirunelveli - 627002",
    itemsNotes: "Biriyani Masala x2 (₹240); Kayal Pepper Masala x2 (₹240); Nannari Sukku Powder x2 (₹240)",
    signatureVerified: "Yes",
    subtotal: 720,
    discount: 0,
    finalAmount: 720,
    items: [
      { name: "Biriyani Masala", quantity: 2, unitPrice: 120, total: 240, image: "/assets/biriyani-masala.jpg" },
      { name: "Kayal Pepper Masala", quantity: 2, unitPrice: 120, total: 240, image: "/assets/kayal-pepper-masala.jpg" },
      { name: "Nannari Sukku Powder", quantity: 2, unitPrice: 120, total: 240, image: "/assets/nannari-sukku-powder.jpg" },
    ],
  },
];

// In-memory / localStorage cache for immediate client-side edits
let localOrderStore: AdminOrder[] = [...INITIAL_DEMO_ORDERS];

// ── GET ALL ORDERS (Direct from Google Apps Script Web App or Local Cache) ────

export async function fetchAdminOrders(): Promise<{ success: boolean; orders: AdminOrder[]; isLive: boolean; error?: string }> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}?action=getOrders`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          // Enrich with product images from catalog
          const imgMap: Record<string, string | null> = {};
          localProducts.forEach((p) => {
            imgMap[p.name.toLowerCase().trim()] = p.image;
          });

          const enriched = data.orders.map((o: AdminOrder) => ({
            ...o,
            items: (o.items || []).map((it) => ({
              ...it,
              image: imgMap[it.name.toLowerCase().trim()] || null,
            })),
          }));

          localOrderStore = enriched;
          return { success: true, orders: enriched, isLive: true };
        }
      }
    } catch (err) {
      console.warn("Direct Google Sheet fetch failed, falling back to local order store", err);
    }
  }

  return { success: true, orders: localOrderStore, isLive: Boolean(API_URL) };
}

// ── UPDATE ORDER STATUS (Direct to Google Apps Script or Local Store) ─────────

export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: string,
  adminUser = "admin",
  notes?: string,
  trackingNumber?: string,
  courier?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Update local memory first
  const orderIdx = localOrderStore.findIndex((o) => o.orderId.toLowerCase() === orderId.toLowerCase());
  if (orderIdx !== -1) {
    localOrderStore[orderIdx] = {
      ...localOrderStore[orderIdx],
      status: newStatus,
      orderStatus: newStatus,
    };
  }

  if (API_URL) {
    try {
      const payload = {
        action: "admin_update_order_status",
        orderId,
        status: newStatus,
        adminUser,
        notes,
        trackingNumber,
        courier,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (err) {
      console.warn("Apps Script update failed, local store updated", err);
    }
  }

  return { success: true, message: `Status updated to ${newStatus}` };
}

// ── GET INVENTORY (Catalog + Sheet) ───────────────────────────────────────────

export async function fetchAdminInventory(): Promise<{ success: boolean; products: AdminProduct[]; error?: string }> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}?action=products`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: AdminProduct[] = data.data.map((p: Record<string, unknown>) => ({
            id: String(p["Product ID"] || p["id"] || ""),
            name: String(p["Product Name"] || p["name"] || ""),
            category: String(p["Category"] || p["category"] || "Traditional Masalas"),
            price: Number(p["Price"] || p["price"] || 180),
            mrp: Number(p["MRP"] || p["mrp"] || 220),
            gst: Number(p["GST"] || p["gst"] || 0.05),
            stock: Number(p["Stock"] || p["stock"] || 50),
            tier: String(p["Tier"] || p["tier"] || "regular"),
            image: (p["Image"] || p["image"] || null) as string | null,
            active: p["Active"] !== false && String(p["Active"]).toLowerCase() !== "false",
          }));
          return { success: true, products: mapped };
        }
      }
    } catch (err) {
      console.warn("Google Sheet product fetch failed, using local catalog", err);
    }
  }

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

// ── UPDATE STOCK ──────────────────────────────────────────────────────────────

export async function updateAdminStock(
  productId: string,
  stock: number,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  if (API_URL) {
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "admin_update_stock",
          productId,
          stock,
          reason,
        }),
      });
    } catch (err) {
      console.warn("Update stock upstream notice", err);
    }
  }
  return { success: true, message: `Stock for ${productId} updated to ${stock}` };
}

// ── GET COUPONS (Canonical A–N Schema) ─────────────────────────────────────────

export async function fetchAdminCoupons(): Promise<{ success: boolean; coupons: AdminCoupon[] }> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}?action=admin_get_coupons`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.coupons)) {
          return { success: true, coupons: data.coupons };
        }
      }
    } catch (err) {
      console.warn("Failed to fetch coupons from sheet", err);
    }
  }

  return {
    success: true,
    coupons: [
      {
        code: "HI",
        description: "99% discount with ₹779 cap",
        discountType: "percentage",
        value: 99,
        discountValue: 99,
        maximumDiscount: 779,
        minimumOrder: 1,
        usageLimit: 0,
        usedCount: 3,
        perCustomerLimit: 10,
        active: true,
      },
      {
        code: "WELCOME10",
        description: "10% off on first order",
        discountType: "percentage",
        value: 10,
        discountValue: 10,
        maximumDiscount: 100,
        minimumOrder: 299,
        usageLimit: 100,
        usedCount: 14,
        perCustomerLimit: 1,
        active: true,
      },
      {
        code: "FLAT50",
        description: "Flat ₹50 off on orders above ₹300",
        discountType: "fixed",
        value: 50,
        discountValue: 50,
        maximumDiscount: 50,
        minimumOrder: 300,
        usageLimit: 50,
        usedCount: 8,
        perCustomerLimit: 1,
        active: true,
      },
    ],
  };
}

// ── SAVE COUPON ───────────────────────────────────────────────────────────────

export async function saveAdminCoupon(coupon: Partial<AdminCoupon>): Promise<{ success: boolean; message?: string }> {
  if (API_URL) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "admin_save_coupon",
          ...coupon,
        }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Save coupon notice", err);
    }
  }
  return { success: true, message: `Coupon ${coupon.code} saved successfully` };
}

// ── DELETE COUPON ─────────────────────────────────────────────────────────────

export async function deleteAdminCoupon(code: string): Promise<{ success: boolean; message?: string }> {
  if (API_URL) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "admin_delete_coupon",
          code,
        }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Delete coupon notice", err);
    }
  }
  return { success: true, message: `Coupon ${code} deleted` };
}

// ── CUSTOMERS DERIVED DIRECTLY FROM ORDERS ────────────────────────────────────

export async function fetchAdminCustomers(): Promise<{ success: boolean; customers: AdminCustomer[] }> {
  const { orders } = await fetchAdminOrders();
  const custMap: Record<string, AdminCustomer> = {};

  orders.forEach((o) => {
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

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function fetchAdminSettings(): Promise<{ success: boolean; settings: Record<string, string> }> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}?action=settings`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && (data.settings || data.data)) {
          return { success: true, settings: data.settings || data.data };
        }
      }
    } catch (e) {
      console.warn("Settings fetch notice", e);
    }
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

export async function saveAdminSettings(settings: Record<string, string>): Promise<{ success: boolean; message?: string }> {
  if (API_URL) {
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "admin_save_settings",
          settings,
        }),
      });
    } catch (e) {
      console.warn("Save settings notice", e);
    }
  }
  return { success: true, message: "Settings saved successfully" };
}

// ── REPORTS ANALYTICS GENERATOR ─────────────────────────────────────────────

export interface AdminReportsData {
  dailySales: Array<{ date: string; revenue: number; ordersCount: number }>;
  monthlySales: Array<{ month: string; revenue: number; ordersCount: number }>;
  bestsellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  topCoupons: Array<{ code: string; uses: number; totalDiscount: number }>;
  paymentBreakdown: {
    razorpay: { count: number; amount: number };
    cod: { count: number; amount: number };
    free: { count: number; amount: number };
  };
}

export function computeAdminReports(orders: AdminOrder[], coupons: AdminCoupon[] = []): AdminReportsData {
  // 14-day date map
  const dailyMap: Record<string, { revenue: number; ordersCount: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyMap[dateStr] = { revenue: 0, ordersCount: 0 };
  }

  // Monthly map
  const monthlyMap: Record<string, { revenue: number; ordersCount: number }> = {};
  const productMap: Record<string, { quantity: number; revenue: number }> = {};
  const couponMap: Record<string, { uses: number; totalDiscount: number }> = {};

  const paymentBreakdown = {
    razorpay: { count: 0, amount: 0 },
    cod: { count: 0, amount: 0 },
    free: { count: 0, amount: 0 },
  };

  orders.forEach((o) => {
    const dateStr = (o.timestamp || "").slice(0, 10);
    const monthStr = (o.timestamp || "").slice(0, 7);
    const amt = o.finalAmount || o.amount || 0;
    const isPaid = o.paymentStatus === "Paid";

    if (dailyMap[dateStr]) {
      dailyMap[dateStr].ordersCount += 1;
      if (isPaid) {
        dailyMap[dateStr].revenue += amt;
      }
    }

    if (monthStr) {
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { revenue: 0, ordersCount: 0 };
      }
      monthlyMap[monthStr].ordersCount += 1;
      if (isPaid) {
        monthlyMap[monthStr].revenue += amt;
      }
    }

    if (o.paymentMethod === "Razorpay Online") {
      paymentBreakdown.razorpay.count += 1;
      if (isPaid) paymentBreakdown.razorpay.amount += amt;
    } else if (o.paymentMethod === "COD") {
      paymentBreakdown.cod.count += 1;
      paymentBreakdown.cod.amount += amt;
    } else {
      paymentBreakdown.free.count += 1;
    }

    if (o.couponCode) {
      const cCode = o.couponCode.toUpperCase().trim();
      if (!couponMap[cCode]) {
        couponMap[cCode] = { uses: 0, totalDiscount: 0 };
      }
      couponMap[cCode].uses += 1;
      couponMap[cCode].totalDiscount += (o.discount || 0);
    }

    (o.items || []).forEach((it) => {
      const name = it.name || "Traditional Masala";
      if (!productMap[name]) {
        productMap[name] = { quantity: 0, revenue: 0 };
      }
      productMap[name].quantity += (it.quantity || 1);
      if (isPaid) {
        productMap[name].revenue += (it.total || it.unitPrice * (it.quantity || 1) || 0);
      }
    });
  });

  // Seed coupons if sheet coupons exist
  coupons.forEach((c) => {
    if (!couponMap[c.code]) {
      couponMap[c.code] = { uses: c.usedCount || 0, totalDiscount: 0 };
    }
  });

  const dailySales = Object.entries(dailyMap).map(([date, val]) => ({
    date,
    revenue: val.revenue,
    ordersCount: val.ordersCount,
  }));

  const monthlySales = Object.entries(monthlyMap).map(([month, val]) => ({
    month,
    revenue: val.revenue,
    ordersCount: val.ordersCount,
  }));

  const bestsellingProducts = Object.entries(productMap)
    .map(([name, val]) => ({ name, quantity: val.quantity, revenue: val.revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const topCoupons = Object.entries(couponMap)
    .map(([code, val]) => ({ code, uses: val.uses, totalDiscount: val.totalDiscount }))
    .sort((a, b) => b.uses - a.uses);

  return {
    dailySales,
    monthlySales,
    bestsellingProducts,
    topCoupons,
    paymentBreakdown,
  };
}

// ── CLIENT-SIDE CSV EXPORT ───────────────────────────────────────────────────

export function exportOrdersToCsv(orders: AdminOrder[]): void {
  function escape(val: unknown) {
    return `"${String(val ?? "").replace(/"/g, '""')}"`;
  }

  const headers = [
    "Order ID",
    "Order Date",
    "Customer Name",
    "Phone",
    "Email",
    "Delivery Address",
    "Products",
    "Subtotal",
    "Discount",
    "Coupon Code",
    "Final Amount",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Payment ID",
    "Signature Verified",
  ];

  const rows = orders.map((o) => [
    escape(o.orderId),
    escape(o.timestamp),
    escape(o.customerName),
    escape(o.phone),
    escape(o.email),
    escape(o.address),
    escape(o.itemsNotes),
    escape(o.subtotal),
    escape(o.discount),
    escape(o.couponCode || ""),
    escape(o.finalAmount || o.amount),
    escape(o.paymentMethod),
    escape(o.paymentStatus),
    escape(o.status),
    escape(o.paymentId),
    escape(o.signatureVerified),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kayal_samayal_orders_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
