import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SeoPageTemplate from "@/components/seo/SeoPageTemplate";
import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://almadrive.kz";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seoPages.airport.meta" });
  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/airport-transfer-almaty`,
      languages: {
        ru: `${BASE_URL}/ru/airport-transfer-almaty`,
        en: `${BASE_URL}/en/airport-transfer-almaty`,
        "x-default": `${BASE_URL}/ru/airport-transfer-almaty`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${BASE_URL}/${locale}/airport-transfer-almaty`,
      siteName: "AlmaDrive",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: locale === "ru" ? "en_US" : "ru_RU",
      type: "website",
      images: [{
        url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=85&w=1200",
        width: 1200,
        height: 800,
        alt: "AlmaDrive — airport-transfer-almaty",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=85&w=1200"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AirportTransferPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "ru" | "en")) notFound();

  const t = await getTranslations({ locale, namespace: "seoPages.airport" });

  const data = {
    hero: t.raw("hero") as { badge: string; title: string; titleAccent: string; subtitle: string; priceFrom: string },
    stats: t.raw("stats") as { value: string; label: string }[],
    features: t.raw("features") as { title: string; desc: string }[],
    process: t.raw("process") as { step: string; title: string; desc: string }[],
    faq: t.raw("faq") as { q: string; a: string }[],
    breadcrumb: t("breadcrumb"),
    bgImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=85&w=2560",
  };

  return (
    <>
      <Header locale={locale} />
      <SeoPageTemplate data={data} locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
