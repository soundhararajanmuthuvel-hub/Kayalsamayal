import { NextResponse } from "next/server";
import { fetchAdminInventory, updateAdminStock } from "@/lib/admin-api";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const res = await fetchAdminInventory();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    const items = res.products.map((p) => ({
      ...p,
      isLowStock: p.stock < 10,
      isOutOfStock: p.stock <= 0,
    }));

    const lowStockCount = items.filter((i) => i.isLowStock).length;
    const outOfStockCount = items.filter((i) => i.isOutOfStock).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: items.length,
        lowStockCount,
        outOfStockCount,
      },
      inventory: items,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession();
    const adminUser = session?.username || "admin";
    const body = await req.json();
    const { productId, stock, reason } = body || {};

    if (!productId || stock === undefined) {
      return NextResponse.json({ success: false, error: "Missing productId or stock" }, { status: 400 });
    }

    const res = await updateAdminStock(String(productId), Number(stock), reason, adminUser);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
