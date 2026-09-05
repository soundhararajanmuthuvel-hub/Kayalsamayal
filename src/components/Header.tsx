"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, Phone, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { brand, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Health Mixes", href: "/health-mixes" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  return (
    <>
      {/* ── TOP ANNOUNCEMENT BAR ────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground text-xs py-2 px-4 text-center font-medium tracking-wide border-b border-white/10 select-none">
        <div className="container-page flex items-center justify-between text-[0.7rem] sm:text-xs">
          <span className="hidden sm:inline-block text-gold">
            ✦ Authentic Kayalpatnam Coastal Spices
          </span>
          <span className="mx-auto sm:mx-0">
            Free shipping on orders above ₹{brand.freeShippingOver} | 100% Pure & Natural
          </span>
          <a
            href={whatsappLink("Hi Kayal Samayal! I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-gold hover:underline"
          >
            <Phone className="h-3 w-3" />
            <span>Order on WhatsApp: {brand.phone}</span>
          </a>
        </div>
      </div>

      {/* ── MAIN HEADER ────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-card/95 backdrop-blur-md shadow-sm border-b border-border/70 py-2.5"
            : "bg-background/95 backdrop-blur-xs border-b border-border/40 py-3.5 sm:py-4"
        }`}
      >
        <div className="container-page">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center group shrink-0"
              aria-label="Kayal Samayal — Home"
            >
              <picture>
                <source srcSet="/logo-header.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-header.png"
                  alt="Kayal Samayal"
                  width={357}
                  height={214}
                  fetchPriority="high"
                  className="w-[125px] sm:w-[145px] md:w-[155px] lg:w-[170px] h-auto max-h-12 sm:max-h-14 md:max-h-16 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-foreground/80 hover:text-secondary transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-full text-primary hover:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label={`Open shopping cart with ${cartCount} items`}
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-black text-secondary-foreground shadow-xs animate-in zoom-in-75">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Order on WhatsApp CTA (Desktop) */}
              <a
                href={whatsappLink("Hi Kayal Samayal! I'd like to place an order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex"
              >
                <Button variant="plum" size="sm" className="gap-1.5 font-bold shadow-xs">
                  <span>Order Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </a>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="flex lg:hidden items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-primary hover:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE NAVIGATION DRAWER ────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-primary/70 backdrop-blur-xs"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(20rem,85vw)] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-border ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Kayal Samayal"
                width={357}
                height={214}
                className="w-32 h-auto max-h-11 object-contain"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5" aria-label="Mobile links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-accent hover:text-secondary transition-all"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-border bg-surface space-y-3">
            <a
              href={whatsappLink("Hi Kayal Samayal! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
              onClick={() => setMenuOpen(false)}
            >
              <Button variant="whatsapp" size="touch" className="w-full gap-2 font-bold shadow-xs">
                <span>Order on WhatsApp</span>
              </Button>
            </a>
            <p className="text-[0.7rem] text-center text-muted-foreground">
              FSSAI: {brand.fssai} • Tirupattur
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
