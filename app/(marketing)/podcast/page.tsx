import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { Hero } from "@/components/sections/hero";
import { YoutubeFacade } from "@/components/sections/youtube-facade";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import {
  podcast,
  PODCAST_TOPICS,
  podcastEpisodes,
  podcastShorts,
} from "@/lib/content/podcast-episodes";
import { formatDate } from "@/lib/format";
import { podcastSeriesSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Workshift by NillTech | Podcast",
  description:
    "Workshift by NillTech: a podcast on remote work, managed teams and how AI is changing the way work gets done, from Nairobi, Kenya.",
  path: "/podcast",
});

const episodes = [...podcastEpisodes].sort((a, b) => b.number - a.number);

export default function PodcastPage() {
  return (
    <>
      <JsonLd
        data={podcastSeriesSchema({
          name: podcast.name,
          description: podcast.description,
          channelUrl: podcast.youtubeChannelUrl,
        })}
      />
      <Hero
        eyebrow={podcast.name}
        headline="Conversations on how work is changing."
        subheadline="Remote work, managed teams and AI at work, with the people building the future of work in Africa and beyond."
        primaryCta="discovery-call"
      />

      <section className="py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Episodes</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Topics: {PODCAST_TOPICS.join(" · ")}
              </p>
            </div>
            {podcast.youtubeChannelUrl ? (
              <Button asChild variant="outline">
                <a
                  href={podcast.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe on YouTube{" "}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </div>

          <div className="mt-8">
            {episodes.length ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {episodes.map((episode) => (
                  <li key={episode.slug}>
                    <Link
                      href={`/podcast/${episode.slug}`}
                      className="border-border bg-card hover:border-primary group block h-full rounded-xl border p-5 transition-colors"
                    >
                      <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                        Episode {episode.number} · {formatDate(episode.publishedAt)}
                      </p>
                      <h3 className="mt-2 font-semibold">{episode.title}</h3>
                      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                        {episode.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No episodes published yet. Check back soon." />
            )}
          </div>
        </Container>
      </section>

      {/* Shorts render nothing until real ones exist (CLAUDE.md §2). */}
      {podcastShorts.length ? (
        <section className="bg-muted/40 py-16">
          <Container>
            <h2 className="text-2xl font-semibold">Shorts</h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {podcastShorts.map((short) => (
                <li key={short.youtubeId}>
                  <YoutubeFacade videoId={short.youtubeId} title={short.title} vertical />
                  <p className="mt-2 line-clamp-2 text-sm">{short.title}</p>
                  {short.episodeSlug ? (
                    <Link
                      href={`/podcast/${short.episodeSlug}`}
                      className="text-primary text-xs hover:underline"
                    >
                      Full episode
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
