import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#341424",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kayalsamayal.in"),
  title: "Kayal Samayal | Traditional Coastal Masalas & Pure South Indian Foods",
  description:
    "Buy authentic South Indian spices, traditional coastal masalas, organic podis, herbal mixes and health mixes from Kayalpatnam heritage. No preservatives, 100% pure taste.",
  keywords: [
    "Kayal Samayal",
    "Kayalpattinam masala",
    "traditional masala",
    "coastal masala",
    "South Indian masala",
    "traditional podi",
    "health mixes",
    "traditional Indian food",
    "fish curry masala",
    "biriyani masala",
    "moringa noodles",
    "nannari sukku",
  ],
  alternates: {
    canonical: "https://kayalsamayal.in",
  },
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
    shortcut: "/assets/logo.jpg",
  },
  openGraph: {
    title: "Kayal Samayal | Traditional Coastal Masalas & Pure South Indian Foods",
    description:
      "Handcrafted spices, masalas, and health mixes rooted in Kayalpatnam coastal heritage. Pure, clean ingredients. 35+ Varieties.",
    type: "website",
    locale: "en_IN",
    siteName: "Kayal Samayal",
    url: "https://kayalsamayal.in",
    images: [
      {
        url: "/assets/logo.jpg",
        width: 800,
        height: 800,
        alt: "Kayal Samayal - Authentic Heritage Spices",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kayal Samayal | Traditional Coastal Masalas & Pure South Indian Foods",
    description:
      "Handcrafted spices, masalas, and health mixes from Kayalpatnam heritage. No artificial colors, zero preservatives.",
    images: ["/assets/logo.jpg"],
  },
};

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-secondary/20 selection:text-secondary">
        <CartProvider>
          {children}
          <CartDrawer />
          <FloatingWhatsApp />
        </CartProvider>
      </body>
    </html>
  );
}
