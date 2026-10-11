"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Check, ArrowRight } from "lucide-react";
import { products as localProducts, type Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import { getProductPrice } from "@/lib/pricing";

export interface ShowcaseProduct {
  id: string;
  pairedId?: string;
  name: string;
  categoryLabel: string;
  tagline: string;
  packImage: string;
  fallbackImage: string;
  badge?: string;
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "kayal-curry-masala",
    name: "Kayal Curry Masala",
    categoryLabel: "Signature Heritage Blend",
    tagline: "Hand-picked coastal whole spices",
    packImage: "/assets/kayal-curry-masala-pack.webp",
    fallbackImage: "/assets/kayal-curry-masala.jpg",
    badge: "Bestseller",
  },
  {
    id: "kayal-kalari-masala-regular",
    pairedId: "kayal-kalari-masala-premium",
    name: "Kayal Kalari Masala",
    categoryLabel: "Traditional Masalas",
    tagline: "Stone-ground whole spice aromatic blend",
    packImage: "/assets/kayal-kalari-masala-pack.webp",
    fallbackImage: "/assets/kayal-kalari-masala.jpg",
  },
  {
    id: "fish-curry-masala-regular",
    pairedId: "fish-curry-masala-premium",
    name: "Fish Curry Masala",
    categoryLabel: "Coastal Specialty Blend",
    tagline: "Tangy & deeply aromatic coastal recipe",
    packImage: "/assets/fish-curry-masala-pack.webp",
    fallbackImage: "/assets/fish-curry-masala.jpg",
  },
  {
    id: "biriyani-masala",
    name: "Biriyani Masala",
    categoryLabel: "Festive Spice Blend",
    tagline: "Slow-roasted whole spice biriyani blend",
    packImage: "/assets/biriyani-masala-pack.webp",
    fallbackImage: "/assets/biriyani-masala.jpg",
  },
  {
    id: "kayal-rasam-podi",
    name: "Kayal Rasam Podi",
    categoryLabel: "Stone-Ground Podi",
    tagline: "Black pepper & cumin digestive blend",
    packImage: "/assets/kayal-rasam-podi-pack.webp",
    fallbackImage: "/assets/kayal-rasam-podi.jpg",
  },
  {
    id: "kayal-keerai-podi-regular",
    pairedId: "kayal-keerai-podi-premium",
    name: "Kayal Keerai Podi",
    categoryLabel: "Nourishing Greens Podi",
    tagline: "Dried spinach, lentils & mild spices",
    packImage: "/assets/kayal-keerai-podi-pack.webp",
    fallbackImage: "/assets/kayal-keerai-podi.jpg",
  },
  {
    id: "abc-malt-regular",
    pairedId: "abc-malt-premium",
    name: "A.B.C. Malt",
    categoryLabel: "Health Mixes & Malts",
    tagline: "Apple, Beetroot & Carrot natural malt",
    packImage: "/assets/abc-malt-pack.webp",
    fallbackImage: "/assets/abc-malt.jpg",
  },
];

