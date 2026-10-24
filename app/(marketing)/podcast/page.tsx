import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { Hero } from "@/components/sections/hero";
import { podcastEpisodes } from "@/lib/content/podcast-episodes";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Workshift by NillTech — Podcast",
  description: "{{PLACEHOLDER: meta description for /podcast, 150-160 characters}}",
  path: "/podcast",
});

export default function PodcastPage() {
  return (
    <>
      <Hero
        eyebrow="Workshift by NillTech"
        headline="{{PLACEHOLDER: /podcast hero headline}}"
        subheadline="{{PLACEHOLDER: /podcast hero subheadline}}"
        primaryCta="whatsapp"
      />
      <section className="py-16">
        <Container>
          {podcastEpisodes.length === 0 ? (
            <EmptyState message="No episodes published yet — check back soon." />
          ) : null}
        </Container>
      </section>
    </>
  );
}
