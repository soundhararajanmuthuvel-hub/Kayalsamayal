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
    desc: "Slow, low-heat grinding preserves the volatile natural essential oils of each seed, keeping aroma and authentic spice warmth intact.",
    color: "bg-[#174D35]/10 text-[#174D35]",
  },
  {
    icon: Leaf,
    num: "2",
    title: "100% Pure & Natural",
    desc: "First-grade whole coriander, Guntur chillies, and Alleppey turmeric. Zero artificial fillers or synthetic binders.",
    color: "bg-[#174D35]/10 text-[#174D35]",
  },
  {
    icon: Layers,
    num: "3",
    title: "35+ Regional Varieties",
    desc: "A comprehensive catalogue covering authentic Kongu and Chettinad household secrets rarely available in mass commercial stores.",
    color: "bg-[#B88A3B]/10 text-[#B88A3B]",
  },
  {
    icon: Ban,
    num: "4",
    title: "Zero Preservatives",
    desc: "No artificial colours like Sudan Red, no MSG, and no chemical anti-caking agents. What you taste is pure earth and spice.",
    color: "bg-[#BA1A1A]/10 text-[#BA1A1A]",
  },
  {
    icon: Clock,
    num: "5",
    title: "Small Fresh Batches",
    desc: "We do not store inventory for months in dusty warehouses. We grind in disciplined micro-batches weekly upon demand.",
    color: "bg-[#174D35]/10 text-[#174D35]",
  },
  {
    icon: MapPin,
    num: "6",
    title: "Direct from Tirupattur",
    desc: "Rooted in Tamil Nadu soil. Prepared with love by local women artisans, honouring authentic home-kitchen livelihood.",
    color: "bg-[#B88A3B]/10 text-[#B88A3B]",
  },
];

export default function WhyUs() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-border/80">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <div className="inline-flex items-center justify-center gap-2 text-[#B88A3B] mb-1">
            <span className="w-6 h-0.5 bg-[#B88A3B]" />
            <span className="section-eyebrow">Our Food Principles</span>
            <span className="w-6 h-0.5 bg-[#B88A3B]" />
          </div>
          <h2 className="section-title text-[#332820]">
            Why Kitchens Choose <span className="text-[#174D35] font-display italic">Kayal Samayal</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-[#6B5E54] text-sm sm:text-base max-w-xl mx-auto pt-1">
            In an era of mass-produced factory powders laden with preservatives and added starch, we honour the patient, slow methods of traditional South Indian kitchens.
          </p>
        </div>

        {/* 6 Clean Visual Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="rounded-2xl border border-border bg-[#F8F4E9] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all hover:border-[#174D35]/40 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} shadow-2xs`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-display font-bold text-xs text-[#6B5E54] tracking-widest uppercase">
                      PILLAR {item.num}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#332820] mb-2 group-hover:text-[#174D35] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B5E54] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                
                <div className="mt-6 pt-3 border-t border-border/60 flex items-center gap-1.5 text-[#174D35] text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Standard</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
