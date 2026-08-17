"use client";

import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";

const navLinks = [
  { label: "Our Story", href: "#story" },
  { label: "Products", href: "#products" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];

const WA_LINK =
  "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20place%20an%20order.";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? "bg-espresso-950/95 backdrop-blur-md shadow-lg border-b border-gold-600/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a
              href="#hero"
              className="flex items-center gap-3 group"
              aria-label="Kayal Samayal — Home"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.jpg"
                  alt="Kayal Samayal Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg ring-2 ring-gold-600/40 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <div
                  className={`font-display font-bold text-lg sm:text-xl leading-tight transition-colors ${
                    scrolled ? "text-cream-100" : "text-cream-50"
                  }`}
                >
                  Kayal Samayal
                </div>
                <div
                  className={`font-body text-[0.6rem] tracking-[0.18em] uppercase transition-colors ${
                    scrolled ? "text-gold-500" : "text-gold-400"
                  }`}
                >
                  Pure · Traditional · Coastal
                </div>
              </div>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${
                    scrolled ? "text-cream-200 hover:text-gold-400" : "text-cream-100 hover:text-gold-400"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA + Hamburger */}
            <div className="flex items-center gap-3">
              <a
                id="header-whatsapp-order-btn"
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 btn-whatsapp text-sm py-2.5 px-4"
              >
                <ShoppingBag size={15} />
                Order Now
              </a>
              <button
                id="mobile-menu-toggle"
                className={`md:hidden p-2 rounded-md transition-colors ${
                  scrolled
                    ? "text-cream-100 hover:bg-white/10"
                    : "text-cream-50 hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-espresso-950/80 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-72 texture-dark shadow-2xl flex flex-col transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-6 border-b border-gold-600/20">
            <span className="font-display text-cream-100 font-bold text-lg">Menu</span>
            <button
              className="text-cream-300 hover:text-cream-100 transition-colors"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-6" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-cream-200 hover:text-gold-400 font-body font-medium text-base py-3 px-3 rounded-lg hover:bg-white/5 transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="px-6 mt-auto pb-8">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full justify-center"
              onClick={() => setMenuOpen(false)}
            >
              <ShoppingBag size={16} />
              Order on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
