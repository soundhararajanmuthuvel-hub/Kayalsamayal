"use client";

import { motion } from "framer-motion";
import { ChevronDown, MessageCircle, Sparkles } from "lucide-react";

const WA_LINK =
  "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20explore%20your%20products.";

const spiceAccents = [
  { emoji: "🌶️", label: "Chilli", x: "8%", y: "20%", delay: 0 },
  { emoji: "🫚", label: "Oil", x: "88%", y: "15%", delay: 0.5 },
  { emoji: "🌿", label: "Herb", x: "5%", y: "70%", delay: 1 },
  { emoji: "⭐", label: "Star Anise", x: "92%", y: "65%", delay: 0.8 },
  { emoji: "🧄", label: "Garlic", x: "15%", y: "85%", delay: 1.2 },
  { emoji: "🫛", label: "Cardamom", x: "82%", y: "82%", delay: 0.3 },
];

const trustPillars = [
  { icon: "🚫", text: "No Preservatives" },
  { icon: "🌿", text: "No Artificial Colours" },
  { icon: "🏺", text: "Stone-Ground Spices" },
  { icon: "🏡", text: "Heritage Recipes" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-spice-gradient"
    >
      {/* Animated noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial warmth glow */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-[#7a2c10]/40 via-transparent to-transparent" />

      {/* Floating spice emojis — desktop only */}
      {spiceAccents.map((s) => (
        <motion.div
          key={s.label}
          className="absolute hidden lg:flex text-3xl select-none pointer-events-none opacity-30"
          style={{ left: s.x, top: s.y }}
          animate={{ y: [0, -14, 0], rotate: [0, 5, -5, 0] }}
          transition={{
            duration: 5 + s.delay,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        >
          {s.emoji}
        </motion.div>
      ))}

      {/* Gold top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <Sparkles size={14} className="text-gold-400" />
          <span className="font-body text-xs font-700 tracking-[0.22em] uppercase text-gold-400">
            Kayalpatnam Heritage — Est. with Love
          </span>
          <Sparkles size={14} className="text-gold-400" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-black text-cream-50 leading-tight mb-4"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
        >
          Kayal Samayal
        </motion.h1>

        {/* Gold shimmer tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-display italic font-semibold text-gold-400 mb-6"
          style={{ fontSize: "clamp(1.3rem, 3.5vw, 2.2rem)" }}
        >
          <span className="gold-shimmer">Taste the Tradition</span>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="divider-spice mb-8"
        />

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="font-body text-cream-300 max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)" }}
        >
          No shortcuts. No additives.{" "}
          <span className="text-cream-100 font-semibold">
            Just pure, powerful flavours
          </span>{" "}
          rooted in centuries of coastal South Indian culinary heritage — straight
          from the heart of Kayalpatnam.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
        >
          <a
            id="hero-explore-masalas-btn"
            href="#products"
            className="btn-primary text-base"
          >
            Explore Our Masalas
          </a>
          <a
            id="hero-whatsapp-order-btn"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-base"
          >
            <MessageCircle size={18} />
            Order on WhatsApp
          </a>
        </motion.div>

        {/* Trust Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-3 sm:gap-6"
        >
          {trustPillars.map((pillar) => (
            <div
              key={pillar.text}
              className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2"
            >
              <span className="text-base">{pillar.icon}</span>
              <span className="font-body text-cream-200 text-xs font-medium tracking-wide">
                {pillar.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#story"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-cream-400 hover:text-gold-400 transition-colors"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-label="Scroll to Our Story"
      >
        <span className="font-body text-[0.65rem] tracking-widest uppercase">
          Discover
        </span>
        <ChevronDown size={18} />
      </motion.a>
    </section>
  );
}
