import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  tagline: string;
  image?: string | null;
  emoji?: string;
  count?: number;
  className?: string;
}

export function CategoryCard({
  name,
  slug,
  tagline,
  image,
  emoji = "🌶️",
  count,
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className={cn(
        "group flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#174D35]/50",
        className,
      )}
    >
      {/* Category Photographic Showcase */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F4F1E9] flex items-center justify-center p-3">
        {image ? (
          <picture>
            <source
              srcSet={image.replace(/\.jpg$/, ".webp")}
              type="image/webp"
            />
            <img
              src={image}
              alt={`${name} by Kayal Samayal`}
              width={450}
              height={338}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </picture>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-4xl filter drop-shadow-sm">{emoji}</span>
          </div>
        )}

        {/* Variety Count Tag */}
        {count !== undefined && count > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[0.7rem] font-bold text-[#174D35] shadow-xs border border-border">
            {count} {count === 1 ? "Variety" : "Varieties"}
          </span>
        )}
      </div>

      {/* Title & Tagline */}
      <div className="flex flex-1 items-start justify-between gap-3 p-4 sm:p-5 border-t border-border/60 bg-white">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-[#332820] text-base sm:text-lg group-hover:text-[#174D35] transition-colors truncate">
            {name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-[#6B5E54] leading-relaxed">
            {tagline}
          </p>
        </div>
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F1E9] text-[#174D35] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#174D35] group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
