export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
};

/** Empty until real posts exist — CLAUDE.md §2, render nothing fake. */
export const blogPosts: BlogPost[] = [];
