import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "NillTech Solutions is a managed technology delivery company in Nairobi, Kenya, building software and AI with screened East African teams since 2024.",
  path: "/about",
});

// Real founders only (CLAUDE.md §2). The section renders nothing until the
// owner supplies names, roles and bios.
const founders: { name: string; role: string; bio: string }[] = [];

const principles = [
  {
    title: "One accountable team",
    body: "You deal with one team and one contract. We recruit, manage and stand behind the people doing the work.",
  },
  {
    title: "Quality you don't have to check",
    body: "Every delivery goes through code review, testing and a QA checklist, then your sign-off, before it ships.",
  },
  {
    title: "Clear prices, in writing",
    body: "Published starting prices, an estimator anyone can use, and a fixed quote before work begins.",
  },
  {
    title: "East African talent, screened",
    body: "We hire across Kenya, Uganda, Tanzania and Rwanda, and every engineer completes a test task before joining a client team.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="py-20">
        <Container className="max-w-3xl">
          <p className="text-nilltech-purple text-sm font-medium tracking-[0.12em] uppercase">
            About
          </p>
          <h1 className="mt-4 text-4xl font-semibold">NillTech Solutions</h1>
          <div className="text-muted-foreground mt-6 space-y-4 text-lg leading-relaxed">
            <p>
              NillTech Solutions Ltd is a managed technology delivery company based in
              Nairobi, Kenya, registered in December 2024. We build websites, online
              stores, business systems, custom software and AI solutions, and we provide
              dedicated delivery teams for companies that need engineering capacity.
            </p>
            <p>
              We are not a freelancer marketplace and not a traditional agency. We build
              the team, manage the delivery and stay accountable for the result, so our
              clients own the outcome without having to manage the work. Our primary
              markets are Kenya, Uganda, Tanzania and Rwanda, and we also work with
              clients in the United States, the United Kingdom and Canada.
            </p>
          </div>

          <h2 className="mt-14 text-2xl font-semibold">How we work</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title}>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{p.body}</p>
              </div>
            ))}
          </div>

          {founders.length > 0 ? (
            <>
              <h2 className="mt-14 text-2xl font-semibold">Founders</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {founders.map((f) => (
                  <div key={f.name}>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-muted-foreground text-sm">{f.role}</p>
                    <p className="text-muted-foreground mt-2 text-sm">{f.bio}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <p className="text-muted-foreground mt-14 text-xs">
            Last updated: 25 October 2026
          </p>
        </Container>
      </section>

      <CtaBand
        heading="Let's build something together."
        body="Tell us what you need, and we'll show you how our team would deliver it."
        cta="discovery-call"
      />
    </>
  );
}
