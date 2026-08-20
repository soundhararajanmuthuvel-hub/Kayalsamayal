"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials as localTestimonials } from "@/data/testimonials";
import type { Testimonial } from "@/data/testimonials";
import { getReviews } from "@/lib/api";

/* ── Google G icon ───────────────────────────────────────────────────── */
function GoogleG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ── Star rating ─────────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#D48806" : "#DDD0B8"}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Review Skeleton ────────────────────────────────────────────────── */
function ReviewSkeleton() {
  return (
    <div className="bg-cream-50 rounded-2xl border border-cream-300 p-5 sm:p-6 animate-pulse space-y-4 h-full flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cream-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-cream-200 rounded w-1/3" />
            <div className="h-2 bg-cream-200 rounded w-1/4" />
          </div>
        </div>
        <div className="h-3 bg-cream-200 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3.5 bg-cream-200 rounded w-full" />
          <div className="h-3.5 bg-cream-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

/* ── Initials avatar ─────────────────────────────────────────────────── */
const PALETTE: { bg: string; fg: string }[] = [
  { bg: "#B83A1B", fg: "#FFFDF9" },
  { bg: "#D48806", fg: "#1A1615" },
  { bg: "#1A1615", fg: "#FAF6F0" },
  { bg: "#9E2A2B", fg: "#FFFDF9" },
  { bg: "#6B3A0F", fg: "#FFFDF9" },
];

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0 select-none border border-gold-600/20"
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const { bg, fg } = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 select-none"
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ── Review card ─────────────────────────────────────────────────────── */
const TRUNCATE_AT = 200;
const TAMIL_RE = /[\u0B80-\u0BFF]/;

function ReviewCard({
  t,
  isCenter,
}: {
  t: Testimonial;
  isCenter: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = t.review.length > TRUNCATE_AT;
  const shown =
    isLong && !expanded
      ? t.review.slice(0, TRUNCATE_AT).trimEnd() + "…"
      : t.review;
  const hasTamil = TAMIL_RE.test(t.review);

  return (
    <motion.article
      animate={{
        scale: isCenter ? 1.02 : 1,
        opacity: isCenter ? 1 : 0.82,
      }}
      transition={{ duration: 0.3 }}
      className={`relative h-full flex flex-col rounded-2xl border p-5 sm:p-6 select-none
        ${
          isCenter
            ? "bg-white border-gold-600/40 shadow-[0_4px_24px_rgba(212,136,6,0.13)]"
            : "bg-cream-50 border-cream-300 shadow-sm"
        }`}
      lang={hasTamil ? "ta" : "en"}
      aria-label={`Review by ${t.name}`}
    >
      {/* Decorative background quote */}
      <div
        className="absolute top-4 right-4 text-gold-600/10 pointer-events-none"
        aria-hidden="true"
      >
        <Quote size={48} strokeWidth={1} />
      </div>

      {/* Reviewer header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={t.name} avatar={t.avatar} />
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-espresso-900 text-sm leading-tight truncate">
            {t.name}
          </p>
          <span className="inline-flex items-center gap-1 text-[0.6rem] text-espresso-800/50 font-body mt-0.5">
            <GoogleG />
            Google Review
          </span>
        </div>
      </div>

      {/* Stars + date */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <StarRating rating={t.rating} />
        <span className="text-espresso-800/30 text-xs" aria-hidden="true">
          ·
        </span>
        <time className="font-body text-espresso-800/55 text-xs">{t.date}</time>
      </div>

      {/* Review body */}
      <div className="flex-1 min-h-0">
        <p
          className="font-body text-espresso-800 text-sm leading-relaxed"
          lang={hasTamil ? "ta" : "en"}
        >
          {shown}
        </p>
        {isLong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="mt-2 text-gold-600 text-xs font-semibold hover:text-rust-600 transition-colors
              focus-visible:outline-2 focus-visible:outline-gold-600 focus-visible:rounded"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </motion.article>
  );
}

/* ── Main section ────────────────────────────────────────────────────── */
export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const [itemsPerView, setItemsPerView] = useState(3);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await getReviews();
        if (data && data.length > 0) {
          setTestimonials(data);
        } else {
          setTestimonials(localTestimonials);
        }
      } catch (err) {
        console.error("Failed to load reviews", err);
        setTestimonials(localTestimonials);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);

  const isPaused = hoverPaused || interactionPaused;
  const GAP = 20;
  const maxIndex = Math.max(0, testimonials.length - itemsPerView);
  const totalPositions = maxIndex + 1;

  const cardWidth =
    containerWidth > 0
      ? (containerWidth - GAP * (itemsPerView - 1)) / itemsPerView
      : 0;
  const trackX = -(currentIndex * (cardWidth + GAP));

  // Detect items per view from viewport
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setItemsPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clamp index when itemsPerView changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((i) => Math.min(i, maxIndex));
    }, 0);
    return () => clearTimeout(timer);
  }, [maxIndex]);

  const prev = useCallback(() => {
    setInteractionPaused(true);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setInteractionPaused(true);
    setCurrentIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  const goTo = useCallback((i: number) => {
    setInteractionPaused(true);
    setCurrentIndex(i);
  }, []);

  // Resume after interaction pause
  useEffect(() => {
    if (!interactionPaused) return;
    const t = setTimeout(() => setInteractionPaused(false), 6000);
    return () => clearTimeout(t);
  }, [interactionPaused, currentIndex]);

  // Autoplay
  useEffect(() => {
    if (prefersReduced || isPaused) return;
    const t = setInterval(() => {
      setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4500);
    return () => clearInterval(t);
  }, [isPaused, maxIndex, prefersReduced]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [prev, next]
  );

  // Touch/swipe state
  const swipeStart = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const diff = swipeStart.current - e.clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const centerIndex =
    itemsPerView === 3
      ? currentIndex + 1
      : itemsPerView === 2
      ? currentIndex
      : currentIndex;

  const springTransition = prefersReduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 32 };

  return (
    <section
      id="testimonials"
      className="relative texture-paper py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Subtle paper noise overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.p
            className="section-eyebrow mb-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Customer Reviews
          </motion.p>
          <motion.h2
            className="section-title mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            What Our{" "}
            <span className="gold-shimmer">Customers Say</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-5"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
          <motion.p
            className="font-body text-espresso-800 text-base max-w-lg mx-auto mb-2 px-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Loved by families who believe good food begins with good ingredients.
          </motion.p>
          <motion.p
            className="font-body text-espresso-800/45 text-[0.7rem] tracking-[0.18em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            Real words from our customers
          </motion.p>
        </div>

        {/* Carousel wrapper — extra px for arrow buttons */}
        <div
          className="relative px-6 sm:px-8"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Customer reviews carousel"
          tabIndex={0}
        >
          {/* Track viewport */}
          <div
            ref={containerRef}
            className="overflow-hidden rounded-xl"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            style={{ touchAction: "pan-y" }}
          >
            <motion.div
              className="flex"
              style={{ gap: GAP }}
              animate={{ x: trackX }}
              transition={springTransition}
            >
              {loading ? (
                Array.from({ length: itemsPerView }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: cardWidth > 0 ? cardWidth : undefined,
                      minWidth: cardWidth > 0 ? cardWidth : `calc((100% - ${GAP * (itemsPerView - 1)}px) / ${itemsPerView})`,
                      flexShrink: 0,
                    }}
                  >
                    <ReviewSkeleton />
                  </div>
                ))
              ) : (
                testimonials.map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      width: cardWidth > 0 ? cardWidth : undefined,
                      minWidth: cardWidth > 0 ? cardWidth : `calc((100% - ${GAP * (itemsPerView - 1)}px) / ${itemsPerView})`,
                      flexShrink: 0,
                    }}
                  >
                    <ReviewCard t={t} isCenter={i === centerIndex} />
                  </div>
                ))
              )}
            </motion.div>
          </div>

          {/* Prev button */}
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            aria-label="Previous reviews"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-white border border-cream-300 shadow-md
              flex items-center justify-center text-espresso-800
              hover:text-gold-600 hover:border-gold-600 hover:shadow-lg
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-gold-600"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next button */}
          <button
            onClick={next}
            disabled={currentIndex >= maxIndex}
            aria-label="Next reviews"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-white border border-cream-300 shadow-md
              flex items-center justify-center text-espresso-800
              hover:text-gold-600 hover:border-gold-600 hover:shadow-lg
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-gold-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Pagination dots */}
        <div
          className="flex justify-center items-center gap-1.5 mt-8"
          role="tablist"
          aria-label="Navigate carousel positions"
        >
          {Array.from({ length: totalPositions }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Go to position ${i + 1} of ${totalPositions}`}
              onClick={() => goTo(i)}
              className="p-0.5 focus-visible:outline-2 focus-visible:outline-gold-600 rounded-full"
            >
              <motion.span
                className="block rounded-full"
                animate={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  backgroundColor:
                    i === currentIndex ? "#D48806" : "#DDD0B8",
                  opacity: i === currentIndex ? 1 : 0.6,
                }}
                transition={{ duration: 0.3 }}
                style={{ display: "block" }}
              />
            </button>
          ))}
        </div>

        {/* Autoplay progress indicator */}
        {!isPaused && !prefersReduced && (
          <p className="text-center font-body text-[0.6rem] text-espresso-800/30 mt-3 tracking-wider">
            Auto-advancing · hover to pause
          </p>
        )}
      </div>
    </section>
  );
}
