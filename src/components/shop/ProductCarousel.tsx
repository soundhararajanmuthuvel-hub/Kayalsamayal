import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/products";

/** Mobile: horizontal snap row. Tablet/Desktop: responsive grid. */
export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <>
      <ul className="snap-row no-scrollbar -mx-4 px-4 pb-4 lg:hidden" aria-label="Products">
        {products.map((product) => (
          <li key={product.id} className="snap-cell w-[70vw] max-w-[280px] min-w-[220px]">
            <ProductCard product={product} className="h-full" />
          </li>
        ))}
      </ul>
      <div className="hidden gap-6 lg:grid lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
