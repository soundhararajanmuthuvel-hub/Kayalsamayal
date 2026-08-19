import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kayal Samayal — Taste the Tradition",
  description:
    "Authentic South Indian spices, masalas, podis & health mixes rooted in Kayalpatnam coastal heritage. No shortcuts, no additives — just pure, powerful flavours.",
  keywords: [
    "Kayal Samayal",
    "South Indian Masala",
    "Kayalpatnam spices",
    "authentic podi",
    "health mix",
    "traditional masala",
    "fish curry masala",
    "biriyani masala",
    "herbal malt",
  ],
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
    shortcut: "/assets/logo.jpg",
  },
  openGraph: {
    title: "Kayal Samayal — Taste the Tradition",
    description:
      "Pure coastal spices and traditional masalas from Kayalpatnam heritage. Order on WhatsApp.",
    type: "website",
    locale: "en_IN",
    siteName: "Kayal Samayal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kayal Samayal — Taste the Tradition",
    description:
      "Authentic South Indian spices, masalas & health mixes. No preservatives. Pure flavour.",
  },
};

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${plusJakarta.variable} scroll-smooth`}
    >
      <body className="antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
