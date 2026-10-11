"use client";

import {
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Grid,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroProductShowcase from "@/components/HeroProductShowcase";

const trustPillars = [
  "35+ Traditional Varieties",
  "Zero Chemical Preservatives",
  "Slow Sun-Dried & Stone Ground",
  "Direct from Tirupattur",
];

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* ── SECTION C: DARK FOREST-GREEN HERO CANVAS ────────────────── */}
      <section className="relative w-full bg-[#0D2F22] text-[#F8F4E9] overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-[#B88A3B]/20">
        {/* Subtle Ambient Spice Lighting */}
        <div className="absolute -top-36 -left-36 w-96 h-96 rounded-full bg-[#174D35]/50 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-36 w-[32rem] h-[32rem] rounded-full bg-[#B88A3B]/10 blur-3xl pointer-events-none" />

        <div className="container-page relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Headline, Copy & Primary Action */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
              
              {/* Traditional Brand Pill */}
              <div className="inline-flex items-center gap-2 bg-[#174D35] px-4 py-1.5 rounded-full border border-[#B88A3B]/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#B88A3B] animate-pulse" />
                <span className="text-[0.7rem] font-bold text-[#F8F4E9] uppercase tracking-wider font-sans">
                  Kayal Samayal • Artisanal South Indian Kitchen
                </span>
              </div>

              {/* Master Headline from Art Direction */}
              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                  Bring the Taste of <span className="italic text-[#B88A3B]">Tradition</span> to Your Table
                </h1>
                <p className="text-[#F8F4E9]/85 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-xl">
                  Discover thoughtfully prepared spice blends, traditional podis, specialty noodles and nourishing food mixes from Kayal Samayal.
                </p>
              </div>

              {/* Verified Trust Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {trustPillars.map((pillar, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#174D35]/80 text-[#F8F4E9] font-medium text-xs border border-white/10"
                  >
                    <Check className="h-3.5 w-3.5 text-[#B88A3B] stroke-[2.5]" />
                    <span>{pillar}</span>
                  </span>
                ))}
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button
                    variant="gold"
                    size="touch"
                    className="w-full sm:w-auto font-bold gap-2 text-sm shadow-md rounded-xl"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Shop All Products</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <a href="#categories" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="touch"
                    className="w-full sm:w-auto font-bold gap-2 text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl"
                  >
                    <Grid className="h-4 w-4 text-[#B88A3B]" />
                    <span>Explore Categories</span>
                  </Button>
                </a>
              </div>

              {/* Micro Proof Notice */}
              <p className="text-white/60 text-xs pt-1">
                Shipped directly from our facility in Tirupattur, Tamil Nadu. Free delivery on orders over ₹500.
              </p>
            </div>

            {/* Right Column: Authentic Product Packaging Showcase */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <HeroProductShowcase />
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION D: TRUST HIGHLIGHTS (GENUINE BENEFITS) ─────────── */}
      <section className="w-full bg-[#F8F4E9] py-6 sm:py-8 border-b border-border/80">
        <div className="container-page">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-border/70 shadow-xs">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#174D35]/10 flex items-center justify-center text-[#174D35]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-[#332820] leading-tight">
                  Traditional Food Products
                </h3>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  Kongu &amp; Chettinad stone recipes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-border/70 shadow-xs">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#B88A3B]/10 flex items-center justify-center text-[#B88A3B]">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-[#332820] leading-tight">
                  Convenient Online Ordering
                </h3>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  Delivering all across India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-border/70 shadow-xs">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#174D35]/10 flex items-center justify-center text-[#174D35]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-[#332820] leading-tight">
                  Secure Online Payments
                </h3>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  100% encrypted Razorpay gateway
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-border/70 shadow-xs">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#B88A3B]/10 flex items-center justify-center text-[#B88A3B]">
                <span className="font-bold text-sm">COD</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-[#332820] leading-tight">
                  Cash on Delivery
                </h3>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  Available for verified pincodes
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