export default function HeroProductShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(localProducts);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync live products catalogue if available
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      try {
        const live = await getProducts();
        if (isMounted && live && live.length > 0) {
          setCatalogProducts(live);
        }
      } catch {
        // Keep localProducts fallback
      }
    }
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = SHOWCASE_PRODUCTS.length;

  const nextProduct = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevProduct = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const selectProduct = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
  };

  // Gentle auto-rotation every 6 seconds, pauses on interaction/hover
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextProduct();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextProduct]);

  const currentItem = SHOWCASE_PRODUCTS[currentIndex];
  const leftItem = SHOWCASE_PRODUCTS[(currentIndex - 1 + total) % total];
  const rightItem = SHOWCASE_PRODUCTS[(currentIndex + 1) % total];

  // Derive authoritative price & stock from catalogue
  const matchedProduct = catalogProducts.find((p) => p.id === currentItem.id);
  const matchedPaired = currentItem.pairedId
    ? catalogProducts.find((p) => p.id === currentItem.pairedId)
    : null;

  let displayPrice = "₹60";
  if (matchedProduct) {
    const regPrice = getProductPrice(matchedProduct);
    if (matchedPaired) {
      const premPrice = getProductPrice(matchedPaired);
      displayPrice = regPrice === premPrice ? `₹${regPrice}` : `₹${regPrice} - ₹${premPrice}`;
    } else {
      displayPrice = `₹${regPrice}`;
    }
  }

  const isOutOfStock =
    matchedProduct && matchedProduct.stock !== undefined && matchedProduct.stock <= 0;
  const stockText = isOutOfStock ? "OUT OF STOCK" : "IN STOCK";

  return (
    <div
      className="relative bg-[#174D35]/60 p-3 sm:p-5 rounded-3xl border border-[#B88A3B]/30 shadow-2xl backdrop-blur-xs select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── INNER FOREST GREEN SHOWCASE STAGE ───────────────────────── */}
      <div className="relative w-full min-h-[490px] sm:min-h-[530px] lg:h-[530px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0D2F22] via-[#123829] to-[#0A241A] flex flex-col justify-between p-3.5 sm:p-5 border border-white/5">
        
        {/* Subtle Warm Studio Spotlights */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 42%, rgba(184, 138, 59, 0.22) 0%, rgba(23, 77, 53, 0.35) 45%, transparent 75%)",
          }}
        />

        {/* ── TOP BADGE ROW ────────────────────────────────────────── */}
        <div className="relative z-30 flex items-center justify-between gap-2">
          {/* Pure Veg Badge */}
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-border">
            <span className="w-3.5 h-3.5 rounded-xs bg-white flex items-center justify-center p-0.5 border border-[#174D35]">
              <span className="w-2 h-2 rounded-full bg-[#174D35]" />
            </span>
            <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-[#174D35] uppercase tracking-wider">
              100% PURE FOOD PRODUCTS
            </span>
          </div>

          {/* Authentic Packaging Stamp */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#174D35]/90 border border-[#B88A3B]/40 text-[#F8F4E9] text-[0.62rem] sm:text-[0.68rem] font-semibold backdrop-blur-md shadow-xs">
            <Sparkles className="h-3 w-3 text-[#B88A3B]" />
            <span>GENUINE PACKAGING</span>
          </div>
        </div>

        {/* ── CENTER PRODUCT PACK COMPOSITION (MAIN + 2 FLANKING PACKS) ── */}
        <div className="relative z-20 flex-1 flex items-center justify-center my-1 sm:my-2">
          
          {/* Left Flanking Product Pack */}
          <button
            type="button"
            onClick={() => prevProduct()}
            className="relative -mr-6 sm:-mr-8 md:-mr-10 z-10 hidden xs:flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition-all duration-300 transform hover:scale-105 focus:outline-none group pb-1"
            aria-label={`Switch to previous pack: ${leftItem.name}`}
          >
            <div className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-44 flex items-center justify-center">
              <picture>
                <source srcSet={leftItem.packImage} type="image/webp" />
                <img
                  src={leftItem.fallbackImage}
                  alt={`${leftItem.name} authentic pack`}
                  width={220}
                  height={220}
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-1"
                />
              </picture>
            </div>
            {/* Subtle Pedestal Shadow */}
            <div className="w-20 sm:w-24 h-2 rounded-[100%] bg-black/50 blur-xs -mt-1" />
            <span className="text-[0.58rem] sm:text-[0.62rem] font-medium text-[#F8F4E9]/75 tracking-wider mt-1 truncate max-w-[90px] text-center">
              {leftItem.name.replace("Kayal ", "")}
            </span>
          </button>

          {/* Main Hero Product Pack (Centered, Prominent, Upright, Fully Visible) */}
          <div className="relative z-20 flex flex-col items-center justify-center mx-1 sm:mx-2 pb-1">
            <Link
              href={`/products/${currentItem.id}`}
              className="relative w-44 h-48 sm:w-52 sm:h-56 md:w-56 md:h-60 flex items-center justify-center group focus:outline-none"
              aria-label={`View ${currentItem.name}`}
            >
              <picture key={currentItem.id}>
                <source srcSet={currentItem.packImage} type="image/webp" />
                <img
                  src={currentItem.fallbackImage}
                  alt={`${currentItem.name} - Genuine Kayal Samayal packaging`}
                  width={380}
                  height={380}
                  fetchPriority="high"
                  className="w-full h-full object-contain filter drop-shadow-[0_18px_28px_rgba(0,0,0,0.7)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)] transform transition-transform duration-300 group-hover:scale-105"
                />
              </picture>
            </Link>

            {/* Natural Contact Shadow on Stage */}
            <div className="w-36 sm:w-44 md:w-48 h-3.5 sm:h-4 rounded-[100%] bg-black/65 blur-xs -mt-1 sm:-mt-2" />
          </div>

          {/* Right Flanking Product Pack */}
          <button
            type="button"
            onClick={() => nextProduct()}
            className="relative -ml-6 sm:-ml-8 md:-ml-10 z-10 hidden xs:flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition-all duration-300 transform hover:scale-105 focus:outline-none group pb-1"
            aria-label={`Switch to next pack: ${rightItem.name}`}
          >
            <div className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-44 flex items-center justify-center">
              <picture>
                <source srcSet={rightItem.packImage} type="image/webp" />
                <img
                  src={rightItem.fallbackImage}
                  alt={`${rightItem.name} authentic pack`}
                  width={220}
                  height={220}
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-1"
                />
              </picture>
            </div>
            {/* Subtle Pedestal Shadow */}
            <div className="w-20 sm:w-24 h-2 rounded-[100%] bg-black/50 blur-xs -mt-1" />
            <span className="text-[0.58rem] sm:text-[0.62rem] font-medium text-[#F8F4E9]/75 tracking-wider mt-1 truncate max-w-[90px] text-center">
              {rightItem.name.replace("Kayal ", "")}
            </span>
          </button>

          {/* Mobile Chevron Buttons (Always accessible for touch navigation) */}
          <div className="xs:hidden absolute inset-x-0 flex items-center justify-between px-0 pointer-events-none z-30">
            <button
              type="button"
              onClick={prevProduct}
              className="pointer-events-auto h-8 w-8 rounded-full bg-[#0D2F22]/85 text-white flex items-center justify-center border border-[#B88A3B]/40 shadow-md active:scale-95"
              aria-label="Previous product pack"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextProduct}
              className="pointer-events-auto h-8 w-8 rounded-full bg-[#0D2F22]/85 text-white flex items-center justify-center border border-[#B88A3B]/40 shadow-md active:scale-95"
              aria-label="Next product pack"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── QUICK PACK SELECTOR PILLS ────────────────────────────── */}
        <div className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {SHOWCASE_PRODUCTS.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectProduct(idx)}
                className={`relative px-2.5 py-1 rounded-full text-[0.62rem] sm:text-[0.68rem] font-medium transition-all duration-200 shrink-0 ${
                  isActive
                    ? "bg-[#B88A3B] text-[#0D2F22] font-bold shadow-xs scale-105"
                    : "bg-[#174D35]/80 text-[#F8F4E9]/80 hover:text-white hover:bg-[#174D35] border border-white/10"
                }`}
                aria-label={`Select ${item.name}`}
              >
                {item.name.replace("Kayal ", "")}
              </button>
            );
          })}
        </div>

        {/* ── FLOATING AUTHENTICATED CREAM PRODUCT CARD ─────────────── */}
        <Link
          href={`/products/${currentItem.id}`}
          className="relative z-30 block bg-[#FAF7F0] hover:bg-white transition-colors duration-200 p-3.5 sm:p-4 rounded-2xl shadow-xl border border-[#B88A3B]/30 group/card mt-1"
          aria-label={`View details for ${currentItem.name}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 pr-2">
              <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-[#B88A3B] uppercase tracking-wider block">
                {currentItem.categoryLabel}
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#332820] truncate group-hover/card:text-[#174D35] transition-colors flex items-center gap-1.5">
                <span>{currentItem.name}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#B88A3B] opacity-0 -translate-x-1 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
              </h3>
              <p className="text-[0.68rem] sm:text-xs text-[#6B5E54] truncate">
                {currentItem.tagline}
              </p>
            </div>
            
            <div className="text-right shrink-0">
              <span className="font-display font-extrabold text-base sm:text-lg text-[#174D35] block">
                {displayPrice}
              </span>
              <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-[#174D35] inline-flex items-center gap-1 justify-end">
                <Check className="h-3 w-3 text-[#174D35] stroke-[3]" />
                {stockText}
              </span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
