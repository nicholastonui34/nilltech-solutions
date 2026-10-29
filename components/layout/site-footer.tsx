import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { Container } from "@/components/sections/container";
import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site.config";

export function SiteFooter() {
  return (
    <footer className="border-border bg-nilltech-navy border-t">
      <Container className="flex flex-col gap-10 py-16 text-white/70">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <BrandMark size={44} />
              <p className="text-base font-semibold text-white">{siteConfig.name}</p>
            </div>
            <p className="mt-2 text-sm">{siteConfig.tagline}</p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-3 sm:flex sm:gap-10"
          >
            {footerNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm">
            <p>
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                {siteConfig.contact.email}
              </a>
            </p>
            <p className="mt-1">
              <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-white">
                {siteConfig.contact.phoneDisplay}
              </a>
            </p>
            <p className="mt-1">
              {siteConfig.address.locality}, {siteConfig.address.country}
            </p>
          </div>
        </div>

        <p className="border-t border-white/10 pt-6 text-xs text-white/60">
          {/* Static, not Date.now() — Next 16 Cache Components rejects non-deterministic values at prerender. Bump yearly. */}
          &copy; 2026 {siteConfig.legalName}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
