import { NextResponse } from "next/server";
import { fetchAdminInventory, updateAdminStock } from "@/lib/admin-api";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category")?.toLowerCase().trim() || "all";

    const res = await fetchAdminInventory();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    let products = res.products;
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.id.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }
    if (category && category !== "all") {
      products = products.filter((p) => p.category.toLowerCase() === category);
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
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
