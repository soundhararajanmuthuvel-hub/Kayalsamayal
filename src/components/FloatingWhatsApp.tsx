"use client";

import { MessageCircle } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";

export default function FloatingWhatsApp() {
  const url = whatsappLink("Hello Kayal Samayal! I would like to inquire about your products.");

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-5 right-5 z-40 flex items-center group"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with Kayal Samayal on WhatsApp (${brand.phone})`}
        className="relative flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_26px_rgba(37,211,102,0.55)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
        </span>
      </a>
      <span className="pointer-events-none absolute right-16 hidden rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-md group-hover:block transition-all whitespace-nowrap">
        Order on WhatsApp
      </span>
    </aside>
  );
}
