import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/portal/sales", label: "Leads" },
  { href: "/portal/sales/bookings", label: "Bookings" },
  { href: "/portal/sales/availability", label: "Availability" },
  { href: "/portal/sales/chat", label: "Live chat" },
] as const;

export function SalesTabs({ current }: { current: (typeof tabs)[number]["href"] }) {
  return (
    <nav aria-label="Sales" className="mb-6 flex flex-wrap gap-2">
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
