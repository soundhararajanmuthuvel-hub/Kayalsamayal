import { Product, Category, Tier } from "@/data/products";
import { Testimonial } from "@/data/testimonials";

const FALLBACK_API_URL = "https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec";

export const API_URL = process.env.NEXT_PUBLIC_KAYAL_API_URL || process.env.NEXT_PUBLIC_KAYAL_SAMAYAL_API_URL || FALLBACK_API_URL;

export interface CustomerInput {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface OrderInput {
  customer: CustomerInput;
  items: OrderItemInput[];
}

export interface OrderResponse {
  success: boolean;
  orderId: string;
  customerId: string;
  subtotal: number;
  shipping: number;
  discount: number;
  gst: number;
  grandTotal: number;
  paymentStatus: string;
  orderStatus: string;
  items: Array<{
    productId: string;
    productName: string;
    tier: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  message?: string;
  code?: string;
  error?: string;
}

export interface SettingsResponse {
  [key: string]: string;
}

// Mapping Helper for Products
function mapProduct(raw: any): Product {
  const price = Number(raw["Price"] || raw["price"] || 0);
  const mrp = Number(raw["MRP"] || raw["mrp"] || 0);
  const gst = Number(raw["GST"] || raw["gst"] || 0);
  const stock = Number(raw["Stock"] || raw["stock"] || 0);
  const id = String(raw["Product ID"] || raw["id"] || raw["productId"] || "");
  const name = String(raw["Product Name"] || raw["name"] || "");
  const categoryStr = String(raw["Category"] || raw["category"] || "");
  const tierStr = String(raw["Tier"] || raw["tier"] || "regular").toLowerCase();
  const image = raw["Image"] || raw["image"] || null;
  const description = String(raw["Description"] || raw["description"] || "");
  
  // Parse Highlights (Can be JSON array or Comma-separated string)
  let highlights: string[] = [];
  const rawHighlights = raw["Highlights"] || raw["highlights"];
  if (rawHighlights) {
    if (Array.isArray(rawHighlights)) {
      highlights = rawHighlights.map(String);
    } else if (typeof rawHighlights === "string") {
      const trimmed = rawHighlights.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          highlights = JSON.parse(trimmed);
        } catch {
          highlights = trimmed.split(",").map(s => s.trim()).filter(Boolean);
        }
      } else {
        highlights = trimmed.split(/,|\n/).map(s => s.trim()).filter(Boolean);
      }
    }
  }

  const activeVal = raw["Active"] ?? raw["active"];
  const active = activeVal === true || String(activeVal).toLowerCase() === "true" || activeVal === 1 || String(activeVal).toLowerCase() === "yes";

  // Tier normalization
  const tier: Tier = tierStr === "premium" ? "premium" : "regular";

  // Category normalization to exact union type
  let category: Category = "Traditional Masalas";
  if (categoryStr.includes("Podi")) category = "Podi Products";
  else if (categoryStr.includes("Noodles")) category = "Specialty Noodles";
  else if (categoryStr.includes("Health") || categoryStr.includes("Malt")) category = "Health Mixes & Malts";
  else if (categoryStr.includes("PeruKalam") || categoryStr.includes("Legiyam")) category = "PeruKalam Legiyam";

