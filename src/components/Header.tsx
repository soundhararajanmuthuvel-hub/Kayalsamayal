"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ShoppingBag, Phone, Search, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { brand, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop Products", href: "/products" },
  { label: "Categories", href: "/#categories" },
  { label: "Our Story", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      {/* ── SECTION A: SLIM ANNOUNCEMENT BAR ───────────────────────── */}
      <div className="bg-[#0D2F22] text-[#F8F4E9] text-xs py-2 px-4 text-center font-medium tracking-wide border-b border-[#B88A3B]/20 select-none">
        <div className="container-page flex items-center justify-between text-[0.72rem] sm:text-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[#B88A3B] font-semibold">
            <span>✦</span>
            <span>Authentic Heritage Spices &amp; Traditional Foods</span>
          </span>
          <span className="mx-auto sm:mx-0 font-medium">
            Free shipping on orders above ₹{brand.freeShippingOver} | Made in Tirupattur
          </span>
          <a
            href={whatsappLink("Hi Kayal Samayal! I would like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-[#B88A3B] hover:text-[#d49b28] transition-colors"
          >
            <Phone className="h-3 w-3" />
            <span>Order on WhatsApp: {brand.phone}</span>
          </a>
        </div>
      </div>

      {/* ── SECTION B: PREMIUM RESPONSIVE HEADER ───────────────────── */}
      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border py-2.5"
            : "bg-[#F8F4E9]/95 backdrop-blur-xs border-b border-border/70 py-3.5 sm:py-4"
        }`}
      >
        <div className="container-page">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center group shrink-0"
              aria-label="Kayal Samayal — Home"
            >
              <picture>
                <source srcSet="/logo-header.webp" type="image/webp" />
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
                  className="text-sm font-semibold text-[#332820]/85 hover:text-[#174D35] transition-colors py-1 relative group"
                >
                  <span>{link.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B88A3B] transition-all duration-200 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Desktop Inline Search Trigger / Form */}
              <div className="relative hidden md:block">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search masalas, podis..."
                      autoFocus
                      className="w-48 lg:w-60 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35]"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="ml-1.5 p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-full text-[#332820] hover:bg-accent/80 transition-colors"
                    aria-label="Open product search"
                  >
                    <Search className="h-4 w-4 text-[#332820]/80" />
                  </button>
                )}
              </div>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-full text-[#174D35] hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174D35]"
                aria-label={`Open shopping cart with ${cartCount} items`}
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute 0 top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#174D35] text-[0.65rem] font-bold text-white shadow-xs border border-white animate-in zoom-in-75">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Primary Header CTA (Desktop) */}
              <Link href="/products" className="hidden sm:inline-flex">
                <Button variant="forest" size="sm" className="gap-1.5 font-bold shadow-xs rounded-xl">
                  <span>Shop Catalogue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="flex lg:hidden items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#174D35] hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174D35]"
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
          className="absolute inset-0 bg-[#0D2F22]/70 backdrop-blur-xs"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(20rem,85vw)] bg-[#F8F4E9] shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-border ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-white">
            <div className="flex items-center">
              <picture>
                <source srcSet="/logo-header.webp" type="image/webp" />
                <img
                  src="/logo-header.png"
                  alt="Kayal Samayal"
                  width={357}
                  height={214}
                  className="w-32 h-auto max-h-11 object-contain"
                />
              </picture>
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

          {/* Mobile Search Bar */}
          <div className="p-4 border-b border-border bg-white/60">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search masalas, podis..."
                className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35]"
              />
            </form>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Mobile links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl text-sm font-semibold text-[#332820] hover:bg-white hover:text-[#174D35] transition-all"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-border bg-white space-y-3">
            <a
              href={whatsappLink("Hi Kayal Samayal! I would like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
              onClick={() => setMenuOpen(false)}
            >
              <Button variant="whatsapp" size="touch" className="w-full gap-2 font-bold shadow-xs">
                <span>Order on WhatsApp</span>
              </Button>
            </a>
            <p className="text-[0.68rem] text-center text-muted-foreground">
              FSSAI: {brand.fssai} • Tirupattur, Tamil Nadu
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
