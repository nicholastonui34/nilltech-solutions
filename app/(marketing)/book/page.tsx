import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingWidget } from "@/components/booking/booking-widget";
import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Book a Call",
  description:
    "Book a free 30-minute call with NillTech Solutions: a discovery call about your project or team, an AI demo, or a sales and partnerships conversation. Pick a time online.",
  path: "/book",
});

// The page is a static shell; free times load in the browser (the widget
// reads ?type= and fetches availability), so the slot list is always live.
export default function BookPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <h1 className="text-4xl font-semibold">Book a call</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          Pick a time for a free 30-minute call with our team. Tell us what you&rsquo;re
          working on and you&rsquo;ll leave with a clear next step, whether that&rsquo;s a
          project plan, a team proposal or a demo.
        </p>
        {/* Reserves the form's height (measured: about 1,650 px on phones,
            1,110 px from sm up) so nothing jumps when it renders (CLS). */}
        <div className="mt-12 min-h-[1650px] sm:min-h-[1110px]">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm" role="status">
                Loading the booking form…
              </p>
            }
          >
            <BookingWidget />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
