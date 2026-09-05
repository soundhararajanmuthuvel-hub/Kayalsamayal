import type { Metadata } from "next";
import { categories } from "@/data/products";
import CategoryClient from "./CategoryClient";

// Pre-render all 5 category pages at build time (○ Static instead of ƒ Dynamic)
export function generateStaticParams() {
  return categories.map((cat) => ({
    name: cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  }));
}


interface PageProps {
  params: Promise<{ name: string }>;
}

function slugifyCategory(cat: string) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const canonicalSlug = resolved.name.toLowerCase();
  const matched = categories.find((c) => slugifyCategory(c) === canonicalSlug);
  const titleName = matched || decodeURIComponent(resolved.name).replace(/-/g, " ");

  // Category specific title & description strategy per SEO Master Prompt v1.0
  let categoryTitle = `${titleName} Online | Authentic South Indian Foods | Kayal Samayal`;
  let categoryDescription = `Buy authentic Kayal Samayal ${titleName} online. 100% pure handmade recipes, stone-ground, no artificial colours or preservatives. Free shipping ₹500+.`;

  if (titleName.toLowerCase().includes("traditional masalas")) {
    categoryTitle = "Traditional Masalas Online | 100% Pure Handmade | Kayal Samayal";
    categoryDescription = "Shop 12 Traditional South Indian Masalas - 100% Pure, Stone-Ground, No Preservatives. Chettinad, Kongu & coastal recipes. Free shipping ₹500+.";
  } else if (titleName.toLowerCase().includes("podi")) {
    categoryTitle = "Authentic Podi Products & Gunpowder | Handmade | Kayal Samayal";
    categoryDescription = "Buy authentic South Indian Idli Podi, Paruppu Podi, Poondu Podi & curry leaf podi online. Pure ingredients, homemade taste, no additives.";
  } else if (titleName.toLowerCase().includes("noodle")) {
    categoryTitle = "Specialty Millet & Moringa Noodles Online | Kayal Samayal";
    categoryDescription = "Buy nutritious Moringa & millet noodles made with traditional whole grains. Zero maida, zero preservatives, 100% natural and healthy.";
  } else if (titleName.toLowerCase().includes("health")) {
    categoryTitle = "Health Mixes & Traditional Malts Online | Kayal Samayal";
    categoryDescription = "Buy pure Sathu Maavu & herbal health malts for immunity and strength. Traditional multi-grain blends prepared with zero chemicals.";
  } else if (titleName.toLowerCase().includes("legiyam") || titleName.toLowerCase().includes("perukalam")) {
    categoryTitle = "Traditional Perukalam Legiyam & Wellness Foods | Kayal Samayal";
    categoryDescription = "Buy authentic herbal Perukalam Legiyam formulated with traditional coastal herbs and spices. Natural wellness and digestive vitality.";
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
  const matched = categories.find((c) => slugifyCategory(c) === canonicalSlug);
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
