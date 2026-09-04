import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Shop Kayal Samayal Products | Masalas, Podi & Traditional Foods",
  description:
    "Explore authentic Kayal Samayal food products. 35+ traditional homemade spices, coastal masalas, spicy podis, and health mixes crafted with pure ingredients.",
  alternates: {
    canonical: "https://kayalsamayal.in/products",
  },
  openGraph: {
    title: "Shop Kayal Samayal Products | Masalas, Podi & Traditional Foods",
    description:
      "Explore authentic Kayal Samayal food products. 35+ traditional homemade spices, coastal masalas, spicy podis, and health mixes crafted with pure ingredients.",
    url: "https://kayalsamayal.in/products",
    siteName: "Kayal Samayal",
    images: [
      {
        url: "https://kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Shop Kayal Samayal Products",
      },
    ],
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
