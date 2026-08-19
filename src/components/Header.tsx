"use client";

import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Our Story", href: "#story" },
  { label: "Products", href: "#products" },
  { label: "Why Us", href: "#why-us" },
  { label: "Reviews", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const WA_LINK =
  "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20place%20an%20order.";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

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
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
              aria-label="Kayal Samayal — Home"
            >
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.jpg"
                  alt="Kayal Samayal Logo"
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg ring-2 ring-gold-600/40 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0">
                <div
                  className={`font-display font-bold text-base sm:text-xl leading-tight transition-colors truncate ${
                    scrolled ? "text-cream-100" : "text-cream-50"
                  }`}
                >
                  Kayal Samayal
                </div>
                <div
                  className={`font-body text-[0.55rem] sm:text-[0.6rem] tracking-[0.15em] sm:tracking-[0.18em] uppercase transition-colors ${
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
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2.5 rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] ${
                  scrolled ? "text-cream-100 hover:bg-white/10" : "text-cream-50 hover:bg-white/10"
                }`}
                aria-label="Open Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-600 text-espresso-950 font-bold text-[0.65rem] w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

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
              {/* Hamburger — min 44×44px touch target */}
              <button
                id="mobile-menu-toggle"
                className={`md:hidden flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
                  scrolled
                    ? "text-cream-100 hover:bg-white/10"
                    : "text-cream-50 hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-nav-drawer"
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-espresso-950/80 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(18rem,85vw)] texture-dark shadow-2xl flex flex-col transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-gold-600/20">
            <span className="font-display text-cream-100 font-bold text-lg">Menu</span>
            <button
              className="flex items-center justify-center w-11 h-11 text-cream-300 hover:text-cream-100 transition-colors rounded-lg hover:bg-white/10"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav links — large tap targets */}
          <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-cream-200 hover:text-gold-400 font-body font-medium text-base py-3.5 px-4 rounded-xl hover:bg-white/5 transition-all min-h-[48px] flex items-center"
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div className="px-5 pb-8 pt-4 border-t border-white/10">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full justify-center text-sm py-3.5"
              onClick={closeMenu}
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
