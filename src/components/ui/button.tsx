import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-deep-green",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "border border-border bg-card shadow-xs hover:bg-accent hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-[#a37930]",
        ghost: "hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-secondary text-secondary-foreground shadow-md hover:bg-[#a37930] active:scale-[0.98]",
        forest: "bg-[#174D35] text-white shadow-xs hover:bg-[#0D2F22] active:scale-[0.98]",
        gold: "bg-[#B88A3B] text-white shadow-xs hover:bg-[#a37930] active:scale-[0.98]",
        plum: "bg-primary text-primary-foreground shadow-xs hover:bg-[#0D2F22] active:scale-[0.98]",
        soft: "bg-accent text-accent-foreground hover:bg-accent/80",
        outlineForest: "border border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-white",
        outlinePlum: "border border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-white",
        outlineGold: "border border-[#B88A3B]/60 bg-transparent text-[#B88A3B] hover:bg-[#B88A3B] hover:text-white",
        leaf: "bg-leaf text-leaf-foreground hover:bg-deep-green shadow-xs",
        whatsapp: "bg-[#25D366] text-white hover:bg-[#20ba5a] shadow-xs",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        touch: "min-h-[44px] h-11 px-5 text-sm font-semibold rounded-xl",
        pill: "min-h-[48px] h-12 rounded-full px-7 text-[0.95rem] font-bold",
        iconTouch: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
