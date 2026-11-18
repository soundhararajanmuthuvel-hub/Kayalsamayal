"use client";

import React, { useState, useEffect } from "react";
import { Star, ExternalLink, Loader2 } from "lucide-react";
import { Testimonial, testimonials as localTestimonials } from "@/data/testimonials";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from API or local testimonials
    fetch("/api/settings")
      .catch(() => null)
      .finally(() => {
        setReviews(localTestimonials);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#0C2B1C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#0C2B1C]">
          Customer Reviews & Testimonials ({reviews.length})
        </h2>
        <p className="text-xs text-neutral-500">
          Google Business reviews and customer feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-neutral-900 text-sm">{r.name}</p>
                <p className="text-[10px] text-neutral-400">{r.date}</p>
              </div>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: r.rating || 5 }).map((_, s) => (
                  <Star key={s} size={13} fill="currentColor" />
                ))}
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed italic line-clamp-4">
              &ldquo;{r.review}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
              <span className="font-medium text-[#8C5E28]">{r.source || "Google Review"}</span>
              {r.googleUrl && (
                <a
                  href={r.googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[#0C2B1C]"
                >
                  <span>View on Google</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
