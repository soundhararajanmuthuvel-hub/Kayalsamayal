import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us & Direct Customer Support | Kayal Samayal",
  description:
    "Get in touch with Kayal Samayal. Order directly on WhatsApp (+91 9003860616), inquire about wholesale/bulk orders, or send us your feedback.",
  alternates: {
    canonical: "https://kayalsamayal.in/contact",
  },
  openGraph: {
    title: "Contact Us & Direct Customer Support | Kayal Samayal",
    description:
      "Direct customer support, WhatsApp ordering, and kitchen address for Kayal Samayal Masala, Tirupattur.",
    url: "https://kayalsamayal.in/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
