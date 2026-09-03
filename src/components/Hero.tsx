"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/brand";

const trustPillars = [
  "100% Whole Spices, Stone Ground",
  "No Artificial Colours or Preservatives",
  "Authentic Kayalpatnam Coastal Recipes",
  "35+ Traditional Homemade Varieties",
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-spice-gradient text-primary-foreground pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28"
    >
      {/* Background Decorative Motifs */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20px 20px, #ffffff 2px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

      <div className="container-page relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Brand Story & Headline */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-7">
            {/* Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-xs font-semibold text-gold tracking-wide"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>TRADITIONAL SOUTH INDIAN HERITAGE</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Authentic Coastal Flavours,{" "}
                <span className="gold-shimmer block sm:inline">Crafted with Purity</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-sans"
            >
              From stone-ground sambar & fish curry masalas to aromatic podis, herbal teas, and multi-millet noodles — experience true homemade goodness with zero chemicals.
            </motion.p>

            {/* Trust Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left max-w-xl mx-auto lg:mx-0"
            >
              {trustPillars.map((pillar, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>{pillar}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <Link href="/products" className="w-full sm:w-auto">
                <Button variant="secondary" size="touch" className="w-full sm:w-auto font-bold gap-2 text-sm shadow-lg">
                  <span>Explore Catalogue (35+ Items)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href={whatsappLink("Hi Kayal Samayal! I would like to place an order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="whatsapp"
                  size="touch"
                  className="w-full sm:w-auto font-bold gap-2 text-sm shadow-md"
                >
                  <span>Quick WhatsApp Order</span>
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Right Column: Hero Showcase Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-[340px] sm:max-w-[400px]">
              {/* Card Showcase Frame */}
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-card/95 p-6 shadow-2xl backdrop-blur-md text-foreground">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/fish-curry-masala.jpg"
                    alt="Kayal Samayal Authentic Masalas"
                    className="h-full w-full object-contain filter drop-shadow-md"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge-premium">✦ BESTSELLER</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Traditional Masalas
                    </span>
                    <span className="text-xs font-semibold text-leaf flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> FSSAI Certified
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-primary">
                    Fish Curry Masala
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Slow-roasted coastal spice blend for rich, tangy curries with genuine Kayalpatnam heritage.
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <span className="text-[0.65rem] uppercase text-muted-foreground font-semibold block">Price</span>
                      <span className="text-lg font-bold text-foreground">₹60 / 100g</span>
                    </div>
                    <Link href="/products/fish-curry-masala-regular">
                      <Button variant="plum" size="sm" className="text-xs font-bold">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Floating Accent Badge */}
              <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card border border-border p-3 shadow-xl flex items-center gap-3 text-foreground select-none">
                <span className="text-2xl">🌿</span>
                <div>
                  <p className="text-xs font-bold text-primary">Zero Chemicals</p>
                  <p className="text-[0.65rem] text-muted-foreground">100% Pure & Unadulterated</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
