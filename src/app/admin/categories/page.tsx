"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface CategoryMeta {
  name: string;
  count: number;
  activeCount: number;
  sampleImage: string | null;
  emoji: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#0C2B1C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Product Categories ({categories.length})
        </h2>
        <p className="text-xs text-neutral-500">
          Categories derived from the Google Sheets product catalog
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div key={c.name} className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-xs hover:border-[#D4A373] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{c.emoji}</span>
              <span className="rounded-full bg-[#FAF4ED] px-2 py-0.5 text-[11px] font-bold text-[#8C5E28]">
                {c.count} {c.count === 1 ? "Product" : "Products"}
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-[#0C2B1C] mt-3">
              {c.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {c.activeCount} currently active for purchase
            </p>
            {c.sampleImage && (
              <div className="relative mt-4 h-28 w-full overflow-hidden rounded-lg bg-neutral-100">
                <Image src={c.sampleImage} alt={c.name} fill className="object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
