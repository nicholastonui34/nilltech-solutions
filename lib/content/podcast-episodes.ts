export type PodcastEpisode = {
  slug: string;
  title: string;
  summary: string;
  youtubeId: string;
};

/**
 * {{INPUT NEEDED: YouTube channel URL, episode list}} — CLAUDE.md §12/§18.
 * Empty until the owner supplies real episodes; the podcast index renders
 * an honest "coming soon" state rather than fake episode cards.
 */
export const podcastEpisodes: PodcastEpisode[] = [];
