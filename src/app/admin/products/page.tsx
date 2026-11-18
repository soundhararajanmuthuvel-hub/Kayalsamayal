"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AdminProduct, fetchAdminInventory } from "@/lib/admin-api";
import { useAdmin } from "@/components/admin/AdminShell";
import { Search, Package } from "lucide-react";

export default function AdminProductsPage() {
  const { registerRefreshHandler } = useAdmin();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await fetchAdminInventory();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error("Failed to load products", e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminInventory()
      .then((data) => {
        if (!active) return;
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .catch((e) => {
        console.error("Failed to load products", e);
      });

    const unregister = registerRefreshHandler(fetchProducts);
    return () => {
      active = false;
      unregister();
    };
  }, [fetchProducts, registerRefreshHandler]);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
            Product Catalog ({filteredProducts.length})
          </h2>
          <p className="text-xs text-neutral-500">
            Products & pricing synced with catalog and Google Sheets
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-[#E8E2D8] bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or ID..."
            className="w-full rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 pl-8 pr-3 text-xs focus:border-[#D4A373] focus:outline-hidden"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] py-1.5 px-3 text-xs text-neutral-700 focus:outline-hidden"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-[#E8E2D8] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-semibold border-b border-[#E8E2D8]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Selling Price</th>
                <th className="px-4 py-3">MRP</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{p.name}</p>
                        <p className="font-mono text-[10px] text-neutral-400">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 font-medium">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      p.tier === "premium" ? "bg-amber-100 text-amber-900" : "bg-neutral-100 text-neutral-700"
                    }`}>
                      {p.tier || "regular"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900">₹{p.price}</td>
                  <td className="px-4 py-3 text-neutral-400 line-through">₹{p.mrp}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock < 10 ? "text-amber-700" : "text-neutral-800"}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      p.active ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
