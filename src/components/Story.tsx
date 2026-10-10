"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export default function Story() {
  return (
    <section className="py-16 sm:py-24 bg-[#F8F4E9] border-b border-border/80 overflow-hidden">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Authentic Visual Frame */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-md overflow-hidden">
              <div className="relative h-[380px] sm:h-[440px] rounded-2xl overflow-hidden bg-[#F4F1E9] flex items-center justify-center">
                <picture>
                  <source srcSet="/assets/story-tradition.webp" type="image/webp" />
                  <img
                    src="/assets/story-tradition.webp"
                    alt="Authentic traditional sun-dried spice preparation"
                    width={720}
                    height={800}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-2xl filter brightness-95"
                  />
                </picture>
                
                {/* Floating Authentic Quote Card */}
                <div className="absolute -bottom-1 right-2 left-2 sm:left-auto sm:right-3 bg-[#0D2F22] text-[#F8F4E9] p-4 rounded-2xl shadow-xl max-w-sm border border-[#B88A3B]/30">
                  <p className="font-display italic text-xs sm:text-sm leading-relaxed text-white">
                    &ldquo;Real flavour cannot be rushed with machines. Spices must breathe the sun.&rdquo;
                  </p>
                  <span className="block text-[0.65rem] font-bold text-[#B88A3B] uppercase tracking-wider mt-1.5">
                    — Kayal Samayal Tradition
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Editorial Narrative */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 text-[#B88A3B] justify-center lg:justify-start">
              <span className="w-6 h-0.5 bg-[#B88A3B]" />
              <span className="section-eyebrow">Our Kitchen Roots</span>
            </div>

            <h2 className="section-title text-[#332820]">
              Restoring the Lost Aromas of Our Grandmother&apos;s Brass Kitchen.
            </h2>
            <div className="divider-spice lg:mx-0" />

            <div className="space-y-4 text-[#6B5E54] text-sm sm:text-base leading-relaxed">
              <p>
                Kayal Samayal was born out of a simple, nostalgic yearning: why does modern food never smell like the kulambu made in our childhood homes? Mass-produced commercial powders rely on chemical flavour enhancers and excessive starch fillers to cut costs.
              </p>
              <p>
                We went back to the roots in <strong>Tirupattur, Tamil Nadu</strong>. We revived time-honoured culinary recipes, honouring the patient craft of sun-drying fresh ingredients before gently stone-pounding them into pure, fragrant food blends.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-border shadow-xs text-center">
                <span className="font-display font-extrabold text-2xl text-[#174D35] block">100%</span>
                <span className="text-[0.68rem] font-bold text-[#6B5E54] uppercase tracking-wider">Natural Ingredients</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-border shadow-xs text-center">
                <span className="font-display font-extrabold text-2xl text-[#174D35] block">Zero</span>
                <span className="text-[0.68rem] font-bold text-[#6B5E54] uppercase tracking-wider">Artificial Additives</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-border shadow-xs text-center col-span-2 sm:col-span-1">
                <span className="font-display font-extrabold text-2xl text-[#174D35] block">35+</span>
                <span className="text-[0.68rem] font-bold text-[#6B5E54] uppercase tracking-wider">Traditional Varieties</span>
              </div>
            </div>

            {/* Verified Business Credentials */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-semibold text-[#332820]">
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-[#174D35]" />
                <span>FSSAI Reg: {brand.fssai}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-[#B88A3B]" />
                <span>GST: {brand.gst}</span>
              </span>
            </div>

            {/* CTA */}
            <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
              <Link href="/about">
                <Button variant="forest" size="touch" className="gap-2 font-bold shadow-md rounded-xl">
                  <span>Discover Our Story</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
