"use client";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, ChevronDown, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import BookingForm from "@/components/sections/BookingForm";
import Contacts from "@/components/sections/Contacts";

/* ── Types ─────────────────────────────────────────────────────────── */
interface Feature { title: string; desc: string; }
interface FaqItem { q: string; a: string; }
interface ProcessStep { step: string; title: string; desc: string; }
interface StatItem { value: string; label: string; }

export interface SeoPageData {
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    priceFrom: string;
  };
  stats: StatItem[];
  features: Feature[];
  process: ProcessStep[];
  faq: FaqItem[];
  breadcrumb: string;
  bgImage: string;
}

/* ── 3D Tilt card (21st.dev ElitePlanCard pattern) ─────────────────── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-60, 60], [5, -5]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-60, 60], [-5, 5]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated stat counter ──────────────────────────────────────────── */
function StatCard({ value, label, index }: { value: string; label: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`px-6 py-5 ${index < 3 ? "border-r border-white/6" : ""}`}
    >
      <div className="font-serif text-3xl md:text-4xl text-white italic mb-1">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">{label}</div>
    </motion.div>
  );
}

/* ── FAQ Accordion ──────────────────────────────────────────────────── */
function FaqAccordion({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className="border-b border-white/6 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <span className="text-white text-sm md:text-base font-light group-hover:text-red-400 transition-colors duration-300">
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-red-600 shrink-0"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-500 text-sm leading-relaxed font-light">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Template ──────────────────────────────────────────────────── */
export default function SeoPageTemplate({ data, locale }: { data: SeoPageData; locale: string }) {
  const tContacts = useTranslations("contacts");
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "18%"]), { stiffness: 80, damping: 20 });
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [0.55, 0.92]);
  const contentY = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "25%"]), { stiffness: 80, damping: 20 });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const scrollToBooking = () =>
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="bg-[#0D0D0D] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
        {/* Parallax bg */}
        <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
          <img
            src={data.bgImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>

        {/* Overlays */}
        <motion.div className="absolute inset-0 z-[1] bg-[#0D0D0D]" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/70 to-transparent" />
        <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/50" />

        {/* 3D grid accent */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-[4] overflow-hidden opacity-20">
          <div className="grid-3d w-full h-[200%]" />
        </div>

        {/* Red glow */}
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 z-[3] rounded-full bg-red-600/8 blur-[80px] pointer-events-none" />

        {/* Vertical accent line */}
        <div className="absolute left-8 top-0 bottom-0 w-px z-10 hidden lg:block overflow-hidden">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ originY: 0 }}
            className="w-full h-full bg-gradient-to-b from-transparent via-red-600/35 to-transparent"
          />
        </div>

        {/* Content */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-16"
        >
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 text-[11px] text-gray-600 mb-8 uppercase tracking-[0.2em]"
            aria-label="Breadcrumb"
          >
            <Link href={`/${locale}`} className="hover:text-white transition-colors duration-300">AlmaDrive</Link>
            <ChevronRight size={10} />
            <span>{data.breadcrumb}</span>
          </motion.nav>

          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-6 h-px bg-red-600" />
              <span className="number-label">{data.hero.badge}</span>
            </motion.div>

            {/* H1 — Apple-style split */}
            <div className="overflow-clip mb-2">
              <motion.h1
                initial={{ y: 70 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-[clamp(2.8rem,6.5vw,6rem)] leading-[1.0] text-white tracking-tight"
              >
                {data.hero.title}
              </motion.h1>
            </div>
            <div className="overflow-clip mb-6">
              <motion.span
                initial={{ y: 70 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="block font-serif text-[clamp(2.8rem,6.5vw,6rem)] leading-[1.0] text-red-600 italic tracking-tight"
              >
                {data.hero.titleAccent}
              </motion.span>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.56 }}
              className="text-gray-400 text-lg leading-relaxed mb-5 max-w-lg font-light"
            >
              {data.hero.subtitle}
            </motion.p>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="inline-flex items-center gap-2 border border-red-600/30 bg-red-600/5 px-4 py-2 mb-8"
            >
              <span className="number-label opacity-60">от</span>
              <span className="font-serif text-xl text-white italic">{data.hero.priceFrom}</span>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={scrollToBooking}
                className="bg-red-600 hover:bg-red-700 text-white text-[11px] uppercase tracking-[0.25em] font-medium px-8 py-4 transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                Оставить заявку
                <ArrowRight size={14} />
              </button>
              <a href={`tel:${tContacts("phone")}`}>
                <button className="border border-white/15 text-white hover:border-red-600/50 text-[11px] uppercase tracking-[0.25em] font-medium px-8 py-4 transition-all duration-300 cursor-pointer flex items-center gap-2">
                  <Phone size={14} />
                  {tContacts("phone")}
                </button>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      {data.stats.length > 0 && (
        <section className="border-y border-white/6 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {data.stats.map((s, i) => (
                <StatCard key={i} value={s.value} label={s.label} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0D0D0D] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />

        {/* Big background number */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 font-serif text-[18rem] leading-none text-white/[0.015] select-none pointer-events-none">
          01
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-red-600" />
              <span className="number-label">Преимущества</span>
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-white tracking-tight">
              Почему выбирают нас
            </h2>
          </motion.div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5"
            style={{ perspective: "1200px" }}
          >
            {data.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard>
                  <div className="bg-[#0D0D0D] hover:bg-[#141414] transition-colors duration-300 p-7 h-full group relative">
                    <div className="number-label mb-5 opacity-30">{String(i + 1).padStart(2, "0")}</div>
                    <div className="w-8 h-8 border border-white/10 group-hover:border-red-600/40 flex items-center justify-center mb-5 transition-colors duration-300">
                      <CheckCircle2 size={15} className="text-red-500" />
                    </div>
                    <h3 className="font-serif text-lg text-white italic mb-2 leading-snug group-hover:text-red-100 transition-colors duration-300">
                      {f.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-light">{f.desc}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────────── */}
      {data.process.length > 0 && (
        <section className="py-24 bg-[#111111] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />
          <div className="absolute bottom-0 left-0 right-0 h-px red-line opacity-20" />

          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-14"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-px bg-red-600" />
                <span className="number-label">Как это работает</span>
              </div>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-white tracking-tight">
                3 простых шага
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {data.process.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative p-8 ${i < data.process.length - 1 ? "md:border-r border-white/6" : ""}`}
                >
                  <div className="font-serif text-[5rem] leading-none text-white/5 italic mb-4 select-none">
                    {step.step}
                  </div>
                  <h3 className="font-serif text-xl text-white italic mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-light">{step.desc}</p>

                  {i < data.process.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <ArrowRight size={16} className="text-red-600/40" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOKING FORM ──────────────────────────────────────────────── */}
      <BookingForm />

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0D0D0D]">
        <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-red-600" />
              <span className="number-label">FAQ</span>
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-white tracking-tight">
              Частые вопросы
            </h2>
          </motion.div>

          <div>
            {data.faq.map((item, i) => (
              <FaqAccordion key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTS ─────────────────────────────────────────────────── */}
      <Contacts />

      {/* ── JSON-LD ───────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${data.hero.title} ${data.hero.titleAccent}`,
            description: data.hero.subtitle,
            provider: {
              "@type": "LocalBusiness",
              name: "AlmaDrive",
              telephone: tContacts("phone"),
              address: {
                "@type": "PostalAddress",
                addressLocality: "Almaty",
                addressCountry: "KZ",
              },
            },
            areaServed: { "@type": "City", name: "Almaty" },
          }),
        }}
      />
    </main>
  );
}
