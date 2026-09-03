import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = 99,
  size = "md",
  label = "quantity",
  className,
}: Props) {
  const btn = cn(
    "grid place-items-center rounded-full text-primary transition-colors hover:bg-secondary/15 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
    size === "sm" ? "h-8 w-8 min-h-[32px] min-w-[32px]" : "h-10 w-10 min-h-[40px] min-w-[40px]",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between gap-1.5 rounded-full border border-border/80 bg-card shadow-xs",
        size === "sm" ? "p-0.5" : "p-1",
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        <Minus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm font-bold text-foreground tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Plus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      </button>
    </div>
  );
}
