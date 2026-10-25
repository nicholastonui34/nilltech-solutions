import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type ServiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  // Action-specific link text (CLAUDE.md §5: never a generic "Learn more").
  linkLabel: string;
};

/**
 * Signature offer/deliverable card — matches the Figma "Service Card"
 * component: gradient accent bar (purple→blue, echoes the brand mark),
 * gold icon badge, elevation on hover.
 */
export function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  linkLabel,
}: ServiceCardProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg">
      <div
        className="from-nilltech-purple to-nilltech-blue h-1 w-full bg-gradient-to-r"
        aria-hidden
      />
      <div className="flex flex-col gap-4 p-6">
        <div className="bg-nilltech-gold/15 flex size-12 items-center justify-center rounded-xl">
          <Icon className="text-nilltech-gold size-5" aria-hidden />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        <Link
          href={href}
          className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
