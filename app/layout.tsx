import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site.config";
import { localBusinessSchema, organizationSchema, websiteSchema } from "@/lib/jsonld";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={localBusinessSchema()} />
        <JsonLd data={websiteSchema()} />
        {children}
      </body>
    </html>
  );
}
