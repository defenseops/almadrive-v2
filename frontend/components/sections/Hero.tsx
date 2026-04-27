"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

const STATS = [
  { value: "6+", key: "years" },
  { value: "3 000+", key: "clients" },
  { value: "4.9★", key: "rating" },
  { value: "24/7", key: "support" },
];

export default function Hero() {
  const t = useTranslations("hero");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 80, damping: 20 };
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "18%"]), springConfig);
  const textY = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "30%"]), springConfig);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.5, 0.92]);
  const titleScale = useSpring(useTransform(scrollYProgress, [0, 0.5], [1, 0.94]), springConfig);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const scrollToBooking = () => {
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const words = t("title").split(" ");
  const firstPart = words.slice(0, 2).join(" ");
  const accentPart = words.slice(2).join(" ");

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Car background with parallax */}
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=90&w=2560"
          alt="Premium car"
          fill
          priority
          className="object-cover scale-110"
          sizes="100vw"
        />
      </motion.div>

      {/* Dark overlay with scroll fade */}
      <motion.div
        className="absolute inset-0 z-[1] bg-[#0D0D0D]"
        style={{ opacity: overlayOpacity }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/40" />

      {/* 3D perspective grid at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 z-[4] overflow-hidden opacity-30">
        <div className="grid-3d w-full h-[200%]" />
      </div>

      {/* Red glow spot */}
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 z-[3] rounded-full bg-red-600/10 blur-[80px] pointer-events-none" />

      {/* Vertical line accent */}
      <div className="absolute left-8 top-0 bottom-0 w-px z-10 hidden lg:block overflow-hidden">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ originY: 0 }}
          className="w-full h-full bg-gradient-to-b from-transparent via-red-600/40 to-transparent"
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ y: textY, scale: titleScale, opacity: titleOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-16"
      >
        <div className="max-w-4xl">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-red-600" />
            <span className="number-label">{t("badge")}</span>
          </motion.div>

          {/* Main title — Apple-style huge typography */}
          <div className="overflow-clip mb-2">
            <motion.h1
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[clamp(3rem,7vw,7rem)] leading-[1.0] text-white tracking-tight"
            >
              {firstPart}
            </motion.h1>
          </div>
          <div className="overflow-clip mb-8">
            <motion.h1
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[clamp(3rem,7vw,7rem)] leading-[1.0] text-red-600 italic tracking-tight"
            >
              {accentPart}
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md font-light"
          >
            {t("subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={scrollToBooking}
              className="bg-red-600 hover:bg-red-700 text-white text-[11px] uppercase tracking-[0.25em] font-medium px-8 py-4 transition-all duration-300 cursor-pointer"
            >
              {t("cta")}
            </button>
            <a
              href={`tel:+77771234567`}
              className="border border-white/20 text-white hover:border-white/60 text-[11px] uppercase tracking-[0.25em] font-medium px-8 py-4 transition-all duration-300"
            >
              {t("ctaCall")}
            </a>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/8 max-w-2xl"
        >
          {STATS.map(({ value, key }, i) => (
            <div
              key={key}
              className={`px-6 py-5 ${i < STATS.length - 1 ? "border-r border-white/8" : ""}`}
            >
              <div className="font-serif text-2xl md:text-3xl text-white italic mb-1">{value}</div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                {t(`stats.${key}`)}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={scrollToBooking}
        aria-label="Прокрутить вниз"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/30 hover:text-red-500 transition-colors duration-300"
        >
          <ChevronDown size={24} />
        </motion.div>
      </motion.button>
    </section>
  );
}
