"use client";

import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

const navLinks = [
  { label: "Our Story", href: "#story" },
  { label: "Products", href: "#products" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];

const categories = [
  "Traditional Masalas",
  "Podi Products",
  "Specialty Noodles",
  "Health Mixes & Malts",
  "PeruKalam Legiyam",
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative texture-dark border-t border-gold-600/15">
      {/* Gold top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6 sm:pb-8">
        {/* Grid: 1-col mobile → 2-col tablet → 4-col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">

          {/* Brand Column — full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo.jpg"
                alt="Kayal Samayal Logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-gold-600/30 shrink-0"
              />
              <div>
                <div className="font-display font-bold text-cream-100 text-lg leading-tight">
                  Kayal Samayal
                </div>
                <div className="font-body text-[0.6rem] tracking-[0.18em] uppercase text-gold-500">
                  Pure · Traditional · Coastal
                </div>
              </div>
            </div>
            <p className="font-body text-cream-400 text-sm leading-relaxed mb-5">
              Authentic South Indian spices, masalas, and health mixes rooted
              in Kayalpatnam coastal heritage. No shortcuts. Pure flavour.
            </p>
            {/* Social Icons — 44px tap targets */}
            <div className="flex gap-2">
              <a
                id="footer-instagram-link"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-cream-400 hover:text-gold-400 hover:border-gold-600/30 transition-all"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                id="footer-facebook-link"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-11 h-11 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-cream-400 hover:text-gold-400 hover:border-gold-600/30 transition-all"
              >
                <FacebookIcon size={16} />
              </a>
              <a
                id="footer-whatsapp-link"
                href="https://wa.me/919003860616"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-11 h-11 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-cream-400 hover:text-green-400 hover:border-green-500/30 transition-all"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-cream-100 text-sm mb-4 sm:mb-5 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-body text-cream-400 text-sm hover:text-gold-400 transition-colors inline-block py-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-display font-semibold text-cream-100 text-sm mb-4 sm:mb-5 uppercase tracking-wider">
              Our Range
            </h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {categories.map((cat) => (
                <li key={cat}>
                  <a
                    href="#products"
                    className="font-body text-cream-400 text-sm hover:text-gold-400 transition-colors inline-block py-1"
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display font-semibold text-cream-100 text-sm mb-4 sm:mb-5 uppercase tracking-wider">
              Contact Us
            </h4>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-gold-500 mt-0.5 shrink-0" />
                <a
                  href="tel:+919003860616"
                  className="font-body text-cream-400 text-sm hover:text-gold-400 transition-colors"
                >
                  (+91) 9003860616
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-gold-500 mt-0.5 shrink-0" />
                <a
                  href="mailto:kpmsamayal@gmail.com"
                  className="font-body text-cream-400 text-sm hover:text-gold-400 transition-colors break-all"
                >
                  kpmsamayal@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-gold-500 mt-1 shrink-0" />
                <span className="font-body text-cream-400 text-sm">
                  No.504, Housing Board Ph1,
                  <br />
                  Tirupattur – 635601, Tamil Nadu
                </span>
              </li>
            </ul>

            {/* WhatsApp CTA — full width on mobile */}
            <a
              id="footer-order-whatsapp-btn"
              href="https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-5 sm:mt-6 w-full sm:w-auto justify-center inline-flex text-xs py-2.5 px-4 min-h-[44px]"
            >
              <MessageCircle size={14} />
              Order on WhatsApp
            </a>
          </div>
        </div>

        {/* Bottom bar — stacks on mobile */}
        <div className="border-t border-white/8 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left">
          <p className="font-body text-cream-500 text-xs">
            © 2026, Kayal Samayal. All rights reserved.
          </p>
          <p className="font-body text-cream-500 text-xs">
            Powered by{" "}
            <span className="text-gold-500 font-semibold">MSR Techlogies</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
