import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://almadrive.kz";
const LOCALES = ["ru", "en"] as const;

const PAGES = [
  { path: "",                              priority: 1.0, changeFrequency: "weekly"  },
  { path: "/airport-transfer-almaty",      priority: 0.95, changeFrequency: "monthly" },
  { path: "/chauffeur-service-almaty",     priority: 0.9,  changeFrequency: "monthly" },
  { path: "/vip-transfer-almaty",          priority: 0.9,  changeFrequency: "monthly" },
  { path: "/intercity-transfer-almaty",    priority: 0.85, changeFrequency: "monthly" },
  { path: "/events-transfer-almaty",       priority: 0.85, changeFrequency: "monthly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${BASE_URL}/${l}${page.path}`])
          ),
        },
      });
    }
  }

  return entries;
}
