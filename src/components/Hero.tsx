"use client";

import { motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import Link from "next/link";

const trustPillars = [
  { text: "100% Natural Ingredients" },
  { text: "Traditional Recipes" },
  { text: "Direct from Tamil Nadu" },
  { text: "Premium Quality Assured" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-brand-purple pt-20"
      style={{ minHeight: "100dvh" }}
    >
      {/* Subtle spice silhouette pattern opacity overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 20 L58 35 L75 38 L62 50 L65 68 L50 60 L35 68 L38 50 L25 38 L42 35 Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial depth overlay */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-[#3d2417]/40 via-transparent to-transparent pointer-events-none" />

      {/* Top divider accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* LEFT COLUMN - TEXT CONTENT */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 sm:space-y-8 flex flex-col items-center lg:items-start">
          
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="select-none"
          >
            <span className="font-display italic text-xs tracking-[2px] text-gold-500 uppercase">
              TASTE THE TRADITION
            </span>
          </motion.div>

          {/* Headings */}
          <div className="space-y-2.5 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-white leading-tight font-normal"
              style={{ fontSize: "clamp(32px, 5vw, 52px)" }}
            >
              Authentic Kayalpatnam Masalas
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-brand-orange leading-tight font-normal"
              style={{ fontSize: "clamp(24px, 4vw, 40px)" }}
            >
              Since Generations
            </motion.div>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-[#e0e0e0] leading-relaxed text-sm sm:text-base max-w-[500px]"
          >
            No shortcuts, no additives—just pure, powerful flavours crafted with traditional recipes passed down through generations. Every blend is a masterpiece of authentic South Indian coastal heritage.
          </motion.p>

          {/* Trust Signals Grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[500px] text-left"
          >
            {trustPillars.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#e0e0e0]">
                <div className="w-5 h-5 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange shrink-0">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Call-to-Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center pt-2"
          >
            <a
              id="hero-shop-now-btn"
              href="#products"
              className="btn-primary text-sm sm:text-base text-center py-3.5 px-10 rounded-md font-medium shadow-[0_4px_12px_rgba(200,100,50,0.3)] hover:shadow-[0_8px_20px_rgba(200,100,50,0.4)] cursor-pointer"
            >
              Shop Now
            </a>
            <Link
              id="hero-learn-story-btn"
              href="/about"
              className="btn-outline text-sm sm:text-base text-center py-3 px-10 rounded-md font-medium border-2 border-white hover:bg-white/10 cursor-pointer"
            >
              Learn Our Story
            </Link>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - VISUAL ELEMENT (Option A) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full lg:w-1/2 flex items-center justify-center relative select-none"
        >
          {/* Glowing pulse backdrop */}
          <div className="absolute w-64 h-64 rounded-full bg-gold-500/10 blur-3xl animate-pulse pointer-events-none" />

          {/* Floating showcase frame */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-64 h-64 sm:w-80 sm:h-80 bg-white rounded-2xl p-4 shadow-[0_12px_32px_rgba(0,0,0,0.3)] border border-cream-200 flex items-center justify-center rotate-2 hover:rotate-0 transition-transform duration-300"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/fish-curry-masala.jpg"
              alt="Kayal Samayal Fish Curry Masala - Premium Jar"
              className="max-h-full object-contain rounded-lg"
              loading="eager"
            />

            {/* Floating Element 1: Small spice emoji */}
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 text-3xl filter drop-shadow-md"
            >
              🌶️
            </motion.div>

            {/* Floating Element 2: Fresh badge */}
            <div className="absolute -top-3 -right-3 bg-gold-500 text-espresso-950 text-[0.6rem] font-bold px-2.5 py-1 rounded-full shadow-md border border-white flex items-center gap-1 select-none">
              ✦ FRESH
            </div>

            {/* Floating Element 3: Bestseller label */}
            <div className="absolute -bottom-3 -right-3 badge-premium text-[0.6rem] sm:text-[0.65rem] border border-white">
              BESTSELLER
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-cream-300 pointer-events-none">
        <span className="font-body text-[0.6rem] tracking-widest uppercase opacity-60">Discover</span>
        <ChevronDown size={14} className="animate-bounce text-gold-500" />
      </div>
    </section>
  );
}
