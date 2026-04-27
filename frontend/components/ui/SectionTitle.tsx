"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  number?: string;
  light?: boolean;
  className?: string;
}

export default function SectionTitle({ title, subtitle, number, light, className }: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mb-16", className)}
    >
      {number && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-px bg-red-600" />
          <span className="number-label">{number}</span>
        </div>
      )}
      <h2 className={cn(
        "font-serif text-[clamp(2.2rem,5vw,4rem)] leading-tight tracking-tight",
        light ? "text-white" : "text-white"
      )}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-gray-400 text-base font-light max-w-xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
