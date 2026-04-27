"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50";

    const variants = {
      primary: "bg-red-600 hover:bg-red-700 text-white",
      outline: "border border-white/20 text-white hover:border-red-600/60 hover:text-red-400",
      ghost: "text-gray-400 hover:text-white",
    };

    const sizes = {
      sm: "text-[10px] px-4 py-2",
      md: "text-[10px] px-5 py-2.5",
      lg: "text-[11px] px-7 py-3.5",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
