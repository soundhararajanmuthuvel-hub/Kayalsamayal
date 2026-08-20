import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#2c221e",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kayal Samayal | Traditional Coastal Masalas & South Indian Foods",
  description:
    "Buy authentic South Indian spices, traditional coastal masalas, organic podis, and health mixes from Kayalpatnam heritage. No preservatives, pure flavour.",
  keywords: [
    "Kayal Samayal",
    "traditional masala",
    "coastal masala",
    "Kayalpattinam masala",
    "South Indian masala",
    "traditional podi",
    "South Indian podi",
    "health mixes",
    "traditional Indian food",
    "coastal food products",
    "authentic South Indian flavours",
    "fish curry masala",
    "biriyani masala",
    "herbal malt",
  ],
  alternates: {
    canonical: "https://kayalsamayal-gamma.vercel.app",
  },
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
    shortcut: "/assets/logo.jpg",
  },
  openGraph: {
    title: "Kayal Samayal | Traditional Coastal Masalas & South Indian Foods",
    description:
      "Handcrafted spices, masalas, and health mixes rooted in Kayalpatnam coastal heritage. Pure, clean ingredients. Order online via WhatsApp & COD.",
    type: "website",
    locale: "en_IN",
    siteName: "Kayal Samayal",
    url: "https://kayalsamayal-gamma.vercel.app",
    images: [
      {
        url: "https://kayalsamayal-gamma.vercel.app/assets/logo.jpg",
        width: 800,
        height: 800,
        alt: "Kayal Samayal - Authentic Heritage Spices",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kayal Samayal | Traditional Coastal Masalas & South Indian Foods",
    description:
      "Handcrafted spices, masalas, and health mixes from Kayalpatnam heritage. No additives, no preservatives. Pure coastal flavour.",
    images: ["https://kayalsamayal-gamma.vercel.app/assets/logo.jpg"],
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
