"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { testimonials as localTestimonials, type Testimonial } from "@/data/testimonials";
import { getReviews } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating ? "fill-gold text-gold" : "fill-muted text-muted"
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
    autoPlayRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, total, nextSlide]);

  if (reviews.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-24 bg-background border-b border-border/60 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
          <p className="section-eyebrow">Real Customer Experiences</p>
          <h2 className="section-title">
            Loved Across <span className="text-secondary font-display italic">Homes & Kitchens</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-muted-foreground text-xs sm:text-sm">
            Genuine verified feedback from families preparing authentic meals with Kayal Samayal.
          </p>
        </div>

        {/* Carousel Viewport */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-card)] min-h-[220px] flex flex-col justify-between">
            <Quote className="h-10 w-10 text-secondary/20 mb-3" />

            <div className="space-y-4">
              <StarRating rating={reviews[currentIndex]?.rating || 5} />
              <p className="font-display text-base sm:text-lg md:text-xl text-foreground italic leading-relaxed">
                &ldquo;{reviews[currentIndex]?.review}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-primary text-sm font-display ring-1 ring-gold/40">
                  {reviews[currentIndex]?.name.charAt(0) || "K"}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    {reviews[currentIndex]?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next customer review"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-1 mt-6">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to review ${idx + 1}`}
                className="flex items-center justify-center min-h-[44px] min-w-[28px] p-2 cursor-pointer"
              >
                <span
                  className={`h-2 rounded-full transition-all block ${
                    currentIndex === idx ? "w-6 bg-secondary" : "w-2 bg-border hover:bg-muted-foreground"
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
