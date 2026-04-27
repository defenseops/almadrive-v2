"use client";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Clock, Star, Phone, Tag, Award } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { useRef } from "react";

const ICONS = [Shield, Clock, Star, Phone, Tag, Award];

export default function WhyUs() {
  const t = useTranslations("whyUs");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const items = t.raw("items") as { title: string; desc: string }[];

  return (
    <section id="whyus" ref={containerRef} className="py-28 bg-[#111111] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />
      <div className="absolute bottom-0 left-0 right-0 h-px red-line opacity-20" />

      {/* Large background number */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 font-serif text-[20rem] leading-none text-white/[0.015] select-none pointer-events-none">
        02
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left sticky text */}
          <div className="lg:sticky lg:top-28">
            <SectionTitle title={t("title")} subtitle={t("subtitle")} number="02" />

            {/* Car detail image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-64 overflow-hidden border border-white/5"
            >
              <img
                src="https://images.unsplash.com/photo-1581540222194-0def2dda95b8?q=85&w=1200"
                alt="Car interior"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
            </motion.div>
          </div>

          {/* Right: feature items */}
          <div className="space-y-0">
            {items.map((item, i) => {
              const Icon = ICONS[i] ?? Shield;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex items-start gap-5 py-7 border-b border-white/6 last:border-0 hover:bg-white/[0.02] px-2 transition-colors duration-300"
                >
                  <div className="number-label mt-1 w-6 shrink-0 opacity-40">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="w-9 h-9 border border-white/10 group-hover:border-red-600/40 flex items-center justify-center shrink-0 transition-colors duration-300 mt-0.5">
                    <Icon size={16} className="text-red-500" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-white italic mb-1.5 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm font-light leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
