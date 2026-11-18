import { NextResponse } from "next/server";
import { fetchAdminCustomers } from "@/lib/admin-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    const res = await fetchAdminCustomers();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 502 });
    }

    let customers = res.customers;
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
