"use client";

import Link from "next/link";
import { MessageCircle, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Health Mixes & Malts", href: "/health-mixes" },
  { label: "About Kayal Samayal", href: "/about" },
  { label: "Contact & Support", href: "/contact" },
];

const categories = [
  { label: "Traditional Masalas", href: "/category/traditional-masalas" },
  { label: "Podi Products", href: "/category/podi-products" },
  { label: "Specialty Noodles", href: "/category/specialty-noodles" },
  { label: "Health Mixes & Malts", href: "/category/health-mixes-malts" },
  { label: "PeruKalam Legiyam", href: "/category/perukalam-legiyam" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-primary text-primary-foreground border-t border-gold/20 pt-14 sm:pt-20 pb-10">
      <div className="container-page">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo.jpg"
                alt="Kayal Samayal Logo"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gold shadow-md"
              />
              <div>
                <span className="font-display font-bold text-xl text-white block leading-tight">
                  {brand.name}
                </span>
                <span className="text-[0.65rem] text-gold tracking-widest uppercase font-bold block">
                  {brand.subtitle}
                </span>
              </div>
            </Link>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
              Authentic South Indian spices, homemade podis, and health mixes crafted from timeless coastal heritage. 100% pure taste with zero preservatives.
            </p>

            <div className="pt-2 text-xs text-white/70 space-y-1">
              <p><strong>FSSAI:</strong> {brand.fssai}</p>
              <p><strong>GST:</strong> {brand.gst}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-gold">
              Quick Links
            </h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-gold transition-colors inline-flex items-center py-1.5 min-h-[36px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-gold">
              Product Range
            </h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-white/80 hover:text-gold transition-colors inline-flex items-center py-1.5 min-h-[36px]"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-gold">
              Contact Us
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-white/85">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <a href={`tel:${brand.phoneIntl}`} className="hover:text-gold transition-colors">
                  (+91) {brand.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <a href={`mailto:${brand.email}`} className="hover:text-gold transition-colors break-all">
                  {brand.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <span>
                  {brand.address.line1}, {brand.address.city} – {brand.address.pincode}, {brand.address.state}
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={whatsappLink("Hi Kayal Samayal! I'd like to place an order.")}
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

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-white/60">
          <p>© {year} {brand.legalName}. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by</span>
            <span className="font-bold text-gold">MSR Techlogies</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
