"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, CheckCircle2 } from "lucide-react";
import { testimonials as localTestimonials, type Testimonial } from "@/data/testimonials";
import { getReviews } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating ? "fill-[#B88A3B] text-[#B88A3B]" : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Testimonial[]>(localTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await getReviews();
        if (data && data.length > 0) {
          setReviews(data);
        }
      } catch {
        // Keeps local fallback
      }
    }
    loadReviews();
  }, []);

  const total = reviews.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoscroll timer with pause on hover/touch
  useEffect(() => {
    if (isPaused || total <= 1) return;
    autoPlayRef.current = setInterval(nextSlide, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, total, nextSlide]);

  if (reviews.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-24 bg-[#F8F4E9] border-b border-border/80 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
          <p className="section-eyebrow">Verified Customer Feedback</p>
          <h2 className="section-title">
            Loved in <span className="text-[#174D35] font-display italic">Homes &amp; Kitchens</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-[#6B5E54] text-xs sm:text-sm">
            Genuine experiences from home chefs and families preparing daily meals with Kayal Samayal.
          </p>
        </div>

        {/* Carousel Viewport */}
        <div className="relative max-w-3xl mx-auto">
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm min-h-[220px] flex flex-col justify-between">
            <Quote className="h-9 w-9 text-[#B88A3B]/30 mb-2" />

            <div className="space-y-4">
              <StarRating rating={reviews[currentIndex]?.rating || 5} />
              <p className="font-display text-base sm:text-lg md:text-xl text-[#332820] italic leading-relaxed">
                &ldquo;{reviews[currentIndex]?.review}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#174D35] text-white flex items-center justify-center font-bold text-sm font-display shadow-xs">
                  {reviews[currentIndex]?.name.charAt(0) || "K"}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#332820] flex items-center gap-1.5">
                    <span>{reviews[currentIndex]?.name}</span>
                    <span title="Verified Customer" className="inline-flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#174D35]" />
                    </span>
                  </h3>
                  <p className="text-xs text-[#6B5E54]">
                    {reviews[currentIndex]?.date || "Verified Purchase"}
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous customer review"
                  className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-white text-[#332820] hover:bg-[#F8F4E9] hover:text-[#174D35] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next customer review"
                  className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-white text-[#332820] hover:bg-[#F8F4E9] hover:text-[#174D35] transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-1.5 mt-6">
            {reviews.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to review ${idx + 1}`}
                className="flex items-center justify-center min-h-[44px] min-w-[24px] p-2 cursor-pointer"
              >
                <span
                  className={`h-2 rounded-full transition-all block ${
                    currentIndex === idx ? "w-6 bg-[#174D35]" : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
