"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Story() {
  return (
    <section id="story" className="relative texture-paper py-16 sm:py-24 overflow-hidden border-b border-cream-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column story preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text column — spans 7 cols on lg */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-5 text-center lg:text-left"
          >
            <p className="section-eyebrow">Our Heritage</p>
            <h2 className="section-title">
              Born on the Shores of <span className="gold-shimmer font-semibold">Kayalpatnam</span>
            </h2>
            <div className="divider-spice lg:mx-0 mb-4" />
            <p className="font-body text-espresso-800 leading-relaxed text-base max-w-xl mx-auto lg:mx-0">
              Kayalpatnam — the ancient port city of the Coromandel Coast — has long been a cradle of spice culture. Kayal Samayal was born from a deep respect for this heritage: the same slow-roasted traditions and honest ingredients passed down through generations.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="btn-primary text-sm font-bold min-h-[44px]"
              >
                Read Our Story
              </Link>
            </div>
          </motion.div>

          {/* Decorative rotating spice wheel — spans 5 cols on lg */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 flex items-center justify-center relative py-4 lg:py-0 select-none"
          >
            <div className="relative w-56 h-56 sm:w-72 sm:h-72">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-600/30 animate-spin-slow" />
              {/* Inner circle */}
              <div className="absolute inset-6 sm:inset-8 rounded-full bg-brand-purple shadow-2xl flex flex-col items-center justify-center p-4">
                <span className="text-4xl sm:text-5xl mb-1.5">🫙</span>
                <p className="font-display text-cream-100 text-center font-semibold text-xs sm:text-sm leading-snug">
                  Est. with Love
                  <br />
                  <span className="gold-shimmer text-sm">Pure Taste</span>
                </p>
              </div>
              {/* Orbiting spice dots */}
              {["🌶️", "🫚", "🌿", "⭐", "🧄", "🫛"].map((emoji, i) => {
                const angle = i * 60;
                const rad = (angle * Math.PI) / 180;
                const r = 110;
                const cx = 50 + (r / 140) * 50 * Math.cos(rad);
                const cy = 50 + (r / 140) * 50 * Math.sin(rad);
                return (
                  <div
                    key={emoji}
                    className="absolute text-lg sm:text-2xl transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${cx}%`, top: `${cy}%` }}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
