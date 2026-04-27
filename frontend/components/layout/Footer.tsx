import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer({ locale = "ru" }: { locale?: string }) {
  const t = useTranslations("footer");
  const tContacts = useTranslations("contacts");

  return (
    <footer className="bg-[#0D0D0D] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/favicon.png"
                alt="AlmaDrive"
                width={48}
                height={48}
                className="object-contain"
              />
              <span className="font-serif text-base tracking-[0.15em] text-white uppercase">
                Alma<span className="text-red-600">Drive</span>
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs font-light">
              Премиальный трансфер и аренда автомобиля с водителем в Алматы
            </p>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white font-sans font-medium mb-5 text-[10px] uppercase tracking-[0.3em]">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${tContacts("phone")}`} className="flex items-center gap-2.5 text-gray-600 hover:text-white transition-colors duration-300 text-sm font-light">
                  <Phone size={12} className="text-red-600 shrink-0" aria-hidden="true" />
                  {tContacts("phone")}
                </a>
              </li>
              <li>
                <a href={`mailto:${tContacts("email")}`} className="flex items-center gap-2.5 text-gray-600 hover:text-white transition-colors duration-300 text-sm font-light">
                  <Mail size={12} className="text-red-600 shrink-0" aria-hidden="true" />
                  {tContacts("email")}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-gray-600 text-sm font-light">
                <MapPin size={12} className="text-red-600 shrink-0" aria-hidden="true" />
                {tContacts("address")}
              </li>
            </ul>
          </div>

          {/* SEO links */}
          <div>
            <h3 className="text-white font-sans font-medium mb-5 text-[10px] uppercase tracking-[0.3em]">Услуги</h3>
            <ul className="space-y-2.5">
              {[
                { href: `/${locale}/airport-transfer-almaty`, label: "Трансфер аэропорт" },
                { href: `/${locale}/chauffeur-service-almaty`, label: "Аренда с водителем" },
                { href: `/${locale}/vip-transfer-almaty`, label: "VIP трансфер" },
                { href: `/${locale}/intercity-transfer-almaty`, label: "Межгородской трансфер" },
                { href: `/${locale}/events-transfer-almaty`, label: "Трансфер на мероприятия" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-600 text-sm hover:text-red-400 transition-colors duration-300 font-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-700 text-xs font-light">{t("rights")}</p>
          <button className="text-gray-700 text-xs hover:text-gray-400 cursor-pointer transition-colors duration-300 font-light">
            {t("privacy")}
          </button>
        </div>
      </div>
    </footer>
  );
}
