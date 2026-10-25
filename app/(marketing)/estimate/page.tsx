import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

import { EstimateTabs } from "./estimate-tabs";

export const metadata: Metadata = buildMetadata({
  title: "Get an Estimate",
  description:
    "Free project cost estimator for websites, online stores and custom software in Kenya, plus an AI token cost calculator for Claude, ChatGPT and Gemini.",
  path: "/estimate",
});

export default function EstimatePage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold">Get an estimate</h1>
          <p className="text-muted-foreground mt-4">
            Two ways to get a number: a project quote for custom build work, or a monthly
            cost estimate for running AI in production. Both are indicative: a real quote
            follows a discovery call.
          </p>
        </div>

        <EstimateTabs />
      </Container>
    </section>
  );
}
