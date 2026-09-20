import type { Metadata } from "next";
import { products } from "@/data/products";
import { getUniqueCategories, findCategoryBySlug, slugifyCategory } from "@/lib/categories";
import CategoryClient from "./CategoryClient";

// Pre-render all active category pages at build time
export function generateStaticParams() {
  const dynamicCategories = getUniqueCategories(products);
  return dynamicCategories.map((cat) => ({
    name: slugifyCategory(cat),
  }));
}

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const canonicalSlug = resolved.name.toLowerCase();
  const dynamicCategories = getUniqueCategories(products);
  const matched = findCategoryBySlug(dynamicCategories, canonicalSlug);
  const titleName = matched || decodeURIComponent(resolved.name).replace(/-/g, " ");

  // Category specific title & description strategy per SEO Master Prompt v1.0
  let categoryTitle = `${titleName} Online | Authentic South Indian Foods | Kayal Samayal`;
  let categoryDescription = `Buy authentic Kayal Samayal ${titleName} online. Traditional recipes with no artificial colours or preservatives. Free shipping ₹500+.`;

  if (titleName.toLowerCase().includes("traditional masalas")) {
    categoryTitle = "Traditional Masalas Online | Authentic Recipes | Kayal Samayal";
    categoryDescription = "Shop 12 Traditional South Indian Masalas - Traditional Stone-Ground Blends, No Artificial Colours or Preservatives. Chettinad, Kongu & coastal recipes. Free shipping ₹500+.";
  } else if (titleName.toLowerCase().includes("podi")) {
    categoryTitle = "Authentic Podi Products & Gunpowder | Traditional Blends | Kayal Samayal";
    categoryDescription = "Buy authentic South Indian Idli Podi, Paruppu Podi, Poondu Podi & curry leaf podi online. Traditional recipes, homemade taste, no additives.";
  } else if (titleName.toLowerCase().includes("noodle")) {
    categoryTitle = "Specialty Millet & Moringa Noodles Online | Kayal Samayal";
    categoryDescription = "Buy nutritious Moringa & millet noodles made with traditional whole grains. Zero maida, no artificial preservatives, natural and wholesome.";
  } else if (titleName.toLowerCase().includes("health")) {
    categoryTitle = "Health Mixes & Traditional Malts Online | Kayal Samayal";
    categoryDescription = "Buy traditional Sathu Maavu & herbal health malts. Traditional multi-grain blends prepared with quality ingredients.";
  } else if (titleName.toLowerCase().includes("legiyam") || titleName.toLowerCase().includes("perukalam")) {
    categoryTitle = "Traditional Perukalam Legiyam & Wellness Foods | Kayal Samayal";
    categoryDescription = "Buy authentic herbal Perukalam Legiyam formulated with traditional coastal herbs and spices for everyday wellness.";
  }

  return {
    title: categoryTitle,
    description: categoryDescription,
    alternates: {
      canonical: `https://www.kayalsamayal.in/category/${canonicalSlug}`,
    },
    openGraph: {
      title: categoryTitle,
      description: categoryDescription,
      url: `https://www.kayalsamayal.in/category/${canonicalSlug}`,
      siteName: "Kayal Samayal",
      images: [
        {
          url: "https://www.kayalsamayal.in/icon-512x512.png",
          width: 512,
          height: 512,
          alt: `Kayal Samayal ${titleName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: categoryTitle,
      description: categoryDescription,
      images: ["https://www.kayalsamayal.in/icon-512x512.png"],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolved = await params;
  const canonicalSlug = resolved.name.toLowerCase();
  const dynamicCategories = getUniqueCategories(products);
  const matched = findCategoryBySlug(dynamicCategories, canonicalSlug);
  const titleName = matched || decodeURIComponent(resolved.name).replace(/-/g, " ");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        "name": `Kayal Samayal ${titleName}`,
        "item": `https://www.kayalsamayal.in/category/${canonicalSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryClient params={params} />
    </>
  );
}