  // Pre-calculate WhatsApp order link
  const cleanPhone = "919003860616";
  const formattedTier = tier === "premium" ? "Premium" : "Regular";
  const whatsappMessage = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hi Kayal Samayal! I'd like to order "${name}" (${formattedTier} Tier).`
  )}`;

  return {
    id,
    name,
    category,
    image,
    tier,
    description,
    highlights,
    whatsappMessage,
    price,
    mrp,
    gst,
    stock,
    active,
  };
}

// Mapping Helper for Reviews
function mapReview(raw: any): Testimonial & { avatar?: string; active?: boolean } {
  const id = String(raw["Review ID"] || raw["id"] || raw["reviewId"] || Math.random().toString());
  const name = String(raw["Customer Name"] || raw["name"] || "Anonymous");
  const rating = Number(raw["Rating"] || raw["rating"] || 5);
  const date = String(raw["Date"] || raw["date"] || "recently");
  const review = String(raw["Review"] || raw["review"] || "");
  const avatar = raw["Avatar"] || raw["avatar"] || undefined;
  
  const activeVal = raw["Active"] ?? raw["active"];
  const active = activeVal === undefined || activeVal === true || String(activeVal).toLowerCase() === "true" || activeVal === 1 || String(activeVal).toLowerCase() === "yes";

  return {
    id,
    name,
    rating,
    date,
    review,
    avatar,
    active,
  };
}

// ── GET PRODUCTS ──────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}?action=products`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 } // cache for 1 minute Next.js caching
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      // Return mapped and filtered active products
      const mapped = json.data.map(mapProduct).filter((p: Product) => p.active !== false);
      return mapped;
    }
    return [];
  } catch (err) {
    console.warn("Failed to fetch products from API, falling back to local data.", err);
    return [];
  }
}

// ── GET REVIEWS ───────────────────────────────────────────────────────
export async function getReviews(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API_URL}?action=reviews`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      const mapped = json.data.map(mapReview).filter((r: any) => r.active !== false);
      return mapped;
    }
    return [];
  } catch (err) {
    console.warn("Failed to fetch reviews from API, falling back to local data.", err);
    return [];
  }
}

// ── GET SETTINGS ──────────────────────────────────────────────────────
export async function getSettings(): Promise<SettingsResponse> {
  try {
    const res = await fetch(`${API_URL}?action=settings`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && json.success) {
      return json.data || {};
    }
    return {};
  } catch (err) {
    console.warn("Failed to fetch settings from API.", err);
    return {};
  }
}

// ── CREATE CUSTOMER ───────────────────────────────────────────────────
export async function createCustomer(customer: CustomerInput): Promise<{ success: boolean; customerId?: string; message?: string; code?: string; error?: string }> {
  try {
    const payload = { action: "createCustomer", ...customer };
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // text/plain prevents CORS preflight triggers for simple Apps Script POSTs
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    
    // Log development details
    if (process.env.NODE_ENV !== "production") {
      console.log("createCustomer Details:", {
        action: payload.action,
        customer: customer,
        status: res.status,
        response: json
      });
    }

    return json;
  } catch (err) {
    console.error("Failed to create customer:", err);
    return { success: false, code: "NETWORK_ERROR", message: "We couldn't connect to our order system. Please check your connection and try again." };
  }
}

// ── CREATE ORDER ──────────────────────────────────────────────────────
export async function createOrder(order: OrderInput): Promise<OrderResponse> {
  try {
    const payload = { action: "createOrder", ...order };
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    
    // Log development details
    if (process.env.NODE_ENV !== "production") {
      console.log("createOrder Details:", {
        action: payload.action,
        customer: payload.customer,
        items: payload.items,
        status: res.status,
        response: json
      });
    }

    if (!json.success) {
      const errMsg = json.error || json.message || "Something went wrong while placing your order. Please try again.";
      const code = json.code || "API_ERROR";

      return {
        ...json,
        success: false,
        code,
        message: errMsg,
        error: errMsg
      };
    }

    return json;
  } catch (err: any) {
    console.error("Failed to create order:", err);
    return {
      success: false,
      code: "NETWORK_ERROR",
      orderId: "",
      customerId: "",
      subtotal: 0,
      shipping: 0,
      discount: 0,
      gst: 0,
      grandTotal: 0,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      items: [],
      message: "We couldn't connect to our order system. Please check your connection and try again.",
    };
  }
}

// ── UPDATE ORDER ──────────────────────────────────────────────────────
export async function updateOrder(orderId: string, updateData: any): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = { action: "updateOrder", orderId, ...updateData };
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Failed to update order:", err);
    return { success: false, message: "Failed to update order status." };
  }
}

// ── GET ORDER ─────────────────────────────────────────────────────────
export async function getOrder(orderId: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch(`${API_URL}?action=order&id=${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Failed to fetch order:", err);
    return { success: false, message: "Network error. Unable to fetch order details." };
  }
}
