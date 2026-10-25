/**
 * NillTech Academy (CLAUDE.md §4, §17 Phase 7): free courses first, paid
 * later. Empty until the owner supplies the course list ({{INPUT NEEDED:
 * Academy course list & pricing}}) — never fake courses.
 *
 * To publish a course, add an entry below: its course page, lesson pages,
 * Course schema and sitemap entries all follow.
 */
export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  durationMinutes?: number;
  /** Optional YouTube video for the lesson (click-to-load). */
  youtubeId?: string;
  /** Lesson content, one paragraph per entry. */
  body: string[];
};

export type Course = {
  slug: string;
  title: string;
  /** Answer-first summary: what the learner will be able to do. */
  summary: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  audience: string[];
  outcomes: string[];
  /** Free courses only for now; paid tracks come later with enrolment. */
  isFree: true;
  lessons: Lesson[];
};

export const courses: Course[] = [];

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getLesson(courseSlug: string, lessonSlug: string) {
  const course = getCourseBySlug(courseSlug);
  if (!course) return null;
  const index = course.lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) return null;
  return {
    course,
    lesson: course.lessons[index],
    previous: course.lessons[index - 1] ?? null,
    next: course.lessons[index + 1] ?? null,
  };
}
