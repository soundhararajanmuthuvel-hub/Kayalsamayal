"use client";

import {
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageCircle,
  CreditCard,
  Grid,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

const trustPillars = [
  "35+ Authentic Varieties",
  "No Artificial Colours",
  "Zero Chemical Preservatives",
  "Slow Sun-Dried & Stone Ground",
];

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* ── ATMOSPHERIC EDITORIAL CANVAS FROM STITCH ─────────────────── */}
      <section className="relative w-full bg-surface-container-low border-b border-border/60 overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="container-page relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Copy & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-5 text-left">
              {/* Heritage Micro Pill */}
              <div className="inline-flex items-center gap-2 bg-card px-3.5 py-1.5 rounded-full shadow-xs border border-border">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[0.68rem] font-bold text-primary uppercase tracking-wider font-sans">
                  Artisanal Tamil Heritage • Small Batch Crafted
                </span>
              </div>

              {/* Headline & H1 Entity — Immediately painted for instant LCP */}
              <div className="space-y-2">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-primary">
                  Kayal Samayal
                </h1>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug text-secondary">
                  100% Pure Traditional Masala &amp; South Indian Spices Online
                </h2>
              </div>

              {/* Editorial Lead Subheading — Instant paint (no delay) */}
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
                Welcome to Kayal Samayal. Order 100% pure homemade traditional masalas, aromatic podis, specialty noodles, and wellness health mixes crafted with heritage stone-ground recipes, slow sun-dried spices, and zero preservatives.
              </p>

              {/* Key Value Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {trustPillars.map((pillar, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card text-leaf font-semibold text-xs border border-border/80 shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>{pillar}</span>
                  </span>
                ))}
              </div>

              {/* Action CTA Group */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="touch"
                    className="w-full sm:w-auto font-bold gap-2 text-sm shadow-md"
                  >
                    <span>Shop Bestsellers</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="#categories"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="touch"
                    className="w-full sm:w-auto font-bold gap-2 text-sm border-primary/40 text-primary hover:bg-primary hover:text-white"
                  >
                    <Grid className="h-4 w-4" />
                    <span>Explore 35+ Varieties</span>
                  </Button>
                </a>
              </div>

              {/* Quick Micro Social Proof */}
              <div className="flex items-center gap-3 pt-2 text-muted-foreground text-xs">
                <div className="flex -space-x-2">
                  <span className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-[0.65rem] shadow-xs">
                    4.9★
                  </span>
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[0.65rem] shadow-xs">
                    12k
                  </span>
                </div>
                <p>
                  Loved by <span className="font-bold text-foreground">12,800+ homes</span> across Tamil Nadu, Bengaluru &amp; Pan-India
                </p>
              </div>
            </div>

            {/* Right Column: Visual Showcase Frame */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="relative bg-card p-4 sm:p-5 rounded-3xl border border-border shadow-xl overflow-hidden group">
                <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden bg-surface flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/hero-spices.webp"
                    alt="Authentic traditional spices prepared under natural sunlight"
                    width={720}
                    height={800}
                    fetchPriority="high"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out filter brightness-95"
                  />
                  
                  {/* Gradient Scrim for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />

                  {/* Floating Pill on Image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md p-4 rounded-2xl shadow-lg flex items-center justify-between border border-border/80">
                    <div>
                      <span className="text-[0.65rem] font-bold text-secondary uppercase tracking-wider block">
                        Featured Origin Blend
                      </span>
                      <h3 className="font-display font-bold text-base sm:text-lg text-primary">
                        Chettinad Kulambu Masala
                      </h3>
                      <p className="text-[0.7rem] text-muted-foreground">
                        Prepared with 18 heritage roasted whole spices
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-extrabold text-lg text-primary block">
                        ₹140
                      </span>
                      <span className="text-[0.65rem] font-bold text-leaf">
                        IN STOCK
                      </span>
                    </div>
                  </div>
                </div>

                {/* 100% Pure Veg Emblem Badge */}
                <div className="absolute top-7 left-7 bg-card/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-border">
                  <span className="w-3.5 h-3.5 rounded-xs bg-white flex items-center justify-center p-0.5 border border-leaf">
                    <span className="w-2 h-2 rounded-full bg-leaf" />
                  </span>
                  <span className="text-[0.65rem] font-bold text-leaf uppercase tracking-wider">
                    100% PURE VEG
                  </span>
                </div>
              </div>

              {/* Overlapping FSSAI Stamp */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-primary text-white p-4 rounded-2xl shadow-2xl flex-col items-center justify-center max-w-[170px] text-center border border-white/10 transform -rotate-2 hover:rotate-0 transition-transform">
                <ShieldCheck className="h-6 w-6 text-gold" />
                <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white mt-1">
                  FSSAI Certified
                </span>
                <span className="text-[0.68rem] text-white/80 font-mono leading-tight">
                  {brand.fssai}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── QUICK TRUST MICRO-STRIP FROM STITCH ──────────────────────── */}
      <div className="w-full bg-surface-container py-3.5 border-b border-border/60">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-foreground">
              <Truck className="h-4 w-4 text-secondary" />
              <span>Pan-India Express Delivery</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-leaf" />
              <span>FSSAI Registered Brand</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-foreground">
              <MessageCircle className="h-4 w-4 text-secondary" />
              <span>WhatsApp: {brand.phone}</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>UPI & Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
