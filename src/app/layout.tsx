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
  metadataBase: new URL("https://kayalsamayal.in"),
  title: "Kayal Samayal | Artisanal South Indian Foods & Heritage Masalas",
  description:
    "Handcrafted South Indian masalas, authentic homemade podis, specialty millet noodles, and wellness health mixes prepared strictly with time-honoured heritage recipes. No artificial colours, zero preservatives.",
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
    canonical: "https://kayalsamayal.in",
  },
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
    shortcut: "/assets/logo.jpg",
  },
  openGraph: {
    title: "Kayal Samayal | Artisanal South Indian Foods & Heritage Masalas",
    description:
      "Handcrafted South Indian masalas, authentic homemade podis, specialty millet noodles, and wellness health mixes. 35+ Authentic Varieties. FSSAI Certified.",
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
    title: "Kayal Samayal | Artisanal South Indian Foods & Heritage Masalas",
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
