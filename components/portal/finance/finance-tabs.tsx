import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/portal/finance", label: "Overview" },
  { href: "/portal/finance/quotes", label: "Quotes" },
  { href: "/portal/finance/invoices", label: "Invoices" },
  { href: "/portal/finance/expenses", label: "Expenses" },
  { href: "/portal/finance/freelancers", label: "Freelancer pay" },
  { href: "/portal/finance/clients", label: "Clients" },
  { href: "/portal/finance/settings", label: "Settings" },
] as const;

export function FinanceTabs({ current }: { current: (typeof tabs)[number]["href"] }) {
  return (
    <nav aria-label="Finance" className="mb-6 flex flex-wrap gap-2">
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
