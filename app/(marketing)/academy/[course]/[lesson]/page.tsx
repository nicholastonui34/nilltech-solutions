import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Container } from "@/components/sections/container";
import { YoutubeFacade } from "@/components/sections/youtube-facade";
import { JsonLd } from "@/components/seo/json-ld";
import { getLesson } from "@/lib/content/courses";
import { breadcrumbSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

// See ../page.tsx — dynamic until the first course exists.
export const instant = false;

type Params = Promise<{ course: string; lesson: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { course, lesson } = await params;
  const found = getLesson(course, lesson);
  if (!found) return {};
  return buildMetadata({
    title: `${found.lesson.title} — ${found.course.title}`,
    description: found.lesson.summary,
    path: `/academy/${course}/${lesson}`,
  });
}

export default async function LessonPage({ params }: { params: Params }) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const found = getLesson(courseSlug, lessonSlug);
  if (!found) notFound();
  const { course, lesson, previous, next } = found;
  const position = course.lessons.indexOf(lesson) + 1;

  return (
    <article className="py-20">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Academy", path: "/academy" },
          { name: course.title, path: `/academy/${course.slug}` },
          { name: lesson.title, path: `/academy/${course.slug}/${lesson.slug}` },
        ])}
      />
      <Container className="max-w-3xl">
        <Link
          href={`/academy/${course.slug}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> {course.title}
        </Link>
        <p className="text-primary mt-8 text-xs font-semibold tracking-widest uppercase">
          Lesson {position} of {course.lessons.length}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{lesson.title}</h1>
        <p className="text-muted-foreground mt-3">{lesson.summary}</p>

        {lesson.youtubeId ? (
          <div className="mt-8">
            <YoutubeFacade videoId={lesson.youtubeId} title={lesson.title} />
          </div>
        ) : null}

        <div className="mt-8 space-y-4 leading-relaxed">
          {lesson.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <nav
          aria-label="Lesson navigation"
          className="border-border mt-12 flex justify-between gap-4 border-t pt-6 text-sm"
        >
          {previous ? (
            <Link
              href={`/academy/${course.slug}/${previous.slug}`}
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="size-4" /> {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/academy/${course.slug}/${next.slug}`}
              className="text-primary inline-flex items-center gap-1 text-right hover:underline"
            >
              {next.title} <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              href={`/academy/${course.slug}`}
              className="text-primary hover:underline"
            >
              Back to course overview
            </Link>
          )}
        </nav>
      </Container>
    </article>
  );
}
