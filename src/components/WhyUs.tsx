"use client";

import { motion } from "framer-motion";
import {
  Flame,
  Leaf,
  Layers,
  Ban,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";

const pillars = [
  {
    icon: Flame,
    num: "1",
    title: "Stone Ground Taste",
    desc: "Slow, low-heat grinding preserves the volatile natural essential oils of each seed, keeping aroma and medicinal heat intact.",
    color: "bg-secondary-container text-secondary",
  },
  {
    icon: Leaf,
    num: "2",
    title: "100% Pure & Natural Spices",
    desc: "First-grade whole coriander, Guntur chillies, and Alleppey turmeric. Zero artificial fillers, added saw dust, or synthetic binders.",
    color: "bg-leaf/10 text-leaf",
  },
  {
    icon: Layers,
    num: "3",
    title: "35+ Regional Varieties",
    desc: "A comprehensive catalog covering authentic Kongu, Chettinad, and Thanjavur household secrets rarely available in commercial stores.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Ban,
    num: "4",
    title: "Zero Added Preservatives",
    desc: "No MSG, no artificial colouring like Sudan Red, and no chemical anti-caking agents. What you taste is pure earth and spice.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Clock,
    num: "5",
    title: "Small Fresh Batches",
    desc: "We do not store inventory for months in dusty warehouses. We grind in disciplined micro-batches weekly upon demand.",
    color: "bg-accent text-primary",
  },
  {
    icon: MapPin,
    num: "6",
    title: "Direct from Tirupattur",
    desc: "Rooted in Tamil Nadu soil. Prepared with love by local women artisans, promoting authentic home-kitchen livelihood.",
    color: "bg-gold/15 text-gold",
  },
];

export default function WhyUs() {
  return (
    <section className="py-16 sm:py-24 bg-background border-b border-border/60">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <div className="inline-flex items-center justify-center gap-2 text-secondary mb-1">
            <span className="w-6 h-0.5 bg-secondary" />
            <span className="section-eyebrow">Our Sacred Food Promise</span>
            <span className="w-6 h-0.5 bg-secondary" />
          </div>
          <h2 className="section-title">
            Why Modern Kitchens Choose <span className="text-secondary font-display italic">Kayal Samayal</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto pt-1">
            In an era of mass-produced factory powders laden with preservatives and added starch, we honour the patient, slow methods of our grandmothers.
          </p>
        </div>

        {/* 6 Clean Visual Pillar Cards from Stitch Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)] transition-all hover:border-secondary/40 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} shadow-xs`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-display font-bold text-xs text-muted-foreground tracking-widest uppercase">
                      PILLAR {item.num}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-primary mb-2 group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                
                <div className="mt-6 pt-3 border-t border-border/50 flex items-center gap-1.5 text-leaf text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Guaranteed Purity</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
