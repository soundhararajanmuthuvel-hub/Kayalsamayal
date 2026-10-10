"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Mail, MapPin, ArrowRight, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";
import { products as localProducts } from "@/data/products";
import { getUniqueCategories, slugifyCategory } from "@/lib/categories";
import { getProducts } from "@/lib/api";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "About Kayal Samayal", href: "/about" },
  { label: "Contact & Support", href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [activeCategories, setActiveCategories] = useState(() =>
    getUniqueCategories(localProducts).map((cat) => ({
      label: cat,
      href: `/category/${slugifyCategory(cat)}`,
    }))
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const live = await getProducts();
        if (live && live.length > 0) {
          setActiveCategories(
            getUniqueCategories(live).map((cat) => ({
              label: cat,
              href: `/category/${slugifyCategory(cat)}`,
            }))
          );
        }
      } catch {
        // Keeps local fallback
      }
    }
    loadCategories();
  }, []);

  return (
    <footer className="relative bg-[#0D2F22] text-[#F8F4E9] border-t border-[#B88A3B]/30 pt-14 sm:pt-20 pb-10">
      <div className="container-page">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <picture>
                <source srcSet="/logo-card.webp" type="image/webp" />
                <img
                  src="/logo-card.png"
                  alt="Kayal Samayal Logo"
                  width={48}
                  height={48}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-contain p-1 bg-white ring-2 ring-[#B88A3B] shadow-md"
                />
              </picture>
              <div>
                <span className="font-display font-bold text-xl text-white block leading-tight">
                  {brand.name}
                </span>
                <span className="text-[0.65rem] text-[#B88A3B] tracking-widest uppercase font-bold block">
                  {brand.subtitle}
                </span>
              </div>
            </Link>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
              Authentic South Indian stone-ground masalas, aromatic podis, and health mixes crafted without chemicals or artificial preservatives. Shipped fresh from Tirupattur, Tamil Nadu.
            </p>

            <div className="pt-2 text-xs text-white/70 space-y-1">
              <p><strong>FSSAI:</strong> {brand.fssai}</p>
              <p><strong>GST:</strong> {brand.gst}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-[#B88A3B]">
              Quick Links
            </h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-[#B88A3B] transition-colors inline-flex items-center py-1.5 min-h-[40px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-[#B88A3B]">
              Product Range
            </h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              {activeCategories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-white/80 hover:text-[#B88A3B] transition-colors inline-flex items-center py-1.5 min-h-[40px]"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-[#B88A3B]">
              Contact Us
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-white/85">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-[#B88A3B] shrink-0 mt-0.5" />
                <a href={`tel:${brand.phoneIntl}`} className="hover:text-[#B88A3B] transition-colors">
                  (+91) {brand.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#B88A3B] shrink-0 mt-0.5" />
                <a href={`mailto:${brand.email}`} className="hover:text-[#B88A3B] transition-colors break-all">
                  {brand.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#B88A3B] shrink-0 mt-0.5" />
                <span>
                  {brand.address.line1}, {brand.address.city} – {brand.address.pincode}, {brand.address.state}
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={whatsappLink("Hi Kayal Samayal! I would like to place an order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#20ba5a] transition-all shadow-md min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Order on WhatsApp</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Policies & Assurance Badges */}
        <div className="py-6 border-b border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/75">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#B88A3B] shrink-0" />
            <span>Shipping: Free above ₹{brand.freeShippingOver} (Flat ₹{brand.shippingFlat} below)</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#B88A3B] shrink-0" />
            <span>Payments: 100% Encrypted Razorpay &amp; Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#B88A3B] shrink-0" />
            <span>Purity: 100% Food Safety &amp; FSSAI Registered</span>
          </div>
        </div>

        {/* Bottom Bar with Required Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-white/60">
          <p>© {year} {brand.legalName}. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Design and development by:</span>
            <span className="font-bold text-[#B88A3B]">MSR Solutions</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
