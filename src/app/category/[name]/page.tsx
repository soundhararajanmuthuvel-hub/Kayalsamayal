import type { Metadata } from "next";
import { categories } from "@/data/products";
import CategoryClient from "./CategoryClient";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const decoded = decodeURIComponent(resolved.name).replace(/-/g, " ");
  const matched = categories.find(
    (c) =>
      c.toLowerCase() === decoded.toLowerCase() ||
      c.toLowerCase().includes(decoded.toLowerCase().split(" ")[0])
  );

  const titleName = matched || decoded;
  const canonicalSlug = resolved.name.toLowerCase();

  return {
    title: `${titleName} — Authentic South Indian Recipes | Kayal Samayal`,
    description: `Shop authentic ${titleName} online from Kayal Samayal. Stone ground, traditional coastal recipes with zero artificial colours or preservatives.`,
    alternates: {
      canonical: `https://kayalsamayal.in/category/${canonicalSlug}`,
    },
    openGraph: {
      title: `${titleName} | Kayal Samayal`,
      description: `Explore authentic ${titleName} prepared with 100% pure traditional ingredients.`,
      url: `https://kayalsamayal.in/category/${canonicalSlug}`,
    },
  };
}

export default function CategoryPage({ params }: PageProps) {
  return <CategoryClient params={params} />;
}
