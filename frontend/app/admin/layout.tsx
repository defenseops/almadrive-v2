import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "../globals.css";

const jost = Jost({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jost",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Admin — AlmaDrive",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={jost.variable}>
      <body className="bg-[#0D0D0D] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
