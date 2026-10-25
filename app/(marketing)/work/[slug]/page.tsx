import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/jsonld";
import { getCaseStudyBySlug } from "@/lib/content/case-studies";
import { buildMetadata } from "@/lib/seo";

// No generateStaticParams: Next 16 Cache Components requires it to return
// at least one result, and there are zero case studies yet. `instant =
// false` allows this dynamic route to render per-request (blocking, no
// prerender) instead — correct anyway, since every slug currently 404s
// via notFound() below. Revisit once real case studies exist (switch to
// static generation then).
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  return buildMetadata({
    title: study.title,
    description: study.summary,
    path: `/work/${slug}`,
  });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  return (
    <section className="py-20">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Case Studies", path: "/work" },
          { name: study.title, path: `/work/${slug}` },
        ])}
      />
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold">{study.title}</h1>
        <p className="text-muted-foreground mt-4">{study.summary}</p>
      </Container>
    </section>
  );
}
