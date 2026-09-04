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

  const title = `${product.name} | Kayal Samayal`;
  const description =
    product.description ||
    `Buy authentic ${product.name} from Kayal Samayal. 100% pure, stone ground, no artificial colours or preservatives.`;
  const canonicalUrl = `https://www.kayalsamayal.in/products/${product.id}`;
  const imageUrl = product.image
    ? `https://www.kayalsamayal.in${product.image}`
    : "https://www.kayalsamayal.in/icon-512x512.png";

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
      siteName: "Kayal Samayal",
      images: [
        {
          url: imageUrl,
          alt: `${product.name} by Kayal Samayal`,
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
              "priceCurrency": "INR",
              "price": product.price || 100,
              "priceValidUntil": "2027-12-31",
              "availability":
                product.stock !== undefined && product.stock <= 0
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
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
                "item": `https://www.kayalsamayal.in/category/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
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
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailClient params={params} />
    </>
  );
}
