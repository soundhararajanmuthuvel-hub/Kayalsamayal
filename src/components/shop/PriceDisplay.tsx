import { discountPercent, formatINR } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface Props {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ price, mrp, size = "md", className }: Props) {
  const off = discountPercent(price, mrp);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-bold text-foreground tracking-tight",
          size === "sm" && "text-base",
          size === "md" && "text-lg sm:text-xl",
          size === "lg" && "text-2xl sm:text-3xl font-extrabold",
        )}
      >
        {formatINR(price)}
      </span>
      {off > 0 && mrp && mrp > price ? (
        <>
          <span className="text-xs sm:text-sm text-muted-foreground line-through decoration-muted-foreground/60">
            {formatINR(mrp)}
          </span>
          <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[0.7rem] font-bold text-leaf border border-leaf/25">
            {off}% OFF
          </span>
        </>
      ) : null}
    </div>
  );
}
