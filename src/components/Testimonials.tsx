"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, ExternalLink, MessageSquarePlus, X, Search, Sparkles } from "lucide-react";
import { testimonials as localTestimonials, type Testimonial } from "@/data/testimonials";
import { getReviews } from "@/lib/api";

const GOOGLE_WRITE_REVIEW_URL = "https://www.google.com/search?q=kayalsamayal#lrd=0xa86e40eb213628e1:0xfa26eb8c224b177a,3";
const GOOGLE_READ_REVIEWS_URL = "https://www.google.com/search?q=kayalsamayal#lrd=0xa86e40eb213628e1:0xfa26eb8c224b177a,1";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function subscribeVisibility(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getVisibilitySnapshot() {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "hidden";
}

function getVisibilityServerSnapshot() {
  return false;
}

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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
  const [allReviews, setAllReviews] = useState<Testimonial[]>(localTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<"all" | "5star" | "tamil">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const isTabHidden = useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot
  );

  useEffect(() => {
    async function loadReviews() {
      try {
        setIsLoading(true);
        const data = await getReviews();
        if (data && data.length > 0) {
          setAllReviews(data);
        }
      } catch {
        // Keeps verified local reviews
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsBrowseModalOpen(false);
    };
    if (isBrowseModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBrowseModalOpen]);

  const total = allReviews.length;
  const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;
  const currentReview = allReviews[safeIndex];

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = useCallback((idx: number) => {
    if (total <= 1) return;
    setCurrentIndex(idx % total);
  }, [total]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      }
    },
    [prevSlide, nextSlide]
  );

  const isAutoplayPaused =
    isHovered || isTouched || isTabHidden || isBrowseModalOpen || prefersReducedMotion;

  // 5-second automatic review rotation
  // Advances smoothly, pauses on hover/touch/tab-hidden/modal-open/reduced-motion,
  // restarts fresh 5-second timer on manual navigation or slide change.
  useEffect(() => {
    if (isAutoplayPaused || total <= 1) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [safeIndex, isAutoplayPaused, total]);

  return (
    <section
      className="py-16 sm:py-24 bg-[#F8F4E9] border-b border-border/80 overflow-hidden"
      aria-label="Google Customer Reviews"
    >
      <style>{`
        @keyframes reviewFade {
          0% {
            opacity: 0.7;
            transform: translateY(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="container-page">
        {/* Header with Google Business Rating Badge */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#B88A3B]/30 shadow-2xs">
            <GoogleLogo className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold text-[#332820]">
              4.9 Rating &bull; 116 Google Reviews
            </span>
          </div>

          <h2 className="section-title">
            Loved in <span className="text-[#174D35] font-display italic">Homes &amp; Kitchens</span>
          </h2>
          <div className="divider-spice" />
          <p className="text-[#6B5E54] text-xs sm:text-sm max-w-xl mx-auto">
            Genuine experiences shared by customers and home chefs on our official Google Business Profile.
          </p>
        </div>

        {/* Carousel Viewport */}
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer reviews carousel"
          aria-live="polite"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsTouched(true)}
          onTouchEnd={() => setIsTouched(false)}
          className="relative max-w-3xl mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174D35] rounded-3xl"
        >
          {isLoading && allReviews.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white p-8 sm:p-12 shadow-sm animate-pulse min-h-[240px] flex flex-col justify-center items-center text-center">
              <div className="h-5 w-32 bg-muted rounded mb-4" />
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ) : allReviews.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white p-8 sm:p-12 shadow-sm min-h-[220px] flex flex-col justify-center items-center text-center">
              <p className="text-sm text-[#6B5E54]">No reviews currently available.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm min-h-[240px] flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-4">
                <Quote className="h-8 w-8 text-[#B88A3B]/30" />
                <span className="text-[11px] font-medium text-[#6B5E54] bg-[#F4F1E9] px-2.5 py-1 rounded-full">
                  Review {safeIndex + 1} of {total}
                </span>
              </div>

              <div
                key={currentReview?.id || safeIndex}
                style={{
                  animation: prefersReducedMotion ? "none" : "reviewFade 0.4s ease-out forwards",
                }}
                className="space-y-4"
              >
                <StarRating rating={currentReview?.rating || 5} />
                <p className="font-display text-base sm:text-lg md:text-xl text-[#332820] italic leading-relaxed">
                  &ldquo;{currentReview?.review}&rdquo;
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-4 border-t border-border/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#174D35] text-white flex items-center justify-center font-bold text-sm font-display shadow-xs shrink-0">
                    {currentReview?.name?.charAt(0)?.toUpperCase() || "K"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#332820] flex items-center gap-1.5">
                      <span>{currentReview?.name}</span>
                      <GoogleLogo className="h-3.5 w-3.5 shrink-0" />
                    </h3>
                    <p className="text-xs text-[#6B5E54] flex items-center gap-1">
                      <span>{currentReview?.date || "Google Reviewer"}</span>
                      <span>&bull;</span>
                      <span className="text-[#174D35] font-medium">Google Review</span>
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
          )}

          {/* Dots Indicator */}
          {allReviews.length > 1 && (
            <div
              className="flex justify-center items-center gap-1.5 mt-6 max-w-full overflow-x-auto py-1.5 px-2"
              role="tablist"
              aria-label="Review pagination dots"
            >
              {allReviews.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  role="tab"
                  aria-selected={safeIndex === idx}
                  aria-label={`Go to review ${idx + 1} of ${total}`}
                  className="flex items-center justify-center min-h-[44px] min-w-[20px] p-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174D35] rounded-full"
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-300 block ${
                      safeIndex === idx ? "w-6 bg-[#174D35]" : "w-2 bg-border hover:bg-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Google Attribution & External Action Links */}
          <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-[#6B5E54]">
            <div className="flex items-center gap-2">
              <GoogleLogo className="h-4 w-4 shrink-0" />
              <span>Reviews authenticated via Google Business Profile</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#174D35]/10 text-[#174D35] hover:bg-[#174D35]/20 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Browse All ({allReviews.length}) Reviews</span>
              </button>

              <a
                href={GOOGLE_WRITE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#174D35] text-white hover:bg-[#0D2F22] font-semibold text-xs transition-colors shadow-2xs"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Write a Google Review</span>
              </a>

              <a
                href={GOOGLE_READ_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-border text-[#332820] hover:bg-[#F4F1E9] font-medium text-xs transition-colors"
              >
                <span>Read all 116 on Google</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#6B5E54]" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL REVIEWS BROWSER MODAL ────────────────────────────────────── */}
      {isBrowseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-reviews-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#B88A3B]/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border/80 bg-[#FAF7F0] flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GoogleLogo className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold text-[#174D35] uppercase tracking-wider">
                    Official Google Reviews
                  </span>
                </div>
                <h3 id="all-reviews-title" className="text-xl font-bold font-display text-[#332820]">
                  Customer Experiences &amp; Feedback ({allReviews.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center text-[#6B5E54] hover:text-[#332820] hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close reviews dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 sm:p-6 border-b border-border/60 bg-white space-y-4 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5E54]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reviews by customer name or product..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F8F4E9]/50 border border-border rounded-full focus:outline-none focus:border-[#174D35] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B5E54] hover:text-[#332820]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setModalFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      modalFilter === "all"
                        ? "bg-[#174D35] text-white"
                        : "bg-[#F8F4E9] text-[#332820] hover:bg-[#EFEAE0]"
                    }`}
                  >
                    All ({allReviews.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalFilter("5star")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      modalFilter === "5star"
                        ? "bg-[#174D35] text-white"
                        : "bg-[#F8F4E9] text-[#332820] hover:bg-[#EFEAE0]"
                    }`}
                  >
                    5-Star Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalFilter("tamil")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      modalFilter === "tamil"
                        ? "bg-[#174D35] text-white"
                        : "bg-[#F8F4E9] text-[#332820] hover:bg-[#EFEAE0]"
                    }`}
                  >
                    தமிழ் Reviews
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Reviews List */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4 bg-[#F8F4E9]/30">
              {(() => {
                const modalList = allReviews.filter((r) => {
                  if (modalFilter === "5star" && r.rating !== 5) return false;
                  if (modalFilter === "tamil" && !(r.language === "ta" || /[அ-ஔ]/i.test(r.review))) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchName = r.name.toLowerCase().includes(q);
                    const matchReview = r.review.toLowerCase().includes(q);
                    if (!matchName && !matchReview) return false;
                  }
                  return true;
                });

                if (modalList.length === 0) {
                  return (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-sm text-[#6B5E54]">No reviews match your current search or filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setModalFilter("all");
                        }}
                        className="btn-primary text-xs"
                      >
                        Reset Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalList.map((r, idx) => (
                      <div
                        key={r.id || idx}
                        className="p-5 rounded-2xl bg-white border border-border/80 shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-[#174D35] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {r.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-[#332820] flex items-center gap-1">
                                  <span>{r.name}</span>
                                  <GoogleLogo className="h-3 w-3 shrink-0" />
                                </h4>
                                <span className="text-[11px] text-[#6B5E54]">{r.date}</span>
                              </div>
                            </div>
                            <StarRating rating={r.rating} />
                          </div>

                          <p className="text-xs sm:text-sm text-[#332820] leading-relaxed">
                            {r.review}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-[#6B5E54]">
                          <span className="text-[#174D35] font-medium">Google Review</span>
                          {r.googleUrl && (
                            <a
                              href={r.googleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-0.5"
                            >
                              <span>Verify</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border/80 bg-[#FAF7F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B5E54] shrink-0">
              <span className="flex items-center gap-1.5">
                <GoogleLogo className="h-3.5 w-3.5 shrink-0" />
                <span>Kayal Samayal &bull; 4.9 Stars on Google Business Profile</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={GOOGLE_WRITE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span>Write Review</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsBrowseModalOpen(false)}
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
