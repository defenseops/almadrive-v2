"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";

export default function Contacts() {
  const t = useTranslations("contacts");
  const phone = t("phone");
  const waPhone = phone.replace(/\D/g, "");

  const details = [
    { Icon: Mail, label: "Email", value: t("email"), href: `mailto:${t("email")}` },
    { Icon: MapPin, label: "Адрес", value: t("address"), href: undefined },
    { Icon: Clock, label: "Режим работы", value: t("hours"), href: undefined },
  ];

  return (
    <section id="contacts" className="py-28 bg-[#111111] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px red-line opacity-20" />

      {/* Background car silhouette */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552519507-da3b142a6f3d?q=10&w=1200"
          alt=""
          className="w-full h-full object-cover object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-transparent to-[#111111]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <SectionTitle title={t("title")} subtitle={t("subtitle")} number="05" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Phone block */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0D0D0D] border border-white/6 p-8 md:p-10 flex flex-col justify-between min-h-64"
          >
            <div>
              <div className="number-label mb-3 opacity-40">{t("hours")}</div>
              <a
                href={`tel:${phone}`}
                className="font-serif text-4xl md:text-5xl text-white hover:text-red-400 transition-colors duration-300 block mb-8 italic"
              >
                {phone}
              </a>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={`tel:${phone}`} className="flex-1">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-[0.25em] font-medium py-3.5 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer">
                    <Phone size={14} aria-hidden="true" />
                    {t("callBtn")}
                  </button>
                </a>
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <button className="w-full border border-white/15 text-white hover:border-red-600/50 text-[10px] uppercase tracking-[0.25em] font-medium py-3.5 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer">
                    <MessageCircle size={14} aria-hidden="true" />
                    {t("whatsappBtn")}
                  </button>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-white/6 mt-6">
              <a href="https://t.me/almadrive" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors duration-300 group">
                <Send size={14} className="text-red-600" aria-hidden="true" />
                <span className="text-sm font-light">Telegram</span>
              </a>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-0 border border-white/6 bg-[#0D0D0D]"
          >
            {details.map(({ Icon, label, value, href }, i) => (
              <div
                key={label}
                className={`group flex items-start gap-5 p-6 ${i < details.length - 1 ? "border-b border-white/6" : ""} hover:bg-[#141414] transition-colors duration-300`}
              >
                <div className="w-9 h-9 border border-white/10 group-hover:border-red-600/40 flex items-center justify-center shrink-0 transition-colors duration-300">
                  <Icon size={15} className="text-red-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] mb-1 font-sans">{label}</p>
                  {href ? (
                    <a href={href} className="text-white hover:text-red-400 transition-colors duration-300 font-light">{value}</a>
                  ) : (
                    <p className="text-white font-light">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
