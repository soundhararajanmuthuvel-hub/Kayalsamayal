"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getInstagramReels, type ReelItem } from "@/lib/api";
import { products as localProducts } from "@/data/products";

// ── Icons ──────────────────────────────────────────────────────────────────

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="ks-ig" cx="30%" cy="107%" r="150%">
          <stop offset="0%"  stopColor="#fdf497" />
          <stop offset="5%"  stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ks-ig)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
    </svg>
  );
}

// ── Individual video card ──────────────────────────────────────────────────

interface ReelCardProps {
  reel: ReelItem;
  index: number;
}

function ReelCard({ reel, index }: ReelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const [isMuted,    setIsMuted]    = useState(true);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Look up real product from local static data
  const product = reel.productId
    ? localProducts.find((p) => p.id === reel.productId && p.active !== false)
    : undefined;

  const hasVideo = !!reel.url && !videoError;

  // ── Viewport-aware autoplay / pause via IntersectionObserver ─────────────
  // NOTE: iOS Safari requires a user gesture for the first play().
  // The play() call inside the observer may be silently rejected on iOS.
  // The play-button overlay handles this gracefully — tapping it is a gesture.
  useEffect(() => {
    const container = containerRef.current;
    const video     = videoRef.current;
    if (!container || !video || !hasVideo) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          video.play().catch(() => { /* autoplay blocked — user sees poster + play button */ });
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.3] }
    );

    obs.observe(container);
    return () => obs.disconnect();
  }, [hasVideo]);

  function handleVideoClick() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function handleMuteToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden w-full"
      style={{
        aspectRatio: "9 / 16",
        border:      "1px solid rgba(255,255,255,0.10)",
        boxShadow:   "0 2px 8px rgba(46,21,44,0.55), 0 10px 32px rgba(46,21,44,0.35)",
        background:  "#160d15",
      }}
    >
      {/* ── Media layer ─────────────────────────────────────────── */}
      {hasVideo ? (
        /*
         * preload="none"  — browser will NOT download video data until play() is called.
         * poster          — shown immediately from cache/network as a regular image.
         * muted + loop + playsInline — required for autoplay on all major browsers.
         */
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={reel.thumbnail || undefined}
          src={reel.url}
          onError={() => setVideoError(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={handleVideoClick}
          aria-label={reel.caption || `Kayal Samayal video reel ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        />
      ) : reel.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reel.thumbnail}
          alt={reel.caption || `Kayal Samayal reel ${index + 1}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          width={260}
          height={462}
        />
      ) : (
        /* Branded gradient fallback — shown when neither video nor thumbnail is configured */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none"
          style={{ background: "linear-gradient(160deg, #2E152C 0%, #D35400 100%)" }}
        >
          <span
            className="font-display font-black text-4xl"
            style={{ color: "#d49b28" }}
          >
            KS
          </span>
          <InstagramIcon className="h-9 w-9 opacity-75" />
          <span
            className="text-[0.58rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            @kayalsamayal
          </span>
        </div>
      )}

      {/* ── Top gradient overlay ─────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: "linear-gradient(to bottom, rgba(12,5,11,0.80) 0%, transparent 100%)",
        }}
      />

      {/* ── Bottom gradient overlay ──────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height:     product ? "62%" : "30%",
          background: "linear-gradient(to top, rgba(10,4,9,0.97) 0%, rgba(10,4,9,0.55) 50%, transparent 100%)",
        }}
      />

      {/* ── Top bar: IG icon + "View on IG" ────────────────────── */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
        <InstagramIcon className="h-6 w-6 drop-shadow" />
        <a
          href="https://www.instagram.com/kayalsamayal/reels/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Kayal Samayal reels on Instagram"
          onClick={(e) => e.stopPropagation()}
          className="text-[0.58rem] font-bold uppercase tracking-wide px-2 py-1 rounded-full transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-white"
          style={{
            background:    "rgba(255,255,255,0.17)",
            color:         "rgba(255,255,255,0.88)",
            backdropFilter:"blur(4px)",
          }}
        >
          View on IG ↗
        </a>
      </div>

      {/* ── Play button overlay — visible when video is paused ─── */}
      {hasVideo && !isPlaying && (
        <button
          type="button"
          aria-label="Play video"
          onClick={handleVideoClick}
          className="absolute inset-0 z-10 flex items-center justify-center focus-visible:outline-none"
        >
          <div
            className="flex items-center justify-center h-14 w-14 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{
              background:    "rgba(46,21,44,0.72)",
              backdropFilter:"blur(3px)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 translate-x-0.5"
              fill="white"
              aria-hidden="true"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </button>
      )}

      {/* ── Mute / unmute toggle (bottom-right) ─────────────────── */}
      {hasVideo && (
        <button
          type="button"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          onClick={handleMuteToggle}
          className="absolute bottom-3 right-3 z-20 flex items-center justify-center h-8 w-8 rounded-full focus-visible:outline-2 focus-visible:outline-white"
          style={{
            background:    "rgba(0,0,0,0.58)",
            color:         "white",
            backdropFilter:"blur(4px)",
          }}
        >
          {isMuted ? (
            /* Muted icon */
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" />
              <line x1="22" y1="9" x2="16" y2="15" stroke="white" strokeWidth="2.2" />
              <line x1="16" y1="9" x2="22" y2="15" stroke="white" strokeWidth="2.2" />
            </svg>
          ) : (
            /* Unmuted icon */
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="white" strokeWidth="2.2" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      )}

      {/* ── Bottom: product overlay or caption ──────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-3 pt-1">
        {product ? (
          <div className="space-y-1">
            {reel.caption && (
              <p
                className="text-[0.62rem] leading-snug line-clamp-2"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {reel.caption}
              </p>
            )}

            {/* Product name */}
            <p className="text-sm font-bold leading-snug line-clamp-2 text-white">
              {product.name}
            </p>

            {/* Price row */}
            {((product.price ?? 0) > 0 || (product.mrp ?? 0) > 0) && (
              <div className="flex items-center gap-2">
                {(product.price ?? 0) > 0 && (
                  <span className="font-bold text-sm" style={{ color: "#D35400" }}>
                    ₹{product.price}
                  </span>
                )}
                {(product.mrp ?? 0) > (product.price ?? 0) && (
                  <span
                    className="text-xs line-through"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    ₹{product.mrp}
                  </span>
                )}
              </div>
            )}

            {/* Shop Now CTA */}
            <Link
              href={`/products/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Shop ${product.name}`}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-white mt-0.5 min-h-[32px]"
              style={{ background: "#D35400", color: "white" }}
            >
              Shop Now →
            </Link>
          </div>
        ) : reel.caption ? (
          <p className="text-sm font-semibold leading-snug line-clamp-3 text-white">
            {reel.caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div
        className="flex items-center justify-center h-20 w-20 rounded-full"
        style={{ background: "linear-gradient(135deg, #2E152C 0%, #D35400 100%)" }}
      >
        <InstagramIcon className="h-10 w-10" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-display text-xl font-bold text-white">
          See what&apos;s cooking at Kayal Samayal
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
          Traditional recipes, product stories and coastal kitchen inspiration.
        </p>
      </div>
      <a
        href="https://www.instagram.com/kayalsamayal/reels/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View all Kayal Samayal reels on Instagram"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#D35400] min-h-[44px]"
        style={{ background: "#D35400", color: "white" }}
      >
        <InstagramIcon className="h-4 w-4" />
        View All Reels →
      </a>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex gap-4 overflow-hidden justify-center">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded-2xl animate-pulse"
          style={{
            width:       "clamp(200px, 68vw, 260px)",
            aspectRatio: "9 / 16",
            maxHeight:   "460px",
            background:  "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────

export default function InstagramReels() {
  const [reels,  setReels]  = useState<ReelItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getInstagramReels()
      .then(setReels)
      .catch(() => setReels([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section
      aria-labelledby="reels-heading"
      className="py-16 sm:py-20 border-b overflow-hidden"
      style={{
        background:   "linear-gradient(160deg, #240922 0%, #2E152C 55%, #3b1e38 100%)",
        borderColor:  "rgba(255,255,255,0.07)",
      }}
    >
      <div className="container-page">

        {/* ── Section header ─────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 justify-center">
            <InstagramIcon className="h-5 w-5" />
            <p className="section-eyebrow" style={{ color: "#d49b28" }}>
              On Instagram
            </p>
          </div>

          <h2
            id="reels-heading"
            className="section-title"
            style={{ color: "#ffffff" }}
          >
            Latest from{" "}
            <span className="font-display italic" style={{ color: "#D35400" }}>
              Kayal Samayal
            </span>
          </h2>

          <div
            className="divider-spice mx-auto"
            style={{ background: "linear-gradient(90deg, #D35400 0%, #d49b28 100%)" }}
          />

          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
            Real recipes. Traditional flavours. Fresh from Kayal Samayal.
          </p>
        </div>

        {/* ── Cards ──────────────────────────────────────────────── */}
        {!loaded ? (
          <Skeleton />
        ) : reels.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/*
             * Mobile / tablet: horizontal CSS scroll-snap carousel.
             * Cards are ~68vw wide so ~1.3 cards peek on 375px phones.
             * lg:hidden ensures this disappears on large screens.
             * display:none on hidden cards = IntersectionObserver never fires for them,
             * so those videos never play (correct, safe, no wasted bandwidth).
             */}
            <div
              className="snap-row no-scrollbar lg:hidden"
              style={{ paddingInline: "1rem", scrollPaddingInline: "1rem" }}
              aria-label="Kayal Samayal video reels, swipe to browse"
              role="region"
            >
              {reels.map((reel, idx) => (
                <div
                  key={`mob-${idx}`}
                  className="snap-cell"
                  style={{ width: "clamp(200px, 68vw, 260px)" }}
                >
                  <ReelCard reel={reel} index={idx} />
                </div>
              ))}
              {/* Phantom spacer so the last card shows a peek of space */}
              <div className="flex-shrink-0 w-3" aria-hidden="true" />
            </div>

            {/*
             * Desktop: 4-column grid.
             * hidden below lg — display:none prevents video play for hidden cards.
             * Cards fill the grid cell width (no fixed width needed).
             */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-5 xl:gap-6">
              {reels.map((reel, idx) => (
                <ReelCard key={`desk-${idx}`} reel={reel} index={idx} />
              ))}
            </div>
          </>
        )}

        {/* ── CTA buttons ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10 sm:mt-12">
          <a
            href="https://www.instagram.com/kayalsamayal/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Kayal Samayal on Instagram"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D35400] min-h-[44px]"
            style={{ background: "#D35400", color: "white" }}
          >
            <InstagramIcon className="h-4 w-4" />
            Follow @kayalsamayal
          </a>

          <a
            href="https://www.instagram.com/kayalsamayal/reels/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View all Kayal Samayal Instagram Reels"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d49b28] min-h-[44px]"
            style={{
              background: "rgba(255,255,255,0.08)",
              color:      "#d49b28",
              border:     "1px solid rgba(212,155,40,0.4)",
            }}
          >
            View All Reels →
          </a>
        </div>
      </div>
    </section>
  );
}
