import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Mail } from "lucide-react";

import { Container } from "@/components/sections/container";
import { TrackedLink } from "@/components/sections/tracked-link";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site.config";
import { getJobBySlug, jobApplicationHref, jobs } from "@/lib/content/jobs";
import { breadcrumbSchema, jobPostingSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};
  return buildMetadata({
    title: `${job.title} | Careers`,
    description: job.summary,
    path: `/careers/${job.slug}`,
  });
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-border bg-card rounded-xl border p-6">
      <h2 className="text-primary text-xs font-semibold tracking-widest uppercase">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm">
            <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  return (
    <section className="py-20">
      <JsonLd data={jobPostingSchema(job)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Careers", path: "/careers" },
          { name: job.title, path: `/careers/${job.slug}` },
        ])}
      />
      <Container className="max-w-3xl">
        <Link
          href="/careers"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> All roles
        </Link>

        <p className="text-primary mt-8 text-xs font-semibold tracking-widest uppercase">
          Now hiring · Founding team · {job.sequence}
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{job.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {siteConfig.legalName} · {siteConfig.address.locality},{" "}
          {siteConfig.address.country}
        </p>
        <p className="mt-6 text-lg">{job.summary}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <List title="What you'll own" items={job.responsibilities} />
          <List title="Who you are" items={job.requirements} />
        </div>

        <div className="border-border bg-card mt-10 rounded-xl border p-6">
          <h2 className="text-lg font-semibold">How to apply</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Send your CV and a short note on why you want to join.
          </p>
          <TrackedLink
            href={jobApplicationHref(job, siteConfig.contact.email)}
            event="cta_click"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-6 py-2 text-sm font-medium transition-colors"
          >
            <Mail className="size-4" aria-hidden="true" /> Apply by email
          </TrackedLink>
          <p className="text-muted-foreground mt-2 text-xs">
            Or write to {siteConfig.contact.email} with &ldquo;Application: {job.title}
            &rdquo; as the subject.
          </p>
        </div>
      </Container>
    </section>
  );
}
