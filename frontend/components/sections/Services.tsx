"use client";
import { useTranslations } from "next-intl";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Plane, Clock, Map, Calendar, Briefcase, Camera } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { formatPrice } from "@/lib/utils";
import type { Service } from "@/lib/api";

const ICONS: Record<string, React.ElementType> = {
  plane: Plane, clock: Clock, map: Map,
  calendar: Calendar, briefcase: Briefcase, camera: Camera,
};

const SERVICE_ICON_KEYS = ["airport", "hourly", "intercity", "events", "delegation", "tour"];

interface ServicesProps { services: Service[]; }

function TiltCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-80, 80], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-80, 80], [-6, 6]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      className="cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function Services({ services }: ServicesProps) {
  const t = useTranslations("services");

  const scrollToBooking = (serviceName?: string) => {
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
    if (serviceName) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("selectService", { detail: serviceName }));
      }, 600);
    }
  };

  return (
    <section id="services" className="py-28 bg-[#0D0D0D] relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px red-line opacity-30" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <SectionTitle title={t("title")} subtitle={t("subtitle")} number="01" />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5"
          style={{ perspective: "1200px" }}
        >
          {services.map((service, idx) => {
            const iconKey = SERVICE_ICON_KEYS[idx] ?? "plane";
            const Icon = ICONS[t(`items.${iconKey}.icon`)] ?? Plane;
            const localTitle = t(`items.${iconKey}.title`);
            const localDesc = t(`items.${iconKey}.desc`);

            return (
              <motion.div key={service.id} variants={item}>
                <TiltCard onClick={() => scrollToBooking(service.name)}>
                  <div className="bg-[#0D0D0D] hover:bg-[#141414] transition-colors duration-300 p-8 h-full group relative overflow-hidden">
                    {/* Number */}
                    <div className="number-label mb-6 opacity-40">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Icon */}
                    <div className="w-10 h-10 border border-white/10 group-hover:border-red-600/40 flex items-center justify-center mb-6 transition-colors duration-300">
                      <Icon size={18} className="text-red-500" aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <h3 className="font-serif text-xl text-white mb-3 leading-snug italic group-hover:text-red-100 transition-colors duration-300">
                      {localTitle}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 font-light">{localDesc}</p>

                    {service.price_from && (
                      <div className="text-xs text-gray-600 mb-5">
                        {t("from")}{" "}
                        <span className="text-white font-medium font-serif italic text-base">
                          {formatPrice(service.price_from)} {t("currency")}
                        </span>
                      </div>
                    )}

                    {/* CTA line */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                      <span className="text-[10px] text-gray-600 group-hover:text-red-500 transition-colors duration-300 uppercase tracking-[0.25em]">
                        {t("book")}
                      </span>
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        className="text-red-600/40 group-hover:text-red-500 transition-colors duration-300 text-lg"
                      >
                        →
                      </motion.span>
                    </div>

                    {/* 3D depth shadow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ boxShadow: "inset 0 0 40px rgba(220,38,38,0.04)" }} />
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-14"
        >
          <button
            onClick={() => scrollToBooking()}
            className="bg-red-600 hover:bg-red-700 text-white text-[11px] uppercase tracking-[0.25em] font-medium px-10 py-4 transition-all duration-300 cursor-pointer"
          >
            {t("book")}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
