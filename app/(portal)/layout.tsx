import type { Metadata } from "next";

// The portal is private: never indexed (CLAUDE.md §10), and robots.ts
// already disallows /portal for crawlers that respect it.
export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-muted/40 min-h-screen">{children}</div>;
}
