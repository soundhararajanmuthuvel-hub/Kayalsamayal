import type { Metadata } from "next";
import { products as localProducts } from "@/data/products";
import { getProducts } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

  const title = `${product.name} — Buy Pure Traditional Spice Online | Kayal Samayal`;
  const description = product.description || `Buy authentic ${product.name} from Kayal Samayal. 100% pure, stone ground, no artificial colours or preservatives.`;
  const canonicalUrl = `https://kayalsamayal.in/products/${product.id}`;
  const imageUrl = product.image ? `https://kayalsamayal.in${product.image}` : "https://kayalsamayal.in/assets/logo.jpg";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await params;
  let pool = localProducts;
  try {
    const data = await getProducts();
    if (data && data.length > 0) pool = data;
  } catch {
    pool = localProducts;
  }

  const product = pool.find((p) => p.id === resolved.id);

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image ? `https://kayalsamayal.in${product.image}` : "https://kayalsamayal.in/assets/logo.jpg",
        "description": product.description,
        "brand": {
          "@type": "Brand",
          "name": "Kayal Samayal",
        },
        "offers": {
          "@type": "Offer",
          "url": `https://kayalsamayal.in/products/${product.id}`,
          "priceCurrency": "INR",
          "price": product.price || 100,
          "availability":
            product.stock !== undefined && product.stock <= 0
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition",
          "seller": {
            "@type": "Organization",
            "name": "Kayal Samayal Masala",
          },
        },
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductDetailClient params={params} />
    </>
  );
}
