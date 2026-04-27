"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "#services", key: "services" },
  { href: "#booking", key: "booking" },
  { href: "#whyus", key: "whyUs" },
  { href: "#contacts", key: "contacts" },
];

export default function Header({ locale = "ru" }: { locale?: string }) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const otherLocale = locale === "ru" ? "en" : "ru";
  const switchLocale = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0D0D0D]/92 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <Image
              src="/favicon.png"
              alt="AlmaDrive"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-serif text-base tracking-[0.15em] text-white uppercase">
              Alma<span className="text-red-600">Drive</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ href, key }) => (
              <button
                key={key}
                onClick={() => scrollTo(href)}
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer relative group"
              >
                {t(key)}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-red-600 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={switchLocale}
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 transition-all duration-300 cursor-pointer"
            >
              {otherLocale}
            </button>
            <button
              onClick={() => scrollTo("#booking")}
              className="hidden lg:flex items-center border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white text-[10px] uppercase tracking-[0.25em] font-medium px-5 py-2.5 transition-all duration-300 cursor-pointer"
            >
              Забронировать
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden text-white p-1 cursor-pointer"
              aria-label="Меню"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[#0D0D0D] flex flex-col items-center justify-center gap-8"
            role="dialog"
            aria-modal="true"
          >
            {NAV_LINKS.map(({ href, key }, i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                onClick={() => scrollTo(href)}
                className="text-3xl font-serif italic text-white hover:text-red-500 transition-colors duration-200 cursor-pointer"
              >
                {t(key)}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => scrollTo("#booking")}
              className="mt-4 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-sm uppercase tracking-[0.2em] px-8 py-3 transition-all duration-300 cursor-pointer"
            >
              Забронировать
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
