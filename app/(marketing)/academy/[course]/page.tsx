import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, PlayCircle } from "lucide-react";

import { Container } from "@/components/sections/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getCourseBySlug } from "@/lib/content/courses";
import { academyCourseSchema, breadcrumbSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

// No courses yet; Cache Components rejects an empty generateStaticParams.
// Switch to generateStaticParams once the first course is published.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return {};
  return buildMetadata({
    title: `${course.title} | NillTech Academy`,
    description: course.summary,
    path: `/academy/${course.slug}`,
  });
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const first = course.lessons[0];

  return (
    <section className="py-20">
      <JsonLd data={academyCourseSchema(course)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Academy", path: "/academy" },
          { name: course.title, path: `/academy/${course.slug}` },
        ])}
      />
      <Container className="max-w-3xl">
        <Link
          href="/academy#courses"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> All courses
        </Link>
        <p className="text-primary mt-8 text-xs font-semibold tracking-widest uppercase">
          NillTech Academy · {course.level} · Free
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{course.title}</h1>
        <p className="mt-4 text-lg">{course.summary}</p>
        {first ? (
          <Button asChild size="lg" className="mt-6">
            <Link href={`/academy/${course.slug}/${first.slug}`}>Start free</Link>
          </Button>
        ) : null}

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {course.outcomes.length ? (
            <div>
              <h2 className="text-lg font-semibold">What you&rsquo;ll learn</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {course.audience.length ? (
            <div>
              <h2 className="text-lg font-semibold">Who it&rsquo;s for</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {course.audience.map((who) => (
                  <li key={who}>{who}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <h2 className="mt-12 text-lg font-semibold">Lessons</h2>
        <ol className="border-border mt-3 divide-y rounded-xl border">
          {course.lessons.map((lesson, index) => (
            <li key={lesson.slug}>
              <Link
                href={`/academy/${course.slug}/${lesson.slug}`}
                className="hover:bg-muted/50 flex items-start gap-3 p-4 transition-colors"
              >
                <span className="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1">
                  <span className="font-medium">{lesson.title}</span>
                  <span className="text-muted-foreground block text-sm">
                    {lesson.summary}
                  </span>
                </span>
                {lesson.youtubeId ? (
                  <PlayCircle
                    className="text-muted-foreground size-4 shrink-0"
                    aria-label="Video"
                  />
                ) : null}
                {lesson.durationMinutes ? (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {lesson.durationMinutes} min
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
