/**
 * "Workshift by NillTech" (CLAUDE.md §12). Empty until the owner supplies
 * real episodes ({{INPUT NEEDED: YouTube channel URL, episode list}}) —
 * pages render an honest empty state, never fake episodes.
 *
 * To publish an episode, add an entry below: the episode page, its
 * PodcastEpisode/VideoObject schema and its sitemap entry all follow.
 */
export type PodcastEpisode = {
  slug: string;
  /** Episode number in the series. */
  number: number;
  title: string;
  /** Answer-first summary: 2–3 sentences on what the episode answers. */
  summary: string;
  /** YYYY-MM-DD */
  publishedAt: string;
  /** The 11-character YouTube video ID of the full episode. */
  youtubeId: string;
  /** ISO 8601 duration, e.g. "PT42M10S". */
  duration?: string;
  keyTakeaways: string[];
  chapters: { start: string; title: string }[];
  guests: { name: string; role?: string; url?: string }[];
  /** Crawlable transcript, one paragraph per entry. */
  transcript: string[];
  topics: PodcastTopic[];
};

/** Topics from CLAUDE.md §12. */
export const PODCAST_TOPICS = [
  "Services",
  "Remote work",
  "Managed remote teams",
  "Remote work and AI",
  "Insights",
] as const;

export type PodcastTopic = (typeof PODCAST_TOPICS)[number];

export type PodcastShort = {
  youtubeId: string;
  title: string;
  /** Slug of the full episode this Short is cut from, if any. */
  episodeSlug?: string;
};

export const podcast = {
  name: "Workshift by NillTech",
  description: "{{PLACEHOLDER: one-paragraph description of the Workshift podcast}}",
  /** Set once the channel exists — subscribe links stay hidden until then (no links to nothing). */
  youtubeChannelUrl: null as string | null,
};

export const podcastEpisodes: PodcastEpisode[] = [];

export const podcastShorts: PodcastShort[] = [];

export function getEpisodeBySlug(slug: string) {
  return podcastEpisodes.find((episode) => episode.slug === slug);
}
