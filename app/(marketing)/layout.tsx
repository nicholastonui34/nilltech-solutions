import { AttributionCapture } from "@/components/analytics/attribution-capture";
import { CloudflareWebAnalytics } from "@/components/analytics/cloudflare-web-analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BookingFab } from "@/components/layout/booking-fab";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <BookingFab />
      <AttributionCapture />
      <CloudflareWebAnalytics />
    </>
  );
}
