"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      setErrorMsg("Please enter your email address.");
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    // Mock successful signup
    setStatus("success");
    setEmail("");
    setErrorMsg("");
  };

  return (
    <section className="relative bg-brand-purple text-cream-50 py-16 sm:py-20 overflow-hidden border-b border-gold-500/10">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`
        }}
      />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="space-y-2">
          <p className="font-body text-xs font-bold tracking-[0.25em] uppercase text-gold-400">
            NEWSLETTER
          </p>
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl leading-tight">
            Stay Connected
          </h2>
          <div className="divider-spice mx-auto bg-gold-gradient" />
          <p className="font-body text-cream-300 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Get recipes, tips, and exclusive offers delivered directly to your inbox.
          </p>
        </div>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cream-100/10 border border-gold-500/30 rounded-2xl p-6 max-w-md mx-auto flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="text-gold-500" size={36} />
            <h3 className="font-display font-bold text-cream-100 text-lg leading-tight">
              Thank you! Check your inbox
            </h3>
            <p className="font-body text-cream-300 text-xs sm:text-sm">
              We have successfully registered your email for updates.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-1 flex flex-col">
              <label htmlFor="newsletter-email" className="sr-only">
                Email Address
              </label>
              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                className="w-full font-body text-espresso-900 placeholder-espresso-900/40 bg-white/95 rounded-xl border border-cream-300/40 px-4 py-3 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm sm:text-base transition-all"
              />
              {status === "error" && (
                <span className="font-body text-[0.7rem] text-red-400 font-semibold text-left mt-1.5 ml-1">
                  {errorMsg}
                </span>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary text-sm font-bold min-h-[48px] justify-center px-6 shrink-0 cursor-pointer"
            >
              <Send size={15} />
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
