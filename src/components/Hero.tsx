"use client";

import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

const trustPillars = [
  { icon: "📍", label: "Tirupattur, Tamil Nadu", text: "Heritage Location" },
  { icon: "✓", label: "Organic & Traditional", text: "Zero Preservatives" },
  { icon: "🏆", label: "Premium Quality", text: "Authentic Taste" },
];

export default function Hero() {
  return (
    <>
      <section
        id="hero"
        className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-spice-gradient pt-20"
      >
        {/* Animated noise texture overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Radial warmth glow */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-[#4a0a50]/40 via-transparent to-transparent pointer-events-none" />

        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

        {/* Main Content Split: Left Info, Right Stacked Images */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Text Column */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 sm:space-y-8">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20"
            >
              <Sparkles size={12} className="text-gold-500 shrink-0 animate-pulse" />
              <span className="font-body text-[0.65rem] sm:text-xs font-bold tracking-[0.25em] uppercase text-gold-500">
                TASTE THE TRADITION
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-black text-cream-50 leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 4.2rem)" }}
            >
              Authentic Kayalpatnam Masalas<br />
              <span className="gold-shimmer font-semibold">Since Generations</span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-body text-cream-300 max-w-xl mx-auto lg:mx-0 leading-relaxed text-sm sm:text-base px-1"
            >
              No shortcuts, no additives—just pure, powerful flavours crafted with traditional recipes.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-stretch sm:items-center px-4 sm:px-0"
            >
              <a
                id="hero-explore-masalas-btn"
                href="#products"
                className="btn-primary text-sm sm:text-base text-center min-h-[48px] flex items-center justify-center cursor-pointer"
              >
                Shop Now
              </a>
              <a
                id="hero-about-story-btn"
                href="/about"
                className="btn-outline text-sm sm:text-base text-center min-h-[48px] flex items-center justify-center cursor-pointer"
              >
                Learn Our Story
              </a>
            </motion.div>
          </div>

          {/* Right Product Image Collage Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[300px] sm:min-h-[400px] select-none"
          >
            {/* Soft decorative background glow */}
            <div className="absolute w-64 h-64 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

            {/* Overlapping Stacks */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Product 1: ABC Malt (Left/Back) */}
              <div className="absolute transform -translate-x-12 -rotate-12 w-32 h-32 sm:w-44 sm:h-44 bg-white/95 rounded-2xl p-2 shadow-xl border border-cream-300/40 transition-transform hover:scale-105 hover:z-30 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/abc-malt.jpg"
                  alt="ABC Malt Premium - Health Drink"
                  className="w-full h-full object-contain rounded-lg"
                  loading="eager"
                />
              </div>

              {/* Product 2: Biriyani Masala (Right/Back) */}
              <div className="absolute transform translate-x-12 rotate-12 w-32 h-32 sm:w-44 sm:h-44 bg-white/95 rounded-2xl p-2 shadow-xl border border-cream-300/40 transition-transform hover:scale-105 hover:z-30 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/biriyani-masala.jpg"
                  alt="Biriyani Masala - Heritage Spices"
                  className="w-full h-full object-contain rounded-lg"
                  loading="eager"
                />
              </div>

              {/* Product 3: Fish Curry Masala (Center/Front) */}
              <div className="absolute z-20 w-36 h-36 sm:w-48 sm:h-48 bg-white rounded-2xl p-2.5 shadow-2xl border-2 border-brand-orange transition-transform hover:scale-105 hover:z-30 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/fish-curry-masala.jpg"
                  alt="Fish Curry Masala - Traditional Coastal Spices"
                  className="w-full h-full object-contain rounded-lg"
                  loading="eager"
                />
                <span className="absolute -top-3 -right-3 badge-premium text-[0.55rem]">BEST SELLER</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-cream-400 pointer-events-none">
          <span className="font-body text-[0.6rem] tracking-widest uppercase opacity-60">Discover</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* Trust Strip Banner below Hero */}
      <section className="bg-cream-200 border-y border-cream-300 py-6 relative z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y-0 divide-x-0 sm:divide-x divide-cream-300/70">
            {trustPillars.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-2 space-y-1">
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="font-display font-bold text-brand-purple text-sm sm:text-base leading-tight">
                  {item.label}
                </span>
                <span className="font-body text-espresso-800 text-[0.67rem] sm:text-xs tracking-wide">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
