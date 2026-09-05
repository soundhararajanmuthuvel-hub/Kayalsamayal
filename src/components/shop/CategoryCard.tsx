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
        "group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-lift)] hover:border-secondary/40",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface flex items-center justify-center p-3">
        {image ? (
          <picture>
            <source
              srcSet={image.replace(/\.jpg$/, ".webp")}
              type="image/webp"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${name} from Kayal Samayal`}
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

        {count !== undefined && count > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-bold text-secondary shadow-xs border border-border/60">
            {count} {count === 1 ? "Variety" : "Varieties"}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-t border-border/50">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-foreground text-base sm:text-lg group-hover:text-secondary transition-colors truncate">
            {name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {tagline}
          </p>
        </div>
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-secondary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
