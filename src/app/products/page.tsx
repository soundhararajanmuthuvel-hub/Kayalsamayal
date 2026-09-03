import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "All Products — Traditional Masalas, Podis & Health Mixes | Kayal Samayal",
  description:
    "Explore our complete catalogue of 35+ traditional homemade spices, coastal masalas, spicy idli podis, millet noodles, and herbal health mixes from Kayalpatnam.",
  alternates: {
    canonical: "https://kayalsamayal.in/products",
  },
  openGraph: {
    title: "All Products — Traditional Masalas, Podis & Health Mixes | Kayal Samayal",
    description:
      "Explore 35+ authentic South Indian masalas, organic podis, millet noodles, and health mixes. Stone ground, no preservatives.",
    url: "https://kayalsamayal.in/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
