import { PackageSearch } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import type { Product } from "@/data/products";

interface Props {
  products: Product[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  action?: React.ReactNode;
}

export function ProductGrid({
  products,
  loading,
  emptyTitle = "No products found",
  emptyMessage = "Try a different search term or clear your category filters.",
  action,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 sm:p-14 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-secondary" aria-hidden="true" />
        <h3 className="mt-4 font-display text-lg font-bold text-foreground">{emptyTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
