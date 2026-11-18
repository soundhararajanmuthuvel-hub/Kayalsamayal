import { NextResponse } from "next/server";
import { fetchAdminInventory } from "@/lib/admin-api";
import { CATEGORY_FALLBACK_META } from "@/lib/categories";

export async function GET() {
  try {
    const res = await fetchAdminInventory();
    const products = res.products || [];

    const categoryMap: Record<
      string,
      { name: string; count: number; activeCount: number; sampleImage: string | null; emoji: string }
    > = {};

    products.forEach((p) => {
      const cat = p.category || "Traditional Masalas";
      if (!categoryMap[cat]) {
        const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const meta = CATEGORY_FALLBACK_META[slug] || { emoji: "📦", image: null };
        categoryMap[cat] = {
          name: cat,
          count: 0,
          activeCount: 0,
          sampleImage: p.image || meta.image || null,
          emoji: meta.emoji,
        };
      }
      categoryMap[cat].count++;
      if (p.active) categoryMap[cat].activeCount++;
    });

    const categories = Object.values(categoryMap).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
