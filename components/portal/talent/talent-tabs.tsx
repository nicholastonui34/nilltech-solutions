import Link from "next/link";

import type { TalentStage } from "@/lib/talent/options";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/portal/talent", label: "Profile", approvedOnly: false },
  { href: "/portal/talent/tasks", label: "Test tasks", approvedOnly: false },
  { href: "/portal/talent/projects", label: "Projects", approvedOnly: true },
  { href: "/portal/talent/payments", label: "Payments", approvedOnly: true },
  { href: "/portal/talent/documents", label: "Documents", approvedOnly: false },
] as const;

export type TalentTab = (typeof tabs)[number]["href"];

/** Freelancer portal tabs. Projects and payments only appear once approved. */
export function TalentTabs({
  current,
  stage,
}: {
  current: TalentTab;
  stage: TalentStage;
}) {
  return (
    <nav aria-label="Your portal" className="mb-6 flex flex-wrap gap-2">
      {tabs
        .filter((tab) => !tab.approvedOnly || stage === "approved")
        .map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === current ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              tab.href === current
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary",
            )}
          >
            {tab.label}
          </Link>
        ))}
    </nav>
  );
}
