"use client";

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
  return (
    <section id="story" className="relative texture-paper py-24 sm:py-32 overflow-hidden">
      {/* Decorative jute-grid overlay on right */}
      <div className="absolute top-0 right-0 bottom-0 w-1/3 texture-jute opacity-50 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
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
            <br />
            <span className="gold-shimmer">Kayalpatnam</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
          <motion.p
            className="font-body text-espresso-800 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg"
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

        {/* Two-column story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-5"
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
              without artificial shortcuts.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-px bg-gold-600" />
              <p className="font-display italic text-rust-600 font-semibold text-lg">
                Pure. Honest. Coastal.
              </p>
            </div>
          </motion.div>

          {/* Decorative spice palette */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-600/30 animate-spin-slow" />
              {/* Inner circle */}
              <div className="absolute inset-8 rounded-full bg-espresso-950 shadow-2xl flex flex-col items-center justify-center p-4">
                <span className="text-6xl mb-2">🫙</span>
                <p className="font-display text-cream-100 text-center font-semibold text-sm leading-snug">
                  Crafted with
                  <br />
                  <span className="gold-shimmer text-base">Pure Love</span>
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
                    className="absolute text-2xl transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${cx}%`, top: `${cy}%` }}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Trust Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card-hover bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-cream-300 shadow-sm text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-600/10 mb-4">
                <pillar.icon size={22} className="text-gold-600" />
              </div>
              <h3 className="font-display font-semibold text-espresso-900 text-base mb-2">
                {pillar.title}
              </h3>
              <p className="font-body text-espresso-800 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
