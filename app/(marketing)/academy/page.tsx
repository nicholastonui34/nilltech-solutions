import type { Metadata } from "next";
import { BookOpen, GraduationCap, Users } from "lucide-react";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { CourseList } from "@/components/sections/course-list";
import { JsonLd } from "@/components/seo/json-ld";
import { courseSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "NillTech Academy";

export const metadata: Metadata = buildMetadata({
  title,
  description:
    "Free practical AI and software courses from NillTech Academy in Nairobi. No sign-up needed. Team training for companies across East Africa on request.",
  path: "/academy",
});

// "Start Free / Enrol" (CLAUDE.md §4) isn't one of the five standard CTA
// intents in §5. Free courses need no sign-up (see the Courses section);
// paid enrolment comes later, so the main CTA stays "contact-sales".
const data: OfferPageData = {
  eyebrow: "NillTech Academy",
  headline: "Learn the AI and software skills that get real work done.",
  subheadline:
    "Free, practical courses from the team that builds software and AI for businesses every day.",
  primaryCta: "contact-sales",
  summary:
    "NillTech Academy teaches practical AI and software skills, taught from real client work rather than theory. Free courses need no sign-up: open a course and start learning straight away. Paid courses and training for company teams are on the way.",
  audience: [
    "Learners starting out in software or AI",
    "Professionals switching into tech",
    "Companies upskilling their teams in AI",
  ],
  startingFrom: "Free",
  deliverables: [
    {
      icon: BookOpen,
      title: "Free courses",
      description:
        "Short, practical courses you can start right now, with no account or payment needed.",
      href: "/academy#courses",
    },
    {
      icon: GraduationCap,
      title: "Paid courses",
      description:
        "In-depth courses with projects, coming soon. Get in touch to hear when enrolment opens.",
      href: "/contact",
    },
    {
      icon: Users,
      title: "Team training",
      description:
        "AI and software training for your company's team, built around your tools and work. Contact us to plan it.",
      href: "/contact",
    },
  ],
  process: [
    {
      title: "Pick a course",
      description: "Browse the free courses below and choose where to start.",
    },
    {
      title: "Learn at your pace",
      description: "Work through short lessons whenever it suits you, on any device.",
    },
    {
      title: "Apply it",
      description:
        "Use what you learn on your own projects, or apply to join our delivery teams.",
    },
  ],
  faq: [
    {
      question: "Are the courses really free?",
      answer:
        "Yes. Free courses are open to everyone with no sign-up or payment. Paid courses, when they launch, will be clearly marked.",
    },
    {
      question: "Do I need experience to start?",
      answer:
        "No. Each course says who it's for and what you need before you start, and beginner courses assume no background.",
    },
    {
      question: "Can you train our company's team?",
      answer:
        "Yes. Contact us with your team's size and goals, and we'll plan training around the tools and work you already do.",
    },
  ],
  ctaHeading: "Want training for your team?",
  ctaBody:
    "Tell us what your team needs to learn, and we'll put together a plan and a price.",
};

export default function AcademyPage() {
  return (
    <>
      <JsonLd
        data={courseSchema({ name: title, description: data.summary, path: "/academy" })}
      />
      <OfferPageContent data={data} />
      <CourseList />
    </>
  );
}
