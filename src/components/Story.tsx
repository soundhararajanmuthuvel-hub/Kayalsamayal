"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Anchor, Leaf, FlaskConical, Heart } from "lucide-react";

const pillars = [
  {
    icon: FlaskConical,
    title: "Small-Batch Crafted",
    description:
      "Every blend is prepared in small, controlled batches to preserve the freshness and potency of each spice.",
  },
  {
    icon: Leaf,
    title: "No Preservatives",
    description:
      "We use no artificial preservatives, colours, or additives — just nature's own spices and herbs.",
  },
  {
    icon: Heart,
    title: "Traditional Stone-Ground",
    description:
      "Rooted in the traditional stone-grinding method, which retains the essential oils and full flavour of whole spices.",
  },
  {
    icon: Anchor,
    title: "Coastal Heritage",
    description:
      "Recipes passed down through generations in Kayalpatnam, the historic spice-trading port of coastal Tamil Nadu.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

export default function Story() {
  const [activePillar, setActivePillar] = useState(0);

  // Swipe handlers for mobile carousel
  const swipeStart = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const diff = swipeStart.current - e.clientX;
    if (diff > 50) {
      // Swipe Left -> Next
      setActivePillar((p) => (p + 1) % pillars.length);
    } else if (diff < -50) {
      // Swipe Right -> Prev
      setActivePillar((p) => (p - 1 + pillars.length) % pillars.length);
    }
  };

  return (
    <section id="story" className="relative texture-paper py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Decorative jute-grid overlay on right — hidden on mobile to avoid layout issues */}
      <div className="absolute top-0 right-0 bottom-0 w-1/3 texture-jute opacity-50 pointer-events-none hidden sm:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.p
            className="section-eyebrow mb-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Heritage
          </motion.p>
          <motion.h2
            className="section-title mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Born on the Shores of
            {/* Line break only on tablet+ to prevent orphan word on mobile */}
            <span className="hidden sm:inline"><br /></span>{" "}
            <span className="gold-shimmer">Kayalpatnam</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-5 sm:mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
          <motion.p
            className="font-body text-espresso-800 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg px-2"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Kayalpatnam — the ancient port city of the Coromandel Coast — has
            long been a cradle of spice culture. Kayal Samayal was born from a
            deep respect for this heritage: the same aromatic blends, the same
            slow-roasted traditions, the same honest ingredients that coastal
            families have treasured for generations.
          </motion.p>
        </div>

        {/* Two-column story — stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center mb-14 sm:mb-20">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-4 sm:space-y-5"
          >
            <p className="font-body text-espresso-800 leading-relaxed text-base">
              Every product in the Kayal Samayal range is crafted without
              compromise. We source whole spices and herbs, dry them naturally,
              and grind them to preserve the natural essential oils that define
              their character — oils that are lost when mass-produced under high
              heat and pressure.
            </p>
            <p className="font-body text-espresso-800 leading-relaxed text-base">
              From the fiery tang of our coastal Fish Curry Masala to the gentle
              warmth of our Golden Milk Magic, each blend is a celebration of
              authentic South Indian culinary wisdom — without shortcuts,
              without artificial additives.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-px bg-gold-600 shrink-0" />
              <p className="font-display italic text-rust-600 font-semibold text-lg">
                Pure. Honest. Coastal.
              </p>
            </div>
          </motion.div>

          {/* Decorative spice palette — smaller on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative flex items-center justify-center py-4 lg:py-0"
          >
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-600/30 animate-spin-slow" />
              {/* Inner circle */}
              <div className="absolute inset-6 sm:inset-8 rounded-full bg-espresso-950 shadow-2xl flex flex-col items-center justify-center p-4">
                <span className="text-4xl sm:text-6xl mb-2">🫙</span>
                <p className="font-display text-cream-100 text-center font-semibold text-xs sm:text-sm leading-snug">
                  Crafted with
                  <br />
                  <span className="gold-shimmer text-sm sm:text-base">Pure Love</span>
                </p>
              </div>
              {/* Orbiting spice dots */}
              {["🌶️", "🫚", "🌿", "⭐", "🧄", "🫛"].map((emoji, i) => {
                const angle = i * 60;
                const rad = (angle * Math.PI) / 180;
                const r = 130;
                const cx = 50 + (r / 160) * 50 * Math.cos(rad);
                const cy = 50 + (r / 160) * 50 * Math.sin(rad);
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

        {/* Desktop/Tablet view: Grid layout */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card-hover bg-white/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-cream-300 shadow-sm text-center"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gold-600/10 mb-3 sm:mb-4">
                <pillar.icon size={20} className="text-gold-600" />
              </div>
              <h3 className="font-display font-semibold text-espresso-900 text-sm sm:text-base mb-2">
                {pillar.title}
              </h3>
              <p className="font-body text-espresso-800 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile view: 1-by-1 swipe carousel */}
        <div className="sm:hidden flex flex-col items-center px-2">
          <div
            className="w-full"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            style={{ touchAction: "pan-y" }}
          >
            <motion.div
              key={activePillar}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-cream-300 shadow-md text-center flex flex-col items-center min-h-[190px]"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-600/10 mb-4">
                {(() => {
                  const Icon = pillars[activePillar].icon;
                  return <Icon size={22} className="text-gold-600" />;
                })()}
              </div>
              <h3 className="font-display font-bold text-espresso-900 text-base mb-2">
                {pillars[activePillar].title}
              </h3>
              <p className="font-body text-espresso-800 text-sm leading-relaxed">
                {pillars[activePillar].description}
              </p>
            </motion.div>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-2 mt-4 justify-center">
            {pillars.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePillar(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === activePillar ? "bg-gold-600 scale-125" : "bg-cream-300"
                }`}
                aria-label={`Go to pillar ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
