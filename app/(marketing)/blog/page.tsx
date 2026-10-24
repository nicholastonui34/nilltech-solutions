import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { blogPosts } from "@/lib/content/blog-posts";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Insights",
  description: "{{PLACEHOLDER: meta description for /blog, 150-160 characters}}",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <section className="py-20">
      <Container>
        <h1 className="mb-10 text-4xl font-semibold">Insights</h1>
        {blogPosts.length === 0 ? (
          <EmptyState message="No posts published yet — check back soon." />
        ) : null}
      </Container>
    </section>
  );
}
