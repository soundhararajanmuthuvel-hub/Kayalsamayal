"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Leaf, Sparkles, HeartHandshake } from "lucide-react";

const pillars = [
  {
    icon: Leaf,
    title: "100% Pure & Unadulterated",
    desc: "No artificial food colors, MSG, preservatives, fillers, or chemical aromas. Real stone-ground spices only.",
  },
  {
    icon: Sparkles,
    title: "Authentic Coastal Heritage",
    desc: "Recipes preserved from the historic spice port of Kayalpatnam, maintaining genuine ancestral culinary balance.",
  },
  {
    icon: ShieldCheck,
    title: "Small-Batch Freshness",
    desc: "Slow-roasted and processed in controlled, frequent batches to lock in natural essential spice oils.",
  },
  {
    icon: HeartHandshake,
    title: "Customer-First Service",
    desc: "Transparent pricing, direct WhatsApp customer support, flexible UPI / COD payment, and safe delivery.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-16 sm:py-24 bg-surface border-b border-border/60">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <p className="section-eyebrow">Our Commitment</p>
          <h2 className="section-title">
            Why Choose <span className="text-secondary font-display italic">Kayal Samayal?</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Every product is made with the same uncompromising hygiene and care we demand for our own families.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4 hover:shadow-md transition-all hover:border-secondary/40 flex flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-secondary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-primary">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
