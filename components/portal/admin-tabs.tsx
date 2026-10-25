import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/portal/admin", label: "System health" },
  { href: "/portal/admin/users", label: "Users & roles" },
  { href: "/portal/admin/audit", label: "Audit log" },
] as const;

export function AdminTabs({ current }: { current: (typeof tabs)[number]["href"] }) {
  return (
    <nav aria-label="Main Admin" className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
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
