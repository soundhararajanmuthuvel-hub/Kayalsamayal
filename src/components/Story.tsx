"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export default function Story() {
  return (
    <section className="py-16 sm:py-24 bg-background border-b border-border/60 overflow-hidden">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Brand Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-border/80 bg-surface p-6 shadow-xl">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-card flex items-center justify-center p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.jpg"
                  alt="Kayal Samayal Brand Heritage"
                  className="w-40 h-40 rounded-full object-cover shadow-lg ring-4 ring-gold/40"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-card border border-border p-4 space-y-2 text-center">
                <p className="font-display font-bold text-primary text-base">
                  FSSAI Reg: {brand.fssai}
                </p>
                <p className="text-xs text-muted-foreground">
                  GST: {brand.gst} • {brand.address.city}, {brand.address.state}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Narrative */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <p className="section-eyebrow">Our Heritage & Roots</p>
            <h2 className="section-title">
              Crafting Pure Coastal Flavours Since Generations
            </h2>
            <div className="divider-spice lg:mx-0" />

            <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Rooted in the historic coastal spice trading heritage of <strong>Kayalpatnam, Tamil Nadu</strong>, Kayal Samayal was founded with a singular purpose: to bring uncompromised, homemade traditional taste to modern dining tables.
              </p>
              <p>
                In an era dominated by bulk-manufactured spices loaded with fillers, salt, and artificial colors, we stand committed to <strong>100% whole spices</strong> slow-roasted to perfection, preserving their natural oils, depth, and therapeutic digestive properties.
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              {[
                "No Added Starch or Fillers",
                "Authentic Coastal Fish & Curry Blends",
                "Homemade Sathu Maavu & Malts",
                "Delivered Fresh Across India",
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
              <Link href="/about">
                <Button variant="plum" size="touch" className="gap-2 font-bold">
                  <span>Read Full Brand Story</span>
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
