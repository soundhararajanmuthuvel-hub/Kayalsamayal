import type { MetadataRoute } from "next";
import { products as localProducts } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getUniqueCategories, slugifyCategory } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kayalsamayal.in";
  const now = new Date();

  // 1. Static Core Public Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/health-mixes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // 2. Fetch Products from Google Sheets API / Local Data
  let productList = localProducts;
  try {
    const remoteProducts = await getProducts();
    if (remoteProducts && remoteProducts.length > 0) {
      productList = remoteProducts;
    }
  } catch {
    productList = localProducts;
  }

  // 3. Dynamic Categories from active products
  const uniqueCategories = getUniqueCategories(productList);
  const categoryPages: MetadataRoute.Sitemap = uniqueCategories.map((cat) => {
    const slug = slugifyCategory(cat);
    return {
      url: `${baseUrl}/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  const productPages: MetadataRoute.Sitemap = productList
    .filter((p) => p.active !== false && p.id && p.name)
    .map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticPages, ...categoryPages, ...productPages];
}
