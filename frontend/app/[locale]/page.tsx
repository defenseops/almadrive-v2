import { getServices, getServiceReviews } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import BookingForm from "@/components/sections/BookingForm";
import WhyUs from "@/components/sections/WhyUs";
import Reviews from "@/components/sections/Reviews";
import Contacts from "@/components/sections/Contacts";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://almadrive.kz";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${BASE_URL}/#business`,
  name: "AlmaDrive",
  description: "Премиальный трансфер и аренда автомобиля с водителем в Алматы. Аэропорт, деловые поездки, VIP-обслуживание.",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.png`,
  image: `${BASE_URL}/og-image.png`,
  telephone: "+7 777 000 00 00",
  email: "info@almadrive.kz",
  foundingDate: "2018",
  priceRange: "₸₸₸",
  currenciesAccepted: "KZT",
  paymentAccepted: "Cash, Credit Card",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Алматы",
    addressRegion: "Алматы",
    addressCountry: "KZ",
    postalCode: "050000",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.2220,
    longitude: 76.8512,
  },
  areaServed: [
    { "@type": "City", name: "Алматы" },
    { "@type": "Country", name: "Казахстан" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Услуги трансфера",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Трансфер из аэропорта" }, priceSpecification: { "@type": "PriceSpecification", price: "8000", priceCurrency: "KZT" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Почасовая аренда" }, priceSpecification: { "@type": "PriceSpecification", price: "10000", priceCurrency: "KZT" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "VIP трансфер" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Межгородской трансфер" }, priceSpecification: { "@type": "PriceSpecification", price: "30000", priceCurrency: "KZT" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Трансфер на мероприятия" }, priceSpecification: { "@type": "PriceSpecification", price: "20000", priceCurrency: "KZT" } },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "127",
  },
  sameAs: [
    "https://t.me/almadrive",
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AlmaDrive", item: BASE_URL },
  ],
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "AlmaDrive",
  description: "Премиальный трансфер в Алматы",
  inLanguage: ["ru-KZ", "en-US"],
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/ru?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [services, reviews] = await Promise.allSettled([
    getServices(),
    getServiceReviews(12),
  ]);

  const servicesData = services.status === "fulfilled" ? services.value : [];
  const reviewsData = reviews.status === "fulfilled" ? reviews.value : [];

  return (
    <main className="bg-dark min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <Header locale={locale} />
      <Hero />
      <Services services={servicesData} />
      <BookingForm />
      <WhyUs />
      <Reviews reviews={reviewsData} />
      <Contacts />
      <Footer locale={locale} />
    </main>
  );
}
