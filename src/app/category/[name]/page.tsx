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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const decoded = decodeURIComponent(resolved.name).replace(/-/g, " ");
  const matched = categories.find(
    (c) =>
      c.toLowerCase() === decoded.toLowerCase()
  );

  const titleName = matched || decoded;
  const canonicalSlug = resolved.name.toLowerCase();

  // Category specific title strategy
  let categoryTitle = `Kayal Samayal ${titleName} | Authentic South Indian Products`;
  if (titleName.toLowerCase().includes("traditional masalas")) {
    categoryTitle = "Kayal Samayal Masalas | Traditional South Indian Spice Blends";
  } else if (titleName.toLowerCase().includes("podi")) {
    categoryTitle = "Kayal Samayal Podi | Authentic South Indian Podi Products";
  } else if (titleName.toLowerCase().includes("noodle")) {
    categoryTitle = "Kayal Samayal Specialty Noodles | Traditional & Healthy Noodles";
  } else if (titleName.toLowerCase().includes("health")) {
    categoryTitle = "Kayal Samayal Health Mixes & Malts | Traditional Food Products";
  }

  const categoryDescription = `Buy authentic Kayal Samayal ${titleName} online. Prepared with traditional coastal recipes, stone grinding, and zero preservatives.`;

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
  const decoded = decodeURIComponent(resolved.name).replace(/-/g, " ");
  const matched = categories.find(
    (c) =>
      c.toLowerCase() === decoded.toLowerCase()
  );
  const titleName = matched || decoded;
  const canonicalSlug = resolved.name.toLowerCase();

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
