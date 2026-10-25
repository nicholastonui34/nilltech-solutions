import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Container } from "@/components/sections/container";
import { ShareButtons } from "@/components/sections/share-buttons";
import { YoutubeFacade } from "@/components/sections/youtube-facade";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site.config";
import { getEpisodeBySlug, podcast } from "@/lib/content/podcast-episodes";
import { formatDate } from "@/lib/format";
import { breadcrumbSchema, podcastEpisodeSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

// No episodes yet, and Cache Components rejects an empty
// generateStaticParams — same approach as /work/[slug]. Switch to
// generateStaticParams once the first episode is published.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) return {};
  return buildMetadata({
    title: `${episode.title} | ${podcast.name}`,
    description: episode.summary,
    path: `/podcast/${episode.slug}`,
  });
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) notFound();

  const url = `${siteConfig.url}/podcast/${episode.slug}`;

  return (
    <article className="py-20">
      <JsonLd data={podcastEpisodeSchema(episode, podcast.name)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Podcast", path: "/podcast" },
          { name: episode.title, path: `/podcast/${episode.slug}` },
        ])}
      />
      <Container className="max-w-3xl">
        <Link
          href="/podcast"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> All episodes
        </Link>

        <p className="text-primary mt-8 text-xs font-semibold tracking-widest uppercase">
          {podcast.name} · Episode {episode.number} · {formatDate(episode.publishedAt)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{episode.title}</h1>
        <p className="mt-4 text-lg">{episode.summary}</p>

        <div className="mt-8">
          <YoutubeFacade videoId={episode.youtubeId} title={episode.title} />
          <a
            href={`https://www.youtube.com/watch?v=${episode.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-3 inline-flex items-center gap-1 text-sm hover:underline"
          >
            Watch full episode on YouTube{" "}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-6">
          <ShareButtons url={url} title={episode.title} />
        </div>

        {episode.keyTakeaways.length ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Key takeaways</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {episode.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {episode.guests.length ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Guests</h2>
            <ul className="mt-4 space-y-2">
              {episode.guests.map((guest) => (
                <li key={guest.name}>
                  {guest.url ? (
                    <a
                      href={guest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    >
                      {guest.name}
                    </a>
                  ) : (
                    <span className="font-medium">{guest.name}</span>
                  )}
                  {guest.role ? (
                    <span className="text-muted-foreground">, {guest.role}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {episode.chapters.length ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Chapters</h2>
            <ol className="mt-4 space-y-1 text-sm">
              {episode.chapters.map((chapter) => (
                <li key={chapter.start} className="flex gap-3">
                  <span className="text-muted-foreground w-14 shrink-0 tabular-nums">
                    {chapter.start}
                  </span>
                  {chapter.title}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {episode.transcript.length ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Transcript</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed">
              {episode.transcript.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </article>
  );
}
