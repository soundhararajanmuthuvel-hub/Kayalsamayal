"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Leaf, FlaskConical, Star, Quote } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Zero Artificial Additives",
    description:
      "We use no artificial colours, flavours, or chemical preservatives. Our products are what they say they are — nothing more, nothing less.",
  },
  {
    icon: Leaf,
    title: "Genuine Whole Ingredients",
    description:
      "From whole peppercorns to unrefined herbs, every ingredient is selected for its natural quality and authentic coastal character.",
  },
  {
    icon: FlaskConical,
    title: "No Compromises on Purity",
    description:
      "We never dilute our blends with fillers or cheap additives. The spices you taste are the spices we promise on the label.",
  },
  {
    icon: Star,
    title: "Authentic Coastal Recipes",
    description:
      "Our formulations are rooted in the culinary traditions of Kayalpatnam — not manufactured flavour profiles, but real-kitchen heritage.",
  },
];

const testimonials = [
  {
    id: "testimonial-1",
    text: "[ Customer review coming soon — this space is reserved for a real testimonial. ]",
    author: "— Your Name Here",
    location: "City, Tamil Nadu",
    isPlaceholder: true,
  },
  {
    id: "testimonial-2",
    text: "[ Customer review coming soon — this space is reserved for a real testimonial. ]",
    author: "— Your Name Here",
    location: "City, Tamil Nadu",
    isPlaceholder: true,
  },
  {
    id: "testimonial-3",
    text: "[ Customer review coming soon — this space is reserved for a real testimonial. ]",
    author: "— Your Name Here",
    location: "City, Tamil Nadu",
    isPlaceholder: true,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12 },
  }),
};

export default function WhyUs() {
  return (
    <section id="why-us" className="relative texture-dark py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Gold top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient" />

      {/* Decorative radial glow — won't cause overflow issues */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full bg-gold-600/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.p
            className="font-body text-xs font-700 tracking-[0.2em] uppercase text-gold-500 mb-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Promise
          </motion.p>
          <motion.h2
            className="section-title-light mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Why Choose{" "}
            <span className="gold-shimmer">Kayal Samayal</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-5 sm:mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
          <motion.p
            className="font-body text-cream-300 max-w-xl mx-auto text-base px-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Every jar we send is a commitment — to purity, to tradition, and to
            the flavours that make South Indian cooking extraordinary.
          </motion.p>
        </div>

        {/* Values Grid — 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card-hover relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 text-center group"
            >
              {/* Icon ring */}
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-gold-600/30 bg-gold-600/10 mb-4 sm:mb-5 group-hover:bg-gold-600/20 transition-colors">
                <value.icon size={22} className="text-gold-400" />
              </div>
              <h3 className="font-display font-semibold text-cream-100 text-sm sm:text-base mb-2 sm:mb-3">
                {value.title}
              </h3>
              <p className="font-body text-cream-400 text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.h3
            className="font-display font-bold text-cream-100 text-xl sm:text-2xl mb-2"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What Our Customers Say
          </motion.h3>
          <p className="font-body text-cream-400 text-sm italic">
            ← Real reviews will be added here once collected →
          </p>
        </div>

        {/* Testimonials grid — 1 col mobile, 3 col md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`relative bg-white/5 border rounded-2xl p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 ${
                t.isPlaceholder
                  ? "border-dashed border-white/20 opacity-60"
                  : "border-white/10"
              }`}
            >
              {t.isPlaceholder && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-espresso-900 border border-gold-600/30 rounded-full px-3 py-0.5">
                  <span className="font-body text-[0.6rem] text-gold-500 tracking-widest uppercase">
                    Coming Soon
                  </span>
                </div>
              )}
              <Quote size={18} className="text-gold-600 opacity-60 shrink-0" />
              <p className="font-body text-cream-300 text-sm leading-relaxed italic flex-1">
                {t.text}
              </p>
              <div>
                <p className="font-display text-cream-100 font-semibold text-sm">
                  {t.author}
                </p>
                <p className="font-body text-cream-500 text-xs">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gold bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gold-gradient" />
    </section>
  );
}
