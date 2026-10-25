import Link from "next/link";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { courses } from "@/lib/content/courses";

/** Academy course catalogue — honest empty state until real courses exist (CLAUDE.md §2). */
export function CourseList() {
  return (
    <section id="courses" className="scroll-mt-20 py-16">
      <Container>
        <h2 className="text-2xl font-semibold">Free courses</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Start learning straight away — no sign-up needed.
        </p>
        <div className="mt-8">
          {courses.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Link
                    href={`/academy/${course.slug}`}
                    className="border-border bg-card hover:border-primary block h-full rounded-xl border p-5 transition-colors"
                  >
                    <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                      {course.level} · {course.lessons.length}{" "}
                      {course.lessons.length === 1 ? "lesson" : "lessons"} · Free
                    </p>
                    <h3 className="mt-2 font-semibold">{course.title}</h3>
                    <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                      {course.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Our first free courses are on the way — check back soon." />
          )}
        </div>
      </Container>
    </section>
  );
}
