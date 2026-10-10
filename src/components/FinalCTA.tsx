"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand, whatsappLink } from "@/lib/brand";

export default function FinalCTA() {
  return (
    <section className="relative w-full bg-[#0D2F22] text-[#F8F4E9] py-16 sm:py-24 overflow-hidden border-b border-[#B88A3B]/30">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#174D35]/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#B88A3B]/10 blur-3xl pointer-events-none" />

      <div className="container-page relative z-10 text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#174D35] px-4 py-1.5 rounded-full border border-[#B88A3B]/30 text-xs font-semibold text-[#F8F4E9]">
          <span className="w-2 h-2 rounded-full bg-[#B88A3B] animate-pulse" />
          <span>Pure • Traditional • Heritage Quality</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Make Every Meal More Memorable
        </h2>

        <p className="text-[#F8F4E9]/85 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Experience the authentic taste of tradition. Order our signature coastal masalas, aromatic podis, and health mixes delivered fresh to your doorstep.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/products">
            <Button
              variant="gold"
              size="touch"
              className="font-bold gap-2 text-sm shadow-lg rounded-xl px-7"
            >
              <span>Explore Kayal Samayal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <a
            href={whatsappLink("Hi Kayal Samayal! I would like to explore your product range.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="touch"
              className="font-bold gap-2 text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>WhatsApp: {brand.phone}</span>
            </Button>
          </a>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#B88A3B]" />
            <span>FSSAI License: {brand.fssai}</span>
          </span>
          <span>•</span>
          <span>Free delivery above ₹{brand.freeShippingOver}</span>
          <span>•</span>
          <span>Secure Razorpay Checkout</span>
        </div>
      </div>
    </section>
  );
}
