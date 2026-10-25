"use client";

import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

export function TrackedLink({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: AnalyticsEvent;
  className?: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => trackEvent(event)}
      className={className}
    >
      {children}
    </a>
  );
}
