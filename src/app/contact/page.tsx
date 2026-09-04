import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Kayal Samayal | Tirupattur, Tamil Nadu",
  description:
    "Contact Kayal Samayal Masala in Tirupattur, Tamil Nadu. Order directly on WhatsApp (+91 9003860616) or inquire about bulk traditional food orders.",
  alternates: {
    canonical: "https://kayalsamayal.in/contact",
  },
  openGraph: {
    title: "Contact Kayal Samayal | Tirupattur, Tamil Nadu",
    description:
      "Contact Kayal Samayal Masala in Tirupattur, Tamil Nadu. Order directly on WhatsApp (+91 9003860616) or inquire about bulk traditional food orders.",
    url: "https://kayalsamayal.in/contact",
    siteName: "Kayal Samayal",
    images: [
      {
        url: "https://kayalsamayal.in/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Contact Kayal Samayal",
      },
    ],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
