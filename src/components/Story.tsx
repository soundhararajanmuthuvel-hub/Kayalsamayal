"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export default function Story() {
  return (
    <section className="py-16 sm:py-24 bg-surface-container border-b border-border/60 overflow-hidden">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Story Visual Mosaic from Stitch */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xl overflow-hidden">
              <div className="relative h-[380px] sm:h-[420px] rounded-2xl overflow-hidden bg-surface flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3stZ6qSXFNfgQA7FmwkCboXVB3BrCuEoEqIqfIl5ndyB9GL5bi2GrvjRBOw1xUAaPuAfPB9ME33T_VU1uFrfIyu200BQkablkmp8Q8Rm6jqnZhgBboYic0xpK9JGTnNkBOe7vM30zEHS3DBggV1_W07WNN2fy2c3RCUW9yLtosK7f4v1I50aN3zdfa9sJVZbE5rQMwJoYWe6D5aNQdJ7Z_EszOIIY469dQvbLp4igN5XsOAHnLPq8"
                  alt="Traditional grandmother sun-drying spices"
                  className="w-full h-full object-cover rounded-2xl filter brightness-95"
                />
                
                {/* Floating Quote Badge */}
                <div className="absolute -bottom-1 right-2 left-2 sm:left-auto sm:right-3 bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl max-w-sm border border-white/10">
                  <p className="font-display italic text-xs sm:text-sm leading-relaxed text-white">
                    &ldquo;Real flavour cannot be rushed with giant machines. Spices must breathe the sun.&rdquo;
                  </p>
                  <span className="block text-[0.65rem] font-bold text-gold uppercase tracking-wider mt-1.5">
                    — Kayal Kitchen Tradition
                  </span>
                </div>
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
            <div className="inline-flex items-center gap-2 text-secondary justify-center lg:justify-start">
              <span className="w-6 h-0.5 bg-secondary" />
              <span className="section-eyebrow">The Story of Kayal Samayal</span>
            </div>

            <h2 className="section-title">
              Restoring the Lost Aromas of Our Grandmother&apos;s Brass Kitchen.
            </h2>
            <div className="divider-spice lg:mx-0" />

            <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Kayal Samayal was born out of a simple, nostalgic yearning: why does modern city food never smell like the kulambu made in our childhood homes? Commercial powders rely on synthetic essences and excessive starch fillers to cut costs.
              </p>
              <p>
                We went back to the roots in <strong>Tirupattur, Tamil Nadu</strong>. We gathered heirloom recipes from grandmothers across Kongu and Chettinad belts, reviving the delicate science of sun-drying ingredients on terrace courtyards before gently stone-pounding them.
              </p>
            </div>

            {/* Metrics from Stitch */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-card p-4 rounded-2xl border border-border shadow-xs text-center">
                <span className="font-display font-extrabold text-2xl text-secondary block">100%</span>
                <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Single Origin Spices</span>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-border shadow-xs text-center">
                <span className="font-display font-extrabold text-2xl text-secondary block">Zero</span>
                <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Artificial Additives</span>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-border shadow-xs text-center col-span-2 sm:col-span-1">
                <span className="font-display font-extrabold text-2xl text-secondary block">35+</span>
                <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">Heirloom Recipes</span>
              </div>
            </div>

            {/* Trust and License Credentials */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-border shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-leaf" />
                <span>FSSAI: {brand.fssai}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-border shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                <span>GST: {brand.gst}</span>
              </span>
            </div>

            <div className="pt-3 flex flex-wrap justify-center lg:justify-start gap-4">
              <Link href="/about">
                <Button variant="plum" size="touch" className="gap-2 font-bold shadow-md">
                  <span>Read Full Brand Heritage</span>
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
