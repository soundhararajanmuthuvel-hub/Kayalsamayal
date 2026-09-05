import type { Metadata } from "next";
import { products as localProducts } from "@/data/products";
import { getProducts } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";

// ── Incremental Static Regeneration ──────────────────────────────────────────
// Pages pre-rendered at build; revalidated on-demand when ≥60 s stale.
// This ensures Googlebot always gets server-rendered HTML with current prices.
export const revalidate = 60;

// ── Pre-render all active product pages at build time ─────────────────────────
// Build output changes from ƒ (Dynamic) → ○ (Static) for all 35 products.
export async function generateStaticParams() {
  try {
    const data = await getProducts();
    const pool = data && data.length > 0 ? data : localProducts;
    return pool
      .filter((p) => p.active !== false && p.id)
      .map((p) => ({ id: p.id }));
  } catch {
    // Fallback to local seed data on build-time API error
    return localProducts
      .filter((p) => p.active !== false && p.id)
      .map((p) => ({ id: p.id }));
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  let pool = localProducts;
  try {
    const data = await getProducts();
    if (data && data.length > 0) pool = data;
  } catch {
    pool = localProducts;
  }

  const product = pool.find((p) => p.id === resolved.id);

  if (!product) {
    return {
      title: "Product Not Found | Kayal Samayal",
      description: "Explore our authentic South Indian spices and health mixes from Kayalpatnam.",
    };
  }

  const title       = `${product.name} | Buy Online | Kayal Samayal`;
  const description =
    product.description ||
    `Buy 100% pure authentic ${product.name} from Kayal Samayal. Traditional stone-ground South Indian recipe with no artificial colours or preservatives. Order online today!`;
  const canonicalUrl = `https://www.kayalsamayal.in/products/${product.id}`;
  const imageUrl     = product.image
    ? `https://www.kayalsamayal.in${product.image}`
    : "https://www.kayalsamayal.in/icon-512x512.png";

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} online`,
      "buy masala online",
      "traditional masala",
      "South Indian spices",
      "Kayal Samayal",
      product.category,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Kayal Samayal",
      images: [{ url: imageUrl, alt: `${product.name} by Kayal Samayal` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await params;
  let pool = localProducts;
  try {
    const data = await getProducts();
    if (data && data.length > 0) pool = data;
  } catch {
    pool = localProducts;
  }

  const product = pool.find((p) => p.id === resolved.id) ?? null;

  // Only emit price in schema when we have a real, non-zero price.
  // Never fabricate a fallback price in structured data.
  const hasRealPrice = (product?.price ?? 0) > 0;
  const isInStock    =
    product?.stock === undefined || (product?.stock ?? 0) > 0;

  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "@id": `https://www.kayalsamayal.in/products/${product.id}#product`,
            "name": product.name,
            "image": product.image
              ? `https://www.kayalsamayal.in${product.image}`
              : "https://www.kayalsamayal.in/icon-512x512.png",
            "description": product.description,
            "sku": product.id,
            "brand": {
              "@type": "Brand",
              "name": "Kayal Samayal",
            },
            "offers": {
              "@type": "Offer",
              "url": `https://www.kayalsamayal.in/products/${product.id}`,
              // Conditionally include price — only when genuinely available from real product data
              ...(hasRealPrice
                ? {
                    "priceCurrency": "INR",
                    "price": product.price,
                  }
                : {}),
              "availability": isInStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              "itemCondition": "https://schema.org/NewCondition",
              "seller": {
                "@type": "Organization",
                "name": "Kayal Samayal Masala",
                "url": "https://www.kayalsamayal.in",
              },
            },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `https://www.kayalsamayal.in/products/${product.id}#breadcrumb`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.kayalsamayal.in",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": "https://www.kayalsamayal.in/products",
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.category,
                "item": `https://www.kayalsamayal.in/category/${product.category
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}`,
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": product.name,
                "item": `https://www.kayalsamayal.in/products/${product.id}`,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {/* Product + Breadcrumb structured data — server-rendered for Googlebot */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      {/*
       * Server-rendered product summary.
       *
       * WHY: ProductDetailClient uses useEffect to fetch live product data,
       * which means without this block the initial HTML would be an empty
       * loading spinner — Googlebot would see no product content at all.
       *
       * This sr-only block emits the essential product signals (H1, price,
       * description, availability) in the initial server HTML. The full
       * interactive experience rendered by ProductDetailClient is identical
       * and visible to human users after React hydration.
       *
       * NOTE: The client component also receives `initialProduct` so it can
       * render immediately on first paint without a loading spinner.
       */}
      {product && (
        <div className="sr-only">
          <h1>{product.name} — Kayal Samayal</h1>
          {hasRealPrice && (
            <p>
              Price: ₹{product.price} INR.{" "}
              {isInStock ? "In Stock." : "Currently out of stock."}
            </p>
          )}
          <p>{product.description}</p>
          {product.highlights?.length > 0 && (
            <ul>
              {product.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
          <p>Category: {product.category}</p>
          <p>Brand: Kayal Samayal — authentic South Indian products from Kayalpatnam.</p>
        </div>
      )}

      {/* Full interactive product page — hydrates immediately with initialProduct */}
      <ProductDetailClient params={params} initialProduct={product} />
    </>
  );
}
