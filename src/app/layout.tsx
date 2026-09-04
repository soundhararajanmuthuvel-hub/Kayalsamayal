import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#2E152C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kayalsamayal.in"),
  title: "Kayal Samayal",
  description:
    "Shop authentic Kayal Samayal masalas, podis, health mixes, noodles and traditional food products. 35+ varieties made with traditional recipes and quality ingredients.",
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
    "Chettinad Kulambu Masala",
    "Gunpowder idli podi",
  ],
  alternates: {
    canonical: "https://www.kayalsamayal.in",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Kayal Samayal",
    description:
      "Shop authentic Kayal Samayal masalas, podis, health mixes, noodles and traditional food products. 35+ varieties made with traditional recipes and quality ingredients.",
    type: "website",
    locale: "en_IN",
    siteName: "Kayal Samayal",
    url: "https://www.kayalsamayal.in",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Kayal Samayal Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kayal Samayal",
    description:
      "Shop authentic Kayal Samayal masalas, podis, health mixes, noodles and traditional food products. 35+ varieties made with traditional recipes and quality ingredients.",
    images: ["/icon-512x512.png"],
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
      className={`${playfair.variable} ${plusJakarta.variable} scroll-smooth`}
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
